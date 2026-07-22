package org.example.services;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;

/**
 * Client HTTP bas niveau vers l'API REST BobConnect.
 * Centralise les appels GET/POST/PUT, l'ajout du jeton JWT
 * et la détection des réponses en erreur.
 */
public class ApiClient {

    private static final String BASE_URL = "https://projet-annuel.lorisrameau.pro/api/v1";

    private final HttpClient client = HttpClient.newHttpClient();
    private String accessToken;

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    /**
     * Exécute une requête GET, authentifiée si un jeton est défini.
     * @param endpoint chemin relatif à la base API (ex: "/incidents")
     * @return corps de la réponse JSON brut
     * @throws IOException si l'appel échoue ou si le statut HTTP n'est pas 2xx
     * @throws InterruptedException si l'attente de la réponse est interrompue
     */
    public String get(String endpoint) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .GET();

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        return send(builder.build());
    }

    /**
     * Exécute une requête POST avec un corps JSON, authentifiée si un jeton est défini.
     * @param endpoint chemin relatif à la base API
     * @param jsonBody corps JSON à envoyer
     * @return corps de la réponse JSON brut
     * @throws IOException si l'appel échoue ou si le statut HTTP n'est pas 2xx
     * @throws InterruptedException si l'attente de la réponse est interrompue
     */
    public String post(String endpoint, String jsonBody) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        return send(builder.build());
    }

    /**
     * Exécute une requête PUT avec un corps JSON, authentifiée si un jeton est défini.
     * @param endpoint chemin relatif à la base API
     * @param jsonBody corps JSON à envoyer
     * @return corps de la réponse JSON brut
     * @throws IOException si l'appel échoue ou si le statut HTTP n'est pas 2xx
     * @throws InterruptedException si l'attente de la réponse est interrompue
     */
    public String put(String endpoint, String jsonBody) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(jsonBody));

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        return send(builder.build());
    }

    private String send(HttpRequest request) throws IOException, InterruptedException {
        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Erreur API " + response.statusCode() + " : " + response.body());
        }

        return response.body();
    }

    /**
     * Teste la joignabilité de l'API en interrogeant {@code /users/me}.
     * @return {@code true} si le serveur répond avec un statut inférieur à 500
     */
    public boolean ping() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/users/me"))
                    .header("Authorization", "Bearer " + (accessToken != null ? accessToken : ""))
                    .GET()
                    .build();
            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() < 500;
        } catch (Exception e) {
            return false;
        }
    }
}
