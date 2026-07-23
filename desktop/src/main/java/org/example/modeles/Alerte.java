package org.example;

/**
 * Modèle d'une alerte de quartier.
 * Porte les champs métier (title, message, level) — alignés sur les noms de champs
 * du schéma backend — ainsi que le statut de lecture ({@code statut}), un concept
 * purement local sans équivalent côté serveur, et les métadonnées de synchronisation
 * hors-ligne (updatedAt, syncedAt, dirty, localOnly).
 */
public class Alerte {

    private String id;
    private String title;
    private String message;
    private String level;
    private String statut;
    private String updatedAt;
    private String syncedAt;
    private boolean dirty;
    private boolean localOnly;
    private String neighborhoodId;

    // Constructeur léger pour la saisie rapide dans l'UI
    public Alerte(String title, String level, String statut) {
        this.id = java.util.UUID.randomUUID().toString();
        this.title = title;
        this.level = level;
        this.statut = statut;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
        this.localOnly = true;
    }

    // Constructeur complet pour reconstruction depuis la BDD
    public Alerte(String id, String title, String message, String level,
                  String statut, String updatedAt, String syncedAt,
                  boolean dirty, boolean localOnly) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.level = level;
        this.statut = statut;
        this.updatedAt = updatedAt;
        this.syncedAt = syncedAt;
        this.dirty = dirty;
        this.localOnly = localOnly;
    }

    public String getId() { return id; }
    public String getTitre() { return title; }
    public String getMessage() { return message; }
    public String getNiveau() { return level; }
    public String getStatut() { return statut; }
    public String getUpdatedAt() { return updatedAt; }
    public String getSyncedAt() { return syncedAt; }
    public boolean isDirty() { return dirty; }
    public boolean isLocalOnly() { return localOnly; }
    public String getNeighborhoodId() { return neighborhoodId; }

    /**
     * Modifie le statut de lecture de l'alerte, met à jour l'horodatage de modification
     * et marque l'alerte comme à synchroniser. Ce statut est purement local (le backend
     * n'a pas de notion de lecture/archivage d'alerte).
     *
     * @param statut nouveau statut
     */
    public void setStatut(String statut) {
        this.statut = statut;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
    }

    public void setMessage(String message) { this.message = message; }
    public void setNeighborhoodId(String neighborhoodId) { this.neighborhoodId = neighborhoodId; }
    public void setId(String id) { this.id = id; }
    public void setSyncedAt(String syncedAt) { this.syncedAt = syncedAt; }
    public void setDirty(boolean dirty) { this.dirty = dirty; }
    public void setLocalOnly(boolean localOnly) { this.localOnly = localOnly; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
