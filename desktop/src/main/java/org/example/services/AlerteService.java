package org.example.services;

/**
 * Service métier des alertes côté desktop.
 * Encapsule les appels REST de consultation et de création d'alertes.
 */
public class AlerteService {

    private final ApiClient apiClient;

    public AlerteService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Récupère la liste des alertes depuis l'API.
     * @return réponse JSON brute de l'endpoint "/alertes"
     * @throws Exception si l'appel API échoue
     */
    public String getAlertes() throws Exception {
        return apiClient.get("/alertes");
    }

    /**
     * Crée une alerte via l'API.
     * @param title titre de l'alerte
     * @param message contenu du message
     * @param level niveau de gravité
     * @return réponse JSON brute de l'alerte créée
     * @throws Exception si l'appel API échoue
     */
    public String createAlerte(String title, String message, String level) throws Exception {
        String json = """
        {
          "title": "%s",
          "message": "%s",
          "level": "%s"
        }
        """.formatted(title, message, level);

        return apiClient.post("/alertes", json);
    }
}