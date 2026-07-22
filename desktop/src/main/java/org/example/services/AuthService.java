package org.example.services;

/**
 * Service d'authentification vers l'API BobConnect.
 * Gère la connexion par email/mot de passe et l'échange du code SSO
 * contre un jeton d'accès.
 */
public class AuthService {

    private final ApiClient apiClient;

    public AuthService(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Échange un code SSO à usage unique contre un jeton d'accès (flux PKCE).
     * @param code code d'autorisation reçu sur l'URL de callback
     * @param codeVerifier vérificateur PKCE correspondant au challenge envoyé
     * @return réponse JSON brute contenant le jeton d'accès
     * @throws Exception si l'appel API échoue
     */
    public String exchangeSsoCode(String code, String codeVerifier) throws Exception {
        String json = """
        {
          "code": "%s",
          "codeVerifier": "%s"
        }
        """.formatted(code, codeVerifier);

        return apiClient.post("/auth/sso/exchange", json);
    }

    /**
     * Authentifie un utilisateur par email et mot de passe.
     * @param email adresse email du compte
     * @param motDePasse mot de passe en clair
     * @return réponse JSON brute de l'endpoint de connexion
     * @throws Exception si l'appel API échoue ou si les identifiants sont refusés
     */
    public String login(String email, String motDePasse) throws Exception {
        String json = "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, motDePasse);
        return apiClient.post("/auth/login", json);
    }
}