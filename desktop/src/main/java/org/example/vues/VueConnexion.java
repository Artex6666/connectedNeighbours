package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.VBox;
import org.example.services.ApiClient;
import org.example.services.AuthService;

public class VueConnexion {

    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitWidth(130);
        logo.setPreserveRatio(true);

        TextField champEmail = new TextField();
        champEmail.setPromptText("Email");
        champEmail.setMaxWidth(250);
        champEmail.setStyle("-fx-background-radius: 8; -fx-padding: 10;");

        PasswordField champMotDePasse = new PasswordField();
        champMotDePasse.setPromptText("Mot de passe");
        champMotDePasse.setMaxWidth(250);
        champMotDePasse.setStyle("-fx-background-radius: 8; -fx-padding: 10;");

        Label messageErreur = new Label();
        messageErreur.setMaxWidth(250);
        messageErreur.setWrapText(true);
        messageErreur.setAlignment(Pos.CENTER);
        messageErreur.setStyle(
                "-fx-text-fill: #ffdddd;" +
                        "-fx-font-size: 13px;" +
                        "-fx-font-weight: bold;"
        );

        Button boutonConnexion = new Button("Se connecter");
        boutonConnexion.setPrefWidth(250);
        boutonConnexion.setStyle(
                "-fx-background-color: linear-gradient(to right, #2196F3, #4CAF50);" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 14px;" +
                        "-fx-background-radius: 10;" +
                        "-fx-padding: 10;"
        );

        boutonConnexion.setOnAction(e -> {

            String email = champEmail.getText().trim();
            String motDePasse = champMotDePasse.getText();

            messageErreur.setText("");

            if (email.isBlank() || motDePasse.isBlank()) {
                messageErreur.setText("Veuillez remplir l'email et le mot de passe.");
                return;
            }

            try {
                boutonConnexion.setDisable(true);
                boutonConnexion.setText("Connexion...");

                ApiClient apiClient = new ApiClient();
                AuthService authService = new AuthService(apiClient);

                String response = authService.login(email, motDePasse);

                if (response.contains("accessToken")) {
                    Navigateur.afficherDashboard();
                } else {
                    messageErreur.setText("Email ou mot de passe incorrect.");
                }

            } catch (Exception ex) {
                messageErreur.setText("Email ou mot de passe incorrect.");
            } finally {
                boutonConnexion.setDisable(false);
                boutonConnexion.setText("Se connecter");
            }
        });

        VBox racine = new VBox(
                20,
                logo,
                champEmail,
                champMotDePasse,
                messageErreur,
                boutonConnexion
        );

        racine.setAlignment(Pos.CENTER);
        racine.setPadding(new Insets(40));
        racine.setStyle(
                "-fx-background-color: linear-gradient(to bottom right, #0f2027, #2c5364, #4CAF50);"
        );

        return racine;
    }
}