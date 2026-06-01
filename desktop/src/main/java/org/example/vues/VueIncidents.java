package org.example;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class VueIncidents {

    private final ObservableList<Incident> listeIncidents = FXCollections.observableArrayList(
            new Incident("Bruit voisinage", "Ouvert", "01/04/2026"),
            new Incident("Lampadaire cassé", "En cours", "31/03/2026"),
            new Incident("Dégradation banc public", "Résolu", "29/03/2026")
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
        styliserBoutonNavActif(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
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

        Label titre = new Label("Gestion des incidents");
        titre.setStyle(
                "-fx-font-size: 24px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label sousTitre = new Label("Consultez et ajoutez les incidents signalés dans le quartier.");
        sousTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
        );

        VBox entetePage = new VBox(5, titre, sousTitre);
        entetePage.setAlignment(Pos.CENTER_LEFT);

        TableView<Incident> tableau = new TableView<>();
        tableau.setItems(listeIncidents);
        tableau.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableau.setPrefHeight(320);

        TableColumn<Incident, String> colonneTitre = new TableColumn<>("Titre");
        colonneTitre.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getTitre()));

        TableColumn<Incident, String> colonneStatut = new TableColumn<>("Statut");
        colonneStatut.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getStatut()));

        TableColumn<Incident, String> colonneDate = new TableColumn<>("Date");
        colonneDate.setCellValueFactory(donnees -> new SimpleStringProperty(donnees.getValue().getDate()));

        tableau.getColumns().addAll(colonneTitre, colonneStatut, colonneDate);

        VBox blocTableau = new VBox(10, tableau);
        blocTableau.setPadding(new Insets(20));
        blocTableau.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        Label titreFormulaire = new Label("Ajouter un incident");
        titreFormulaire.setStyle(
                "-fx-font-size: 16px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        TextField champTitre = new TextField();
        champTitre.setPromptText("Titre de l’incident");
        champTitre.setPrefWidth(260);

        ComboBox<String> choixStatut = new ComboBox<>();
        choixStatut.getItems().addAll("Ouvert", "En cours", "Résolu");
        choixStatut.setPromptText("Statut");
        choixStatut.setPrefWidth(180);

        TextField champDate = new TextField();
        champDate.setPromptText("Date");
        champDate.setPrefWidth(150);

        Button boutonAjouter = new Button("Ajouter");
        styliserBoutonPrincipal(boutonAjouter);

        boutonAjouter.setOnAction(e -> {
            if (!champTitre.getText().isEmpty() && !champDate.getText().isEmpty() && choixStatut.getValue() != null) {
                listeIncidents.add(new Incident(
                        champTitre.getText(),
                        choixStatut.getValue(),
                        champDate.getText()
                ));
                champTitre.clear();
                champDate.clear();
                choixStatut.setValue(null);
            }
        });

        HBox ligneFormulaire = new HBox(12, champTitre, choixStatut, champDate, boutonAjouter);
        ligneFormulaire.setAlignment(Pos.CENTER_LEFT);

        VBox blocFormulaire = new VBox(12, titreFormulaire, ligneFormulaire);
        blocFormulaire.setPadding(new Insets(20));
        blocFormulaire.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        VBox contenu = new VBox(20, entetePage, blocTableau, blocFormulaire);
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