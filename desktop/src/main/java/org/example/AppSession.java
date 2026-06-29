package org.example;

import org.example.services.ApiClient;

public class AppSession {

    private static ApiClient apiClient;

    public static void setApiClient(ApiClient client) {
        apiClient = client;
    }

    public static ApiClient getApiClient() {
        if (apiClient == null) {
            throw new IllegalStateException("Utilisateur non connecté");
        }
        return apiClient;
    }

    public static void clear() {
        apiClient = null;
    }
}