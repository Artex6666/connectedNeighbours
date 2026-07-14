package org.example;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

import java.awt.Desktop;
import java.io.File;
import java.util.Arrays;

public class VueExports {

    private final File dossierExports =
            new File(System.getProperty("user.dir"), "exports");

    public Parent creerVue() {
        if (!dossierExports.exists()) {
            dossierExports.mkdirs();
        }

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        Button boutonDashboard = new Button("Dashboard");
        Button boutonIncidents = new Button("Incidents");
        Button boutonAlertes = new Button("Alertes");
        Button boutonStatistiques = new Button("Statistiques");
        Button boutonPlugins = new Button("Plugins");
        Button boutonExports = new Button("Exports");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(boutonDashboard);
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonNav(boutonPlugins);
        styliserBoutonNavActif(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonPlugins.setOnAction(e -> Navigateur.afficherPlugins());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        HBox menuGauche = new HBox(
                20,
                logo,
                boutonDashboard,
                boutonIncidents,
                boutonAlertes,
                boutonStatistiques,
                boutonPlugins,
                boutonExports
        );
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox navbar = new HBox(20, menuGauche, espace, boutonDeconnexion);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Fichiers exportés");
        titre.setStyle("-fx-font-size: 26px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");




        ListView<File> liste = new ListView<>();
        ObservableList<File> fichiers = FXCollections.observableArrayList();
        chargerFichiers(fichiers);

        liste.setItems(fichiers);
        liste.setPrefHeight(380);
        liste.setCellFactory(param -> new ListCell<>() {
            @Override
            protected void updateItem(File file, boolean empty) {
                super.updateItem(file, empty);
                setText(empty || file == null ? null : file.getName());
            }
        });

        Button ouvrir = new Button("Ouvrir");
        Button actualiser = new Button("Actualiser");

        styliserBoutonPrincipal(ouvrir);
        styliserBoutonSecondaire(actualiser);

        ouvrir.setOnAction(e -> {
            File file = liste.getSelectionModel().getSelectedItem();

            if (file == null) {
                afficherInfo("Aucun fichier sélectionné", "Sélectionnez un fichier exporté.");
                return;
            }

            try {
                Desktop.getDesktop().open(file);
            } catch (Exception ex) {
                afficherInfo("Erreur", "Impossible d'ouvrir le fichier.");
                ex.printStackTrace();
            }
        });

        actualiser.setOnAction(e -> chargerFichiers(fichiers));

        HBox actions = new HBox(12, ouvrir, actualiser);
        actions.setAlignment(Pos.CENTER_LEFT);

        Label chemin = new Label("Dossier : " + dossierExports.getAbsolutePath());
        chemin.setStyle("-fx-text-fill: #7f8c8d; -fx-font-size: 13px;");

        VBox bloc = new VBox(15, titre, chemin, liste, actions);
        bloc.setPadding(new Insets(20));
        bloc.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 8;" +
                        "-fx-background-radius: 8;"
        );

        VBox contenu = new VBox(20, bloc);
        contenu.setPadding(new Insets(30));
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    private void chargerFichiers(ObservableList<File> fichiers) {
        fichiers.clear();

        File[] csv = dossierExports.listFiles((dir, name) -> name.toLowerCase().endsWith(".csv"));

        if (csv != null) {
            fichiers.addAll(Arrays.asList(csv));
        }
    }

    private void afficherInfo(String titre, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(titre);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private void styliserBoutonNav(Button bouton) {
        bouton.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonNavActif(Button bouton) {
        bouton.setStyle("-fx-background-color: #e9f2ff; -fx-text-fill: #2f80ed; -fx-font-size: 13px; -fx-font-weight: bold; -fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }

    private void styliserBoutonPrincipal(Button bouton) {
        bouton.setStyle("-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px; -fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonSecondaire(Button bouton) {
        bouton.setStyle("-fx-background-color: white; -fx-text-fill: #2c3e50; -fx-font-size: 13px; -fx-border-color: #cfd6dd; -fx-border-radius: 6; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonDanger(Button bouton) {
        bouton.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px; -fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }
}