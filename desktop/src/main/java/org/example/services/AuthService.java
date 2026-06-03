package org.example.services;

public class AuthService {

    private final ApiClient apiClient;

    public AuthService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String login(String email, String password) throws Exception {
        String json = """
        {
          "email": "%s",
          "password": "%s"
        }
        """.formatted(email, password);

        return apiClient.post("/auth/login", json);
    }
}