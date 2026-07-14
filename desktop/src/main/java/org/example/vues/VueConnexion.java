package org.example;

import javafx.geometry.*;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.*;
import javafx.scene.layout.VBox;
import org.example.services.ApiClient;
import org.example.services.AuthService;
import org.example.services.SsoService;

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

        Button boutonConnexion = new Button("Se connecter avec le site web");
        boutonConnexion.setPrefWidth(280);
        boutonConnexion.setStyle(
                "-fx-background-color: linear-gradient(to right, #2196F3, #4CAF50);" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 14px;" +
                        "-fx-background-radius: 10;" +
                        "-fx-padding: 10;"
        );

        boutonConnexion.setOnAction(e -> {
            try {
                erreur.setText("");
                boutonConnexion.setDisable(true);
                boutonConnexion.setText("Connexion en cours...");

                ApiClient apiClient = new ApiClient();
                AuthService authService = new AuthService(apiClient);
                SsoService ssoService = new SsoService(authService, apiClient);

                ssoService.loginWithBrowser();
                AppSession.setApiClient(apiClient);

                Navigateur.afficherDashboard();

            } catch (Exception ex) {
                ex.printStackTrace();
                erreur.setText("Connexion SSO impossible : " + ex.getMessage());
            } finally {
                boutonConnexion.setDisable(false);
                boutonConnexion.setText("Se connecter avec le site web");
            }
        });

        VBox racine = new VBox(20, logo, message, erreur, boutonConnexion);
        racine.setAlignment(Pos.CENTER);
        racine.setPadding(new Insets(40));
        racine.setStyle("-fx-background-color: linear-gradient(to bottom right, #0f2027, #2c5364, #4CAF50);");

        return racine;
    }
}