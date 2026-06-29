package org.example.services;

import com.sun.net.httpserver.HttpServer;

import java.awt.Desktop;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class SsoService {

    private static final int CALLBACK_PORT = 49152;
    private static final String CALLBACK_PATH = "/callback";

    // Front lancé avec pnpm dev:front
    private static final String FRONT_URL = "http://localhost:5173/login";

    private final AuthService authService;
    private final ApiClient apiClient;

    public SsoService(AuthService authService, ApiClient apiClient) {
        this.authService = authService;
        this.apiClient = apiClient;
    }

    public void loginWithBrowser() throws Exception {
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);

        CountDownLatch latch = new CountDownLatch(1);
        String[] receivedCode = new String[1];

        HttpServer server = HttpServer.create(new InetSocketAddress(CALLBACK_PORT), 0);

        server.createContext(CALLBACK_PATH, exchange -> {
            String query = exchange.getRequestURI().getQuery();
            receivedCode[0] = extractQueryParam(query, "code");

            String html = """
                    <html>
                      <body style="font-family: Arial; text-align: center; margin-top: 80px;">
                        <h2>Connexion réussie</h2>
                        <p>Vous pouvez retourner dans l'application Connected Neighbours.</p>
                      </body>
                    </html>
                    """;

            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);

            exchange.getResponseHeaders().add("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }

            latch.countDown();
        });

        server.start();

        String redirectUri = "http://localhost:" + CALLBACK_PORT + CALLBACK_PATH;

        String url = FRONT_URL
                + "?redirect_uri=" + encode(redirectUri)
                + "&code_challenge=" + encode(codeChallenge);

        System.out.println("SSO URL = " + url);

        Desktop.getDesktop().browse(new URI(url));

        boolean received = latch.await(2, TimeUnit.MINUTES);
        server.stop(0);

        if (!received || receivedCode[0] == null || receivedCode[0].isBlank()) {
            throw new RuntimeException("Aucun code SSO reçu.");
        }

        System.out.println("SSO code reçu = " + receivedCode[0]);

        String response = authService.exchangeSsoCode(receivedCode[0], codeVerifier);

        System.out.println("Réponse exchange SSO = " + response);

        String accessToken = extractJsonValue(response, "accessToken");

        if (accessToken == null || accessToken.isBlank()) {
            throw new RuntimeException("AccessToken absent de la réponse SSO.");
        }

        apiClient.setAccessToken(accessToken);

        System.out.println("SSO terminé avec succès.");
    }

    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateCodeChallenge(String codeVerifier) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }

    private String extractQueryParam(String query, String key) {
        if (query == null) return null;

        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);

            if (pair.length == 2 && pair[0].equals(key)) {
                return URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
            }
        }

        return null;
    }

    private String extractJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);

        if (start == -1) return null;

        start += pattern.length();
        int end = json.indexOf("\"", start);

        if (end == -1) return null;

        return json.substring(start, end);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}