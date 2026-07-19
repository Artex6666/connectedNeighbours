package org.example;

import javafx.geometry.*;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.*;
import javafx.scene.layout.*;
import org.example.services.ApiClient;
import org.example.services.AuthService;
import org.example.services.SessionManager;
import org.example.services.SsoService;
import org.json.JSONObject;

public class VueConnexion {

    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitWidth(130);
        logo.setPreserveRatio(true);

        Label message = new Label("Connexion via le site web");
        message.setStyle("-fx-text-fill: white; -fx-font-size: 16px; -fx-font-weight: bold;");

        Label erreur = new Label();
        erreur.setMaxWidth(280);
        erreur.setWrapText(true);
        erreur.setAlignment(Pos.CENTER);
        erreur.setStyle("-fx-text-fill: #ffdddd; -fx-font-weight: bold;");

        Button boutonSSO = new Button("Se connecter avec le site web");
        boutonSSO.setPrefWidth(280);
        boutonSSO.setStyle(
                "-fx-background-color: linear-gradient(to right, #2196F3, #4CAF50);" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 14px;" +
                        "-fx-background-radius: 10;" +
                        "-fx-padding: 10;"
        );

        boutonSSO.setOnAction(e -> {
            try {
                erreur.setText("");
                boutonSSO.setDisable(true);
                boutonSSO.setText("Connexion en cours...");

                ApiClient apiClient = SessionManager.getApiClient();
                AuthService authService = new AuthService(apiClient);
                SsoService ssoService = new SsoService(authService, apiClient);
                ssoService.loginWithBrowser();

                routerVersAccueil();

            } catch (Exception ex) {
                ex.printStackTrace();
                erreur.setText("Connexion SSO impossible : " + ex.getMessage());
            } finally {
                boutonSSO.setDisable(false);
                boutonSSO.setText("Se connecter avec le site web");
            }
        });

        // ── Séparateur ──────────────────────────────────────────────────────
        Label separateur = new Label("— ou connexion directe —");
        separateur.setStyle("-fx-text-fill: rgba(255,255,255,0.6); -fx-font-size: 12px;");

        // ── Formulaire email / mot de passe ──────────────────────────────────
        TextField champEmail = new TextField();
        champEmail.setPromptText("Email");
        champEmail.setPrefWidth(280);
        champEmail.setStyle(
                "-fx-background-radius: 8; -fx-padding: 8;" +
                "-fx-font-size: 13px;"
        );

        PasswordField champMotDePasse = new PasswordField();
        champMotDePasse.setPromptText("Mot de passe");
        champMotDePasse.setPrefWidth(280);
        champMotDePasse.setStyle(
                "-fx-background-radius: 8; -fx-padding: 8;" +
                "-fx-font-size: 13px;"
        );

        Label erreurDirecte = new Label();
        erreurDirecte.setMaxWidth(280);
        erreurDirecte.setWrapText(true);
        erreurDirecte.setAlignment(Pos.CENTER);
        erreurDirecte.setStyle("-fx-text-fill: #ffdddd; -fx-font-weight: bold; -fx-font-size: 12px;");

        Button boutonDirect = new Button("Se connecter");
        boutonDirect.setPrefWidth(280);
        boutonDirect.setStyle(
                "-fx-background-color: rgba(255,255,255,0.15);" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 13px;" +
                        "-fx-background-radius: 10;" +
                        "-fx-padding: 9;" +
                        "-fx-border-color: rgba(255,255,255,0.4);" +
                        "-fx-border-radius: 10;"
        );

        boutonDirect.setOnAction(e -> {
            String email = champEmail.getText().trim();
            String mdp = champMotDePasse.getText();

            if (email.isEmpty() || mdp.isEmpty()) {
                erreurDirecte.setText("Veuillez remplir les deux champs.");
                return;
            }

            try {
                erreurDirecte.setText("");
                boutonDirect.setDisable(true);
                boutonDirect.setText("Connexion...");

                AuthService authService = new AuthService(SessionManager.getApiClient());
                String reponse = authService.login(email, mdp);
                JSONObject json = new JSONObject(reponse);

                if (json.optBoolean("success") && json.has("data")) {
                    String token = json.getJSONObject("data").getString("accessToken");
                    SessionManager.setToken(token);
                    routerVersAccueil();
                } else {
                    String msg = json.optString("message", "Email ou mot de passe incorrect.");
                    erreurDirecte.setText(msg);
                }

            } catch (Exception ex) {
                erreurDirecte.setText("Connexion impossible : " + ex.getMessage());
            } finally {
                boutonDirect.setDisable(false);
                boutonDirect.setText("Se connecter");
            }
        });

        // Valider avec Entrée depuis le champ mot de passe
        champMotDePasse.setOnAction(e -> boutonDirect.fire());

        VBox racine = new VBox(16,
                logo, message, erreur, boutonSSO,
                separateur,
                champEmail, champMotDePasse, erreurDirecte, boutonDirect
        );
        racine.setAlignment(Pos.CENTER);
        racine.setPadding(new Insets(40));
        racine.setStyle("-fx-background-color: linear-gradient(to bottom right, #0f2027, #2c5364, #4CAF50);");

        return racine;
    }

    private static void routerVersAccueil() {
        String role = SessionManager.getRole();
        if ("admin".equals(role)) {
            Navigateur.afficherAdmin();
        } else if ("moderator".equals(role)) {
            String nid = SessionManager.getNeighborhoodId();
            Navigateur.afficherQuartier(nid, "Mon quartier");
        } else {
            Navigateur.afficherDashboard();
        }
    }
}
