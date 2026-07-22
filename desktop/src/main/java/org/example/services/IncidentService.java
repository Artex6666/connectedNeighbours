package org.example.services;

/**
 * Service métier des incidents côté desktop.
 * Encapsule les appels REST de consultation et de création d'incidents.
 */
public class IncidentService {

    private final ApiClient apiClient;

    public IncidentService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Récupère la liste des incidents depuis l'API.
     * @return réponse JSON brute de l'endpoint "/incidents"
     * @throws Exception si l'appel API échoue
     */
    public String getIncidents() throws Exception {
        return apiClient.get("/incidents");
    }

    /**
     * Crée un incident via l'API.
     * @param title titre de l'incident
     * @param description description détaillée
     * @param priority priorité de l'incident
     * @return réponse JSON brute de l'incident créé
     * @throws Exception si l'appel API échoue
     */
    public String createIncident(String title, String description, String priority) throws Exception {
        String json = """
        {
          "title": "%s",
          "description": "%s",
          "priority": "%s"
        }
        """.formatted(title, description, priority);

        return apiClient.post("/incidents", json);
    }
}