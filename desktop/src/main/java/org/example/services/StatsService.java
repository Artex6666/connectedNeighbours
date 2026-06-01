package org.example.services;

public class StatsService {

    private final ApiClient apiClient;

    public StatsService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String getDashboardStats() throws Exception {
        return apiClient.get("/stats/dashboard");
    }
}