package org.example.services;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;

public class ApiClient {

    private static final String BASE_URL = "https://projet-annuel.lorisrameau.pro/api/v1";

    private final HttpClient client = HttpClient.newHttpClient();
    private String accessToken;

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String get(String endpoint) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .GET();

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        return send(builder.build());
    }

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
