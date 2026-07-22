package org.example.services;

/**
 * Service de récupération des statistiques affichées sur le tableau de bord.
 */
public class StatsService {

    private final ApiClient apiClient;

    public StatsService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Récupère les statistiques du tableau de bord depuis l'API.
     * @return réponse JSON brute de l'endpoint "/stats/dashboard"
     * @throws Exception si l'appel API échoue
     */
    public String getDashboardStats() throws Exception {
        return apiClient.get("/stats/dashboard");
    }
}