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
}