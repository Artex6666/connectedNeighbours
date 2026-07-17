package org.example.services;

public class SessionManager {

    private static String accessToken;
    private static final ApiClient apiClient = new ApiClient();

    public static void setToken(String token) {
        accessToken = token;
        apiClient.setAccessToken(token);
    }

    public static String getToken() {
        return accessToken;
    }

    public static ApiClient getApiClient() {
        return apiClient;
    }

    public static boolean estConnecte() {
        return accessToken != null && !accessToken.isEmpty();
    }

    public static void deconnecter() {
        accessToken = null;
        apiClient.setAccessToken(null);
    }
}
