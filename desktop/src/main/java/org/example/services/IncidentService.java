package org.example.services;

public class IncidentService {

    private final ApiClient apiClient;

    public IncidentService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String getIncidents() throws Exception {
        return apiClient.get("/incidents");
    }

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