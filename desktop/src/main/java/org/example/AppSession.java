package org.example;

import org.example.services.ApiClient;

/**
 * Session applicative globale.
 * Conserve statiquement le {@link ApiClient} authentifié de l'utilisateur
 * courant et le met à disposition de toute l'application.
 */
public class AppSession {

    private static ApiClient apiClient;

    /**
     * Enregistre le client API de l'utilisateur connecté.
     *
     * @param client client API authentifié
     */
    public static void setApiClient(ApiClient client) {
        apiClient = client;
    }

    /**
     * Retourne le client API de la session courante.
     *
     * @return le client API authentifié
     * @throws IllegalStateException si aucun utilisateur n'est connecté
     */
    public static ApiClient getApiClient() {
        if (apiClient == null) {
            throw new IllegalStateException("Utilisateur non connecté");
        }
        return apiClient;
    }

    /**
     * Réinitialise la session (déconnexion).
     */
    public static void clear() {
        apiClient = null;
    }
}