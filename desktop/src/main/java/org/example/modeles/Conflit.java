package org.example;

/**
 * Modèle d'un conflit de synchronisation.
 * Représente une divergence détectée entre la version locale et la version
 * serveur d'une entité (type, identifiant, données des deux côtés, date de détection).
 */
public class Conflit {

    private int id;
    private String entityType;
    private String entityId;
    private String localData;
    private String serverData;
    private String detectedAt;

    public Conflit(int id, String entityType, String entityId,
                   String localData, String serverData, String detectedAt) {
        this.id = id;
        this.entityType = entityType;
        this.entityId = entityId;
        this.localData = localData;
        this.serverData = serverData;
        this.detectedAt = detectedAt;
    }

    public int getId() { return id; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public String getLocalData() { return localData; }
    public String getServerData() { return serverData; }
    public String getDetectedAt() { return detectedAt; }
}
