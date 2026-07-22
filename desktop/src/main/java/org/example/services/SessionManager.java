package org.example.services;

import org.json.JSONObject;

import java.util.Base64;

/**
 * Conserve la session de l'utilisateur connecté pour toute l'application.
 * Stocke le jeton d'accès, en décode le rôle et le quartier, et expose
 * l'ApiClient partagé configuré avec ce jeton.
 */
public class SessionManager {

    private static String accessToken;
    private static String role;
    private static String neighborhoodId;
    private static final ApiClient apiClient = new ApiClient();

    /**
     * Ouvre la session avec le jeton fourni : le propage à l'ApiClient partagé
     * et en extrait le rôle et l'identifiant de quartier.
     * @param token jeton JWT d'accès
     */
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

    /**
     * Indique si une session est actuellement ouverte.
     * @return {@code true} si un jeton d'accès non vide est présent
     */
    public static boolean estConnecte() {
        return accessToken != null && !accessToken.isEmpty();
    }

    /**
     * Ferme la session : efface le jeton, le rôle, le quartier
     * et retire le jeton de l'ApiClient partagé.
     */
    public static void deconnecter() {
        accessToken = null;
        role = null;
        neighborhoodId = null;
        apiClient.setAccessToken(null);
    }
}
