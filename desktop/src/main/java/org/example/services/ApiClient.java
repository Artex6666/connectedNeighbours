package org.example.services;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ApiClient {

    private static final String BASE_URL =
            "http://localhost:3000/api/v1";

    private final HttpClient client;
    private String accessToken;

    public ApiClient() {
        this.client = HttpClient.newHttpClient();
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String get(String endpoint)
            throws IOException, InterruptedException {

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .GET();

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        HttpRequest request = builder.build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        return response.body();
    }

    public String post(String endpoint, String jsonBody)
            throws IOException, InterruptedException {

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

        if (accessToken != null) {
            builder.header("Authorization", "Bearer " + accessToken);
        }

        HttpRequest request = builder.build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        return response.body();
    }
}