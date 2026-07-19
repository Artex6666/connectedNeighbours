package org.example;

import org.example.services.ExportService;
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
import org.example.database.IncidentDAO;
import org.example.services.SyncService;

import java.time.LocalDate;

public class VueIncidents {

    private final IncidentDAO incidentDAO = new IncidentDAO();
    private final ObservableList<Incident> listeIncidents =
            FXCollections.observableArrayList(new IncidentDAO().findAll());

    public Parent creerVue() {

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
        styliserBoutonNavActif(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonNav(boutonPlugins);
        styliserBoutonNav(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonPlugins.setOnAction(e -> Navigateur.afficherPlugins());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        HBox menuGauche = new HBox(20, logo, boutonDashboard, boutonIncidents,
                boutonAlertes, boutonStatistiques, boutonPlugins, boutonExports);
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox navbar = new HBox(20, menuGauche, espace, new HBox(boutonDeconnexion));
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Gestion des incidents");
        titre.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Consultez et gérez les incidents signalés dans le quartier.");
        sousTitre.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        VBox entetePage = new VBox(5, titre, sousTitre);
        entetePage.setAlignment(Pos.CENTER_LEFT);

        // ── Tableau ───────────────────────────────────────────────────────────
        TableView<Incident> tableau = new TableView<>();
        tableau.setItems(listeIncidents);
        tableau.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableau.setPrefHeight(280);

        TableColumn<Incident, String> colonneTitre = new TableColumn<>("Titre");
        colonneTitre.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getTitre()));

        TableColumn<Incident, String> colonnePriorite = new TableColumn<>("Priorité");
        colonnePriorite.setCellValueFactory(d -> new SimpleStringProperty(
                d.getValue().getPriorite() != null ? d.getValue().getPriorite() : "—"));

        TableColumn<Incident, String> colonneStatut = new TableColumn<>("Statut");
        colonneStatut.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getStatut()));

        TableColumn<Incident, String> colonneDate = new TableColumn<>("Date");
        colonneDate.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getDate()));

        tableau.getColumns().addAll(colonneTitre, colonnePriorite, colonneStatut, colonneDate);

        // ── Boutons d'action sur la sélection ─────────────────────────────────
        Button boutonSupprimer = new Button("Supprimer");
        styliserBoutonDanger(boutonSupprimer);
        boutonSupprimer.setOnAction(e -> {
            Incident selectionne = tableau.getSelectionModel().getSelectedItem();
            if (selectionne != null) {
                incidentDAO.delete(selectionne.getId());
                listeIncidents.remove(selectionne);
            }
        });

        Button boutonExporter = new Button("Exporter CSV");
        styliserBoutonSecondaire(boutonExporter);
        boutonExporter.setOnAction(e -> ExportService.exportTable(tableau, "incidents.csv"));

        HBox ligneActions = new HBox(12, boutonSupprimer, boutonExporter);
        ligneActions.setAlignment(Pos.CENTER_LEFT);

        VBox blocTableau = new VBox(10, tableau, ligneActions);
        blocTableau.setPadding(new Insets(20));
        blocTableau.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");

        // ── Formulaire d'ajout ────────────────────────────────────────────────
        Label titreFormulaire = new Label("Ajouter un incident");
        titreFormulaire.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        TextField champTitre = new TextField();
        champTitre.setPromptText("Titre de l'incident");
        champTitre.setPrefWidth(240);

        ComboBox<String> choixPriorite = new ComboBox<>();
        choixPriorite.getItems().addAll("Haute", "Moyenne", "Basse");
        choixPriorite.setPromptText("Priorité");
        choixPriorite.setPrefWidth(130);

        ComboBox<String> choixStatut = new ComboBox<>();
        choixStatut.getItems().addAll("Ouvert", "En cours", "Résolu");
        choixStatut.setPromptText("Statut");
        choixStatut.setPrefWidth(130);

        TextField champDate = new TextField(LocalDate.now().toString());
        champDate.setPrefWidth(130);

        Button boutonAjouter = new Button("Ajouter");
        styliserBoutonPrincipal(boutonAjouter);

        boutonAjouter.setOnAction(e -> {
            if (!champTitre.getText().isEmpty() && choixStatut.getValue() != null) {
                Incident nouvel = new Incident(champTitre.getText(), choixStatut.getValue(), champDate.getText());
                if (choixPriorite.getValue() != null) nouvel.setPriorite(choixPriorite.getValue());
                incidentDAO.save(nouvel);
                listeIncidents.add(nouvel);
                champTitre.clear();
                choixPriorite.setValue(null);
                choixStatut.setValue(null);
                champDate.setText(LocalDate.now().toString());
            }
        });

        HBox ligneFormulaire = new HBox(12, champTitre, choixPriorite, choixStatut, champDate, boutonAjouter);
        ligneFormulaire.setAlignment(Pos.CENTER_LEFT);

        VBox blocFormulaire = new VBox(12, titreFormulaire, ligneFormulaire);
        blocFormulaire.setPadding(new Insets(20));
        blocFormulaire.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");

        VBox contenu = new VBox(20, entetePage, blocTableau, blocFormulaire);
        contenu.setAlignment(Pos.TOP_LEFT);
        contenu.setPadding(new Insets(30));
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        Runnable rafraichir = () -> listeIncidents.setAll(incidentDAO.findAll());
        SyncService.ajouterListenerSyncTerminee(rafraichir);
        racine.sceneProperty().addListener((obs, ancienne, nouvelle) -> {
            if (nouvelle == null) SyncService.retirerListenerSyncTerminee(rafraichir);
        });

        return racine;
    }

    private void styliserBoutonNav(Button b) {
        b.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonNavActif(Button b) {
        b.setStyle("-fx-background-color: #e9f2ff; -fx-text-fill: #2f80ed; -fx-font-size: 13px;" +
                   "-fx-font-weight: bold; -fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }

    private void styliserBoutonPrincipal(Button b) {
        b.setStyle("-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px;" +
                   "-fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonSecondaire(Button b) {
        b.setStyle("-fx-background-color: #ffffff; -fx-text-fill: #2c3e50; -fx-font-size: 13px;" +
                   "-fx-border-color: #cfd6dd; -fx-border-radius: 6; -fx-background-radius: 6;" +
                   "-fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonDanger(Button b) {
        b.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                   "-fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }
}
