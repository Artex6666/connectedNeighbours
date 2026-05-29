package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.VBox;

public class VueConnexion {

    public Parent creerVue() {

        // LOGO
        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitWidth(130);
        logo.setPreserveRatio(true);

        // CHAMPS (juste visuels)
        TextField champEmail = new TextField();
        champEmail.setPromptText("Email");
        champEmail.setMaxWidth(250);
        champEmail.setStyle("-fx-background-radius: 8; -fx-padding: 10;");

        PasswordField champMotDePasse = new PasswordField();
        champMotDePasse.setPromptText("Mot de passe");
        champMotDePasse.setMaxWidth(250);
        champMotDePasse.setStyle("-fx-background-radius: 8; -fx-padding: 10;");

        // BOUTON (navigation directe)
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
            // PAS DE BACK → on passe direct au dashboard
            Navigateur.afficherDashboard();
        });

        // LAYOUT
        VBox racine = new VBox(20, logo, champEmail, champMotDePasse, boutonConnexion);
        racine.setAlignment(Pos.CENTER);
        racine.setPadding(new Insets(40));

        // FOND BLEU / VERT
        racine.setStyle(
                "-fx-background-color: linear-gradient(to bottom right, #0f2027, #2c5364, #4CAF50);"
        );

        return racine;
    }
}