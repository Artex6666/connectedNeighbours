package org.example.services;

public class AuthService {

    private final ApiClient apiClient;

    public AuthService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public String exchangeSsoCode(String code, String codeVerifier) throws Exception {
        String json = """
        {
          "code": "%s",
          "codeVerifier": "%s"
        }
        """.formatted(code, codeVerifier);

        return apiClient.post("/auth/sso/exchange", json);
    }

    public String login(String email, String motDePasse) throws Exception {
        String json = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, motDePasse);
        return apiClient.post("/auth/login", json);
    }
}