package org.example.services;

import org.json.JSONObject;

import java.util.Base64;

public class SessionManager {

    private static String accessToken;
    private static String role;
    private static String neighborhoodId;
    private static final ApiClient apiClient = new ApiClient();

    public static void setToken(String token) {
        accessToken = token;
        apiClient.setAccessToken(token);
        decoderToken(token);
    }

    private static void decoderToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return;
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            JSONObject json = new JSONObject(payload);
            role = json.optString("role", null);
            neighborhoodId = json.optString("neighborhoodId", null);
        } catch (Exception e) {
            System.err.println("SessionManager.decoderToken : " + e.getMessage());
        }
    }

    public static String getToken() { return accessToken; }
    public static String getRole() { return role; }
    public static String getNeighborhoodId() { return neighborhoodId; }
    public static ApiClient getApiClient() { return apiClient; }

    public static boolean estConnecte() {
        return accessToken != null && !accessToken.isEmpty();
    }

    public static void deconnecter() {
        accessToken = null;
        role = null;
        neighborhoodId = null;
        apiClient.setAccessToken(null);
    }
}
