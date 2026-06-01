package org.example.services;

public class AlerteService {

    private final ApiClient apiClient;

    public AlerteService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String getAlertes() throws Exception {
        return apiClient.get("/alertes");
    }

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