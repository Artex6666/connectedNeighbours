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

    public static void basculerModeHorsLigne() {
        modeHorsLigneSimule = !modeHorsLigneSimule;
        setStatut(modeHorsLigneSimule ? "Hors ligne (simulé)" : "Non synchronisé");
    }

    public static boolean estHorsLigneSimule() { return modeHorsLigneSimule; }

    public static void ajouterListenerSyncTerminee(Runnable listener) {
        listenersSyncTerminee.add(listener);
    }

    public static void retirerListenerSyncTerminee(Runnable listener) {
        listenersSyncTerminee.remove(listener);
    }

    public static void demarrer() {
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "sync-thread");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleAtFixedRate(SyncService::synchroniser, 5, 30, TimeUnit.SECONDS);
    }

    public static void arreter() {
        if (scheduler != null) scheduler.shutdown();
    }

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
            String json = incidentToJson(inc).toString();
            String now = Instant.now().toString();

            if (inc.isLocalOnly()) {
                String reponse = api.post("/incidents", json);
                JSONObject obj = new JSONObject(reponse);
                String serverId = obj.optString("_id", obj.optString("id", null));
                if (serverId != null && !serverId.isEmpty()) {
                    incidentDAO.updateId(inc.getId(), serverId);
                    incidentDAO.markSynced(serverId, now);
                } else {
                    incidentDAO.markSynced(inc.getId(), now);
                }
            } else {
                api.put("/incidents/" + inc.getId(), json);
                incidentDAO.markSynced(inc.getId(), now);
            }
        }
    }

    private static void pushAlertes(ApiClient api) throws Exception {
        for (Alerte al : alerteDAO.findDirty()) {
            String json = alerteToJson(al).toString();
            String now = Instant.now().toString();

            if (al.isLocalOnly()) {
                String reponse = api.post("/alertes", json);
                JSONObject obj = new JSONObject(reponse);
                String serverId = obj.optString("_id", obj.optString("id", null));
                if (serverId != null && !serverId.isEmpty()) {
                    alerteDAO.updateId(al.getId(), serverId);
                    alerteDAO.markSynced(serverId, now);
                } else {
                    alerteDAO.markSynced(al.getId(), now);
                }
            } else {
                api.put("/alertes/" + al.getId(), json);
                alerteDAO.markSynced(al.getId(), now);
            }
        }
    }

    // ── PULL ──────────────────────────────────────────────────────────────────

    private static void pullIncidents(ApiClient api) throws Exception {
        String reponse = api.get("/incidents");
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
        String reponse = api.get("/alertes");
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

    private static JSONObject incidentToJson(Incident inc) {
        JSONObject obj = new JSONObject();
        obj.put("titre", inc.getTitre());
        obj.put("description", inc.getDescription() != null ? inc.getDescription() : "");
        obj.put("priorite", inc.getPriorite() != null ? inc.getPriorite() : "");
        obj.put("statut", inc.getStatut());
        return obj;
    }

    private static JSONObject alerteToJson(Alerte al) {
        JSONObject obj = new JSONObject();
        obj.put("titre", al.getTitre());
        obj.put("message", al.getMessage() != null ? al.getMessage() : "");
        obj.put("niveau", al.getNiveau());
        obj.put("statut", al.getStatut());
        return obj;
    }

    private static Incident incidentFromJson(JSONObject obj, String id, String syncedAt) {
        return new Incident(
                id,
                obj.optString("titre", ""),
                obj.optString("description", ""),
                obj.optString("priorite", ""),
                obj.optString("statut", ""),
                obj.optString("createdAt", obj.optString("date", "")),
                obj.optString("updatedAt", obj.optString("updated_at", syncedAt)),
                syncedAt,
                false,
                false
        );
    }

    private static Alerte alerteFromJson(JSONObject obj, String id, String syncedAt) {
        return new Alerte(
                id,
                obj.optString("titre", ""),
                obj.optString("message", ""),
                obj.optString("niveau", ""),
                obj.optString("statut", ""),
                obj.optString("createdAt", obj.optString("date", "")),
                obj.optString("updatedAt", obj.optString("updated_at", syncedAt)),
                syncedAt,
                false,
                false
        );
    }

    private static void setStatut(String msg) {
        Platform.runLater(() -> statut.set(msg));
    }
}
