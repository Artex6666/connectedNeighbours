package org.example;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class VueAlertes {

    private final ObservableList<Alerte> listeAlertes = FXCollections.observableArrayList(
            new Alerte("Coupure internet", "Moyenne", "05/04/2026", "Non lue"),
            new Alerte("Incident sécurité", "Élevée", "04/04/2026", "Lue"),
            new Alerte("Bruit signalé", "Faible", "03/04/2026", "Non lue")
    );

    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        Button boutonDashboard = new Button("Dashboard");
        Button boutonIncidents = new Button("Incidents");
        Button boutonAlertes = new Button("Alertes");
        Button boutonStatistiques = new Button("Statistiques");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(boutonDashboard);
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNavActif(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        HBox menuGauche = new HBox(20, logo, boutonDashboard, boutonIncidents, boutonAlertes, boutonStatistiques);
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox menuDroite = new HBox(boutonDeconnexion);
        menuDroite.setAlignment(Pos.CENTER_RIGHT);

        HBox navbar = new HBox(20, menuGauche, espace, menuDroite);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;"
        );

        Label titre = new Label("Gestion des alertes");
        titre.setStyle(
                "-fx-font-size: 24px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label sousTitre = new Label("Consultez et suivez les alertes du quartier.");
        sousTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
        );

        VBox entetePage = new VBox(5, titre, sousTitre);
        entetePage.setAlignment(Pos.CENTER_LEFT);

        TableView<Alerte> tableau = new TableView<>();
        tableau.setItems(listeAlertes);
        tableau.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableau.setPrefHeight(320);

        TableColumn<Alerte, String> colonneTitre = new TableColumn<>("Titre");
        colonneTitre.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getTitre()));

        TableColumn<Alerte, String> colonneNiveau = new TableColumn<>("Niveau");
        colonneNiveau.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getNiveau()));

        TableColumn<Alerte, String> colonneDate = new TableColumn<>("Date");
        colonneDate.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getDate()));

        TableColumn<Alerte, String> colonneStatut = new TableColumn<>("Statut");
        colonneStatut.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getStatut()));

        tableau.getColumns().addAll(colonneTitre, colonneNiveau, colonneDate, colonneStatut);

        VBox blocTableau = new VBox(10, tableau);
        blocTableau.setPadding(new Insets(20));
        blocTableau.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        Button boutonMarquerLue = new Button("Marquer comme lue");
        Button boutonArchiver = new Button("Archiver");

        styliserBoutonPrincipal(boutonMarquerLue);
        styliserBoutonSecondaire(boutonArchiver);

        boutonMarquerLue.setOnAction(e -> {
            Alerte alerteSelectionnee = tableau.getSelectionModel().getSelectedItem();
            if (alerteSelectionnee != null) {
                alerteSelectionnee.setStatut("Lue");
                tableau.refresh();
            }
        });

        boutonArchiver.setOnAction(e -> {
            Alerte alerteSelectionnee = tableau.getSelectionModel().getSelectedItem();
            if (alerteSelectionnee != null) {
                listeAlertes.remove(alerteSelectionnee);
            }
        });

        HBox ligneActions = new HBox(12, boutonMarquerLue, boutonArchiver);
        ligneActions.setAlignment(Pos.CENTER_LEFT);

        VBox blocActions = new VBox(12, ligneActions);
        blocActions.setPadding(new Insets(20));
        blocActions.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        VBox contenu = new VBox(20, entetePage, blocTableau, blocActions);
        contenu.setAlignment(Pos.TOP_LEFT);
        contenu.setPadding(new Insets(30));
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    private void styliserBoutonNav(Button bouton) {
        bouton.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: #2c3e50;" +
                        "-fx-font-size: 13px;"
        );
    }

    private void styliserBoutonNavActif(Button bouton) {
        bouton.setStyle(
                "-fx-background-color: #e9f2ff;" +
                        "-fx-text-fill: #2f80ed;" +
                        "-fx-font-size: 13px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-padding: 6 12 6 12;"
        );
    }

    private void styliserBoutonPrincipal(Button bouton) {
        bouton.setStyle(
                "-fx-background-color: #2f80ed;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 13px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 6;" +
                        "-fx-padding: 8 16 8 16;"
        );
    }

    private void styliserBoutonSecondaire(Button bouton) {
        bouton.setStyle(
                "-fx-background-color: #ffffff;" +
                        "-fx-text-fill: #2c3e50;" +
                        "-fx-font-size: 13px;" +
                        "-fx-border-color: #cfd6dd;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;" +
                        "-fx-padding: 8 16 8 16;"
        );
    }

    private void styliserBoutonDanger(Button bouton) {
        bouton.setStyle(
                "-fx-background-color: #e74c3c;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-size: 13px;" +
                        "-fx-background-radius: 5;" +
                        "-fx-padding: 6 12 6 12;"
        );
    }
}