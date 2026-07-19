package org.example;

public class Incident {

    private String id;
    private String titre;
    private String description;
    private String priorite;
    private String statut;
    private String date;
    private String updatedAt;
    private String syncedAt;
    private boolean dirty;
    private boolean localOnly;

    // Constructeur léger pour la saisie rapide dans l'UI
    public Incident(String titre, String statut, String date) {
        this.id = java.util.UUID.randomUUID().toString();
        this.titre = titre;
        this.statut = statut;
        this.date = date;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
        this.localOnly = true;
    }

    // Constructeur complet pour reconstruction depuis la BDD
    public Incident(String id, String titre, String description, String priorite,
                    String statut, String date, String updatedAt, String syncedAt,
                    boolean dirty, boolean localOnly) {
        this.id = id;
        this.titre = titre;
        this.description = description;
        this.priorite = priorite;
        this.statut = statut;
        this.date = date;
        this.updatedAt = updatedAt;
        this.syncedAt = syncedAt;
        this.dirty = dirty;
        this.localOnly = localOnly;
    }

    public String getId() { return id; }
    public String getTitre() { return titre; }
    public String getDescription() { return description; }
    public String getPriorite() { return priorite; }
    public String getStatut() { return statut; }
    public String getDate() { return date; }
    public String getUpdatedAt() { return updatedAt; }
    public String getSyncedAt() { return syncedAt; }
    public boolean isDirty() { return dirty; }
    public boolean isLocalOnly() { return localOnly; }

    public void setStatut(String statut) {
        this.statut = statut;
        this.updatedAt = java.time.Instant.now().toString();
        this.dirty = true;
    }

    public void setPriorite(String priorite) { this.priorite = priorite; }
    public void setPriorite(String priorite) { this.priorite = priorite; }
    public void setId(String id) { this.id = id; }
    public void setSyncedAt(String syncedAt) { this.syncedAt = syncedAt; }
    public void setDirty(boolean dirty) { this.dirty = dirty; }
    public void setLocalOnly(boolean localOnly) { this.localOnly = localOnly; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
