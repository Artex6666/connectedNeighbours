package org.example;

/**
 * Modèle d'un incident signalé dans un quartier.
 * Porte les champs métier (title, description, priority, status) — alignés sur les
 * noms de champs du schéma backend — ainsi que les métadonnées de synchronisation
 * hors-ligne (updatedAt, syncedAt, dirty, localOnly).
 */
public class Incident {

    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String updatedAt;
    private String syncedAt;
    private boolean dirty;
    private boolean localOnly;
    private String neighborhoodId;

    // Constructeur léger pour la saisie rapide dans l'UI
    public Incident(String title, String status) {
        this.id = java.util.UUID.randomUUID().toString();
        this.title = title;
        this.status = status;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
        this.localOnly = true;
    }

    // Constructeur complet pour reconstruction depuis la BDD
    public Incident(String id, String title, String description, String priority,
                    String status, String updatedAt, String syncedAt,
                    boolean dirty, boolean localOnly) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.updatedAt = updatedAt;
        this.syncedAt = syncedAt;
        this.dirty = dirty;
        this.localOnly = localOnly;
    }

    public String getId() { return id; }
    public String getTitre() { return title; }
    public String getDescription() { return description; }
    public String getPriorite() { return priority; }
    public String getStatut() { return status; }
    public String getUpdatedAt() { return updatedAt; }
    public String getSyncedAt() { return syncedAt; }
    public boolean isDirty() { return dirty; }
    public boolean isLocalOnly() { return localOnly; }
    public String getNeighborhoodId() { return neighborhoodId; }

    /**
     * Modifie le statut de l'incident, met à jour l'horodatage de modification
     * et marque l'incident comme à synchroniser.
     *
     * @param status nouveau statut
     */
    public void setStatut(String status) {
        this.status = status;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
    }

    public void setPriorite(String priority) { this.priority = priority; }
    public void setNeighborhoodId(String neighborhoodId) { this.neighborhoodId = neighborhoodId; }
    public void setId(String id) { this.id = id; }
    public void setSyncedAt(String syncedAt) { this.syncedAt = syncedAt; }
    public void setDirty(boolean dirty) { this.dirty = dirty; }
    public void setLocalOnly(boolean localOnly) { this.localOnly = localOnly; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
