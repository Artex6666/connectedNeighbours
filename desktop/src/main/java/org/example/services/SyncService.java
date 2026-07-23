package org.example.services;

import javafx.application.Platform;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import org.example.Alerte;
import org.example.Conflit;
import org.example.Incident;
import org.example.database.AlerteDAO;
import org.example.database.ConflitDAO;
import org.example.database.IncidentDAO;
import org.json.JSONArray;
import org.json.JSONObject;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Orchestre la synchronisation entre la base SQLite locale et l'API.
 * Pousse périodiquement les incidents et alertes modifiés hors ligne,
 * récupère les données du serveur, détecte les conflits et publie
 * l'état de synchronisation observable par l'interface JavaFX.
 */
public class SyncService {

    private static final SimpleStringProperty statut = new SimpleStringProperty("Non synchronisé");
    private static final SimpleIntegerProperty nbConflits = new SimpleIntegerProperty(0);
    private static ScheduledExecutorService scheduler;
    private static volatile boolean modeHorsLigneSimule = false;
    private static final java.util.List<Runnable> listenersSyncTerminee = new java.util.ArrayList<>();

    private static final IncidentDAO incidentDAO = new IncidentDAO();
    private static final AlerteDAO alerteDAO = new AlerteDAO();
    private static final ConflitDAO conflitDAO = new ConflitDAO();

    public static SimpleStringProperty statutProperty() { return statut; }
    public static SimpleIntegerProperty nbConflitsProperty() { return nbConflits; }

    /**
     * Active ou désactive le mode hors ligne simulé et met à jour le statut affiché.
     */
    public static void basculerModeHorsLigne() {
        modeHorsLigneSimule = !modeHorsLigneSimule;
        setStatut(modeHorsLigneSimule ? "Hors ligne (simulé)" : "Non synchronisé");
    }

    public static boolean estHorsLigneSimule() { return modeHorsLigneSimule; }

    /**
     * Enregistre une action à exécuter après chaque synchronisation réussie.
     * @param listener action exécutée sur le thread JavaFX
     */
    public static void ajouterListenerSyncTerminee(Runnable listener) {
        listenersSyncTerminee.add(listener);
    }

    /**
     * Retire une action précédemment enregistrée après synchronisation.
     * @param listener action à retirer
     */
    public static void retirerListenerSyncTerminee(Runnable listener) {
        listenersSyncTerminee.remove(listener);
    }

    /**
     * Démarre la synchronisation périodique en tâche de fond
     * (première exécution après 5 s, puis toutes les 30 s).
     */
    public static void demarrer() {
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "sync-thread");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleAtFixedRate(SyncService::synchroniser, 5, 30, TimeUnit.SECONDS);
    }

    /**
     * Arrête l'ordonnanceur de synchronisation périodique.
     */
    public static void arreter() {
        if (scheduler != null) scheduler.shutdown();
    }

    /**
     * Déclenche immédiatement une synchronisation sur le thread de fond,
     * sans attendre la prochaine exécution planifiée.
     */
    public static void synchroniserMaintenant() {
        if (scheduler != null) scheduler.execute(SyncService::synchroniser);
    }

    private static void synchroniser() {
        ApiClient api = SessionManager.getApiClient();

        if (modeHorsLigneSimule) {
            setStatut("Hors ligne (simulé)");
            return;
        }

        if (!SessionManager.estConnecte()) {
            setStatut("Non connecté");
            return;
        }

        if (!api.ping()) {
            setStatut("Hors ligne");
            return;
        }

        setStatut("Synchronisation...");

        try {
            pushIncidents(api);
            pushAlertes(api);
            pullIncidents(api);
            pullAlertes(api);

            String heure = java.time.LocalTime.now().withNano(0).toString();
            setStatut("Synchronisé à " + heure);
            Platform.runLater(() -> listenersSyncTerminee.forEach(Runnable::run));
        } catch (Exception e) {
            setStatut("Erreur de synchronisation");
            System.err.println("SyncService : " + e.getMessage());
        }

        int nb = conflitDAO.count();
        Platform.runLater(() -> nbConflits.set(nb));
    }

    // ── PUSH ──────────────────────────────────────────────────────────────────

    private static void pushIncidents(ApiClient api) throws Exception {
        for (Incident inc : incidentDAO.findDirty()) {
            String now = Instant.now().toString();

            if (inc.isLocalOnly()) {
                String reponse = api.post("/incidents", incidentToJson(inc).toString());
                JSONObject obj = new JSONObject(reponse);
                String serverId = obj.optString("_id", obj.optString("id", null));
                if (serverId != null && !serverId.isEmpty()) {
                    incidentDAO.updateId(inc.getId(), serverId);
                    incidentDAO.markSynced(serverId, now);
                } else {
                    incidentDAO.markSynced(inc.getId(), now);
                }
                continue;
            }

            // L'entité existe déjà côté serveur : on vérifie qu'elle n'a pas été modifiée
            // là-bas depuis notre dernière synchro avant d'écraser avec notre version locale.
            JSONObject serveur = parseObject(api.get("/incidents/" + inc.getId()));
            String serverUpdatedAt = serveur.optString("updatedAt", serveur.optString("updated_at", ""));

            if (inc.getSyncedAt() != null && !serverUpdatedAt.isEmpty()
                    && serverUpdatedAt.compareTo(inc.getSyncedAt()) > 0) {
                enregistrerConflit("incident", inc.getId(), incidentToJson(inc), serveur);
                continue;
            }

            api.put("/incidents/" + inc.getId(), incidentToJson(inc).toString());
            incidentDAO.markSynced(inc.getId(), now);
        }
    }

    private static void pushAlertes(ApiClient api) throws Exception {
        for (Alerte al : alerteDAO.findDirty()) {
            String now = Instant.now().toString();

            if (al.isLocalOnly()) {
                String reponse = api.post("/alertes", alerteToJson(al).toString());
                JSONObject obj = new JSONObject(reponse);
                String serverId = obj.optString("_id", obj.optString("id", null));
                if (serverId != null && !serverId.isEmpty()) {
                    alerteDAO.updateId(al.getId(), serverId);
                    alerteDAO.markSynced(serverId, now);
                } else {
                    alerteDAO.markSynced(al.getId(), now);
                }
                continue;
            }

            JSONObject serveur = parseObject(api.get("/alertes/" + al.getId()));
            String serverUpdatedAt = serveur.optString("updatedAt", serveur.optString("updated_at", ""));

            if (al.getSyncedAt() != null && !serverUpdatedAt.isEmpty()
                    && serverUpdatedAt.compareTo(al.getSyncedAt()) > 0) {
                enregistrerConflit("alerte", al.getId(), alerteToJson(al), serveur);
                continue;
            }

            api.put("/alertes/" + al.getId(), alerteToJson(al).toString());
            alerteDAO.markSynced(al.getId(), now);
        }
    }

    // ── PULL ──────────────────────────────────────────────────────────────────

    private static void pullIncidents(ApiClient api) throws Exception {
        String url = "/incidents";
        String nid = SessionManager.getNeighborhoodId();
        if ("moderator".equals(SessionManager.getRole()) && nid != null && !nid.isEmpty()) {
            url += "?neighborhoodId=" + nid;
        }
        String reponse = api.get(url);
        JSONArray tableau = parseArray(reponse, "incidents");
        String now = Instant.now().toString();

        for (int i = 0; i < tableau.length(); i++) {
            JSONObject obj = tableau.getJSONObject(i);
            String serverId = obj.optString("_id", obj.optString("id", ""));
            if (serverId.isEmpty()) continue;

            String serverUpdatedAt = obj.optString("updatedAt", obj.optString("updated_at", now));
            Incident local = incidentDAO.findById(serverId);

            if (local == null) {
                incidentDAO.save(incidentFromJson(obj, serverId, now));
            } else if (local.isDirty() && local.getSyncedAt() != null
                    && serverUpdatedAt.compareTo(local.getSyncedAt()) > 0) {
                enregistrerConflit("incident", serverId, incidentToJson(local), obj);
            } else if (!local.isDirty()) {
                incidentDAO.save(incidentFromJson(obj, serverId, now));
            }
        }
    }

    private static void pullAlertes(ApiClient api) throws Exception {
        String url = "/alertes";
        String nid = SessionManager.getNeighborhoodId();
        if ("moderator".equals(SessionManager.getRole()) && nid != null && !nid.isEmpty()) {
            url += "?neighborhoodId=" + nid;
        }
        String reponse = api.get(url);
        JSONArray tableau = parseArray(reponse, "alertes");
        String now = Instant.now().toString();

        for (int i = 0; i < tableau.length(); i++) {
            JSONObject obj = tableau.getJSONObject(i);
            String serverId = obj.optString("_id", obj.optString("id", ""));
            if (serverId.isEmpty()) continue;

            String serverUpdatedAt = obj.optString("updatedAt", obj.optString("updated_at", now));
            Alerte local = alerteDAO.findById(serverId);

            if (local == null) {
                alerteDAO.save(alerteFromJson(obj, serverId, now));
            } else if (local.isDirty() && local.getSyncedAt() != null
                    && serverUpdatedAt.compareTo(local.getSyncedAt()) > 0) {
                enregistrerConflit("alerte", serverId, alerteToJson(local), obj);
            } else if (!local.isDirty()) {
                alerteDAO.save(alerteFromJson(obj, serverId, now));
            }
        }
    }

    // ── CONFLITS ──────────────────────────────────────────────────────────────

    private static void enregistrerConflit(String type, String entityId,
                                           JSONObject localData, JSONObject serverData) {
        // Évite les doublons de conflits non résolus
        List<Conflit> existants = conflitDAO.findUnresolved();
        boolean dejaPresent = existants.stream()
                .anyMatch(c -> c.getEntityType().equals(type) && c.getEntityId().equals(entityId));
        if (dejaPresent) return;

        Conflit conflit = new Conflit(0, type, entityId,
                localData.toString(), serverData.toString(),
                Instant.now().toString());
        conflitDAO.save(conflit);
    }

    // ── UTILITAIRES ───────────────────────────────────────────────────────────

    private static JSONArray parseArray(String reponse, String cle) {
        try {
            if (reponse.trim().startsWith("[")) return new JSONArray(reponse);
            JSONObject obj = new JSONObject(reponse);
            if (obj.has(cle)) return obj.getJSONArray(cle);
            if (obj.has("data")) return obj.getJSONArray("data");
        } catch (Exception ignored) {}
        return new JSONArray();
    }

    /**
     * Déballe l'enveloppe {@code {success, data}} d'une réponse API portant sur une
     * entité unique (ex. {@code GET /incidents/:id}).
     */
    private static JSONObject parseObject(String reponse) {
        JSONObject obj = new JSONObject(reponse);
        return obj.has("data") ? obj.getJSONObject("data") : obj;
    }

    // ── Traduction français (UI locale) ↔ anglais (API / enums Mongoose) ───────
    // Le formulaire desktop utilise des libellés français tandis que les schémas
    // Mongoose du backend attendent des noms de champs et des valeurs d'enum en
    // anglais ; sans cette traduction, l'API renvoie systématiquement 400.

    private static String statutVersAnglais(String statut) {
        if (statut == null) return "open";
        return switch (statut) {
            case "En cours" -> "in_progress";
            case "Résolu" -> "resolved";
            default -> "open";
        };
    }

    private static String statutVersFrancais(String statut) {
        if (statut == null) return "Ouvert";
        return switch (statut) {
            case "in_progress" -> "En cours";
            case "resolved" -> "Résolu";
            default -> "Ouvert";
        };
    }

    private static String prioriteVersAnglais(String priorite) {
        if (priorite == null) return "medium";
        return switch (priorite) {
            case "Haute" -> "high";
            case "Basse" -> "low";
            default -> "medium";
        };
    }

    private static String prioriteVersFrancais(String priorite) {
        if (priorite == null) return "Moyenne";
        return switch (priorite) {
            case "high" -> "Haute";
            case "low" -> "Basse";
            default -> "Moyenne";
        };
    }

    private static String niveauVersAnglais(String niveau) {
        if (niveau == null) return "info";
        return switch (niveau) {
            case "Urgent" -> "warning";
            case "Critique" -> "danger";
            default -> "info";
        };
    }

    private static String niveauVersFrancais(String niveau) {
        if (niveau == null) return "Info";
        return switch (niveau) {
            case "warning" -> "Urgent";
            case "danger" -> "Critique";
            default -> "Info";
        };
    }

    private static JSONObject incidentToJson(Incident inc) {
        JSONObject obj = new JSONObject();
        obj.put("title", inc.getTitre());
        // description requise par le backend mais pas encore collectée par le formulaire desktop
        obj.put("description", inc.getDescription() != null && !inc.getDescription().isBlank()
                ? inc.getDescription() : inc.getTitre());
        obj.put("priority", prioriteVersAnglais(inc.getPriorite()));
        obj.put("status", statutVersAnglais(inc.getStatut()));
        return obj;
    }

    private static JSONObject alerteToJson(Alerte al) {
        JSONObject obj = new JSONObject();
        obj.put("title", al.getTitre());
        obj.put("message", al.getMessage() != null && !al.getMessage().isBlank()
                ? al.getMessage() : al.getTitre());
        obj.put("level", niveauVersAnglais(al.getNiveau()));
        return obj;
    }

    private static Incident incidentFromJson(JSONObject obj, String id, String syncedAt) {
        Incident inc = new Incident(
                id,
                obj.optString("title", ""),
                obj.optString("description", ""),
                prioriteVersFrancais(obj.optString("priority", "")),
                statutVersFrancais(obj.optString("status", "")),
                obj.optString("updatedAt", obj.optString("updated_at", syncedAt)),
                syncedAt,
                false,
                false
        );
        String nid = obj.optString("neighborhoodId", null);
        if (nid != null && !nid.isEmpty()) inc.setNeighborhoodId(nid);
        return inc;
    }

    private static Alerte alerteFromJson(JSONObject obj, String id, String syncedAt) {
        Alerte al = new Alerte(
                id,
                obj.optString("title", ""),
                obj.optString("message", ""),
                niveauVersFrancais(obj.optString("level", "")),
                "Active",
                obj.optString("updatedAt", obj.optString("updated_at", syncedAt)),
                syncedAt,
                false,
                false
        );
        String nid = obj.optString("neighborhoodId", null);
        if (nid != null && !nid.isEmpty()) al.setNeighborhoodId(nid);
        return al;
    }

    private static void setStatut(String msg) {
        Platform.runLater(() -> statut.set(msg));
    }
}
