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
import org.example.database.AlerteDAO;
import org.example.services.SyncService;

import java.time.LocalDate;

/**
 * Écran de gestion des alertes de l'application desktop.
 * Affiche les alertes de la base locale dans un tableau (titre, niveau, date, statut),
 * permet de les marquer comme lues ou de les archiver, et propose un formulaire
 * de création d'alerte.
 */
public class VueAlertes {

    private final AlerteDAO alerteDAO = new AlerteDAO();
    private final ObservableList<Alerte> listeAlertes =
            FXCollections.observableArrayList(new AlerteDAO().findAll());

    /**
     * Construit l'arborescence JavaFX de la vue alertes : navbar, tableau des alertes
     * avec ses actions (marquer comme lue, archiver) et formulaire de création.
     * Enregistre également un rafraîchissement de la liste à la fin de chaque
     * synchronisation, retiré lorsque la vue quitte la scène.
     *
     * @return le nœud racine de la vue alertes
     */
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
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNavActif(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonNav(boutonPlugins);
        styliserBoutonNav(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonPlugins.setOnAction(e -> Navigateur.afficherPlugins());
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

        Label titre = new Label("Gestion des alertes");
        titre.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Consultez et gérez les alertes du quartier.");
        sousTitre.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        VBox entetePage = new VBox(5, titre, sousTitre);
        entetePage.setAlignment(Pos.CENTER_LEFT);

        // ── Tableau ───────────────────────────────────────────────────────────
        TableView<Alerte> tableau = new TableView<>();
        tableau.setItems(listeAlertes);
        tableau.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableau.setPrefHeight(280);

        TableColumn<Alerte, String> colonneTitre = new TableColumn<>("Titre");
        colonneTitre.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getTitre()));

        TableColumn<Alerte, String> colonneNiveau = new TableColumn<>("Niveau");
        colonneNiveau.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getNiveau()));

        TableColumn<Alerte, String> colonneDate = new TableColumn<>("Date");
        colonneDate.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getDate()));

        TableColumn<Alerte, String> colonneStatut = new TableColumn<>("Statut");
        colonneStatut.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getStatut()));

        tableau.getColumns().addAll(colonneTitre, colonneNiveau, colonneDate, colonneStatut);

        // ── Boutons d'action sur la sélection ─────────────────────────────────
        Button boutonMarquerLue = new Button("Marquer comme lue");
        styliserBoutonPrincipal(boutonMarquerLue);
        boutonMarquerLue.setOnAction(e -> {
            Alerte sel = tableau.getSelectionModel().getSelectedItem();
            if (sel != null) {
                sel.setStatut("Lue");
                alerteDAO.save(sel);
                tableau.refresh();
            }
        });

        Button boutonArchiver = new Button("Archiver");
        styliserBoutonSecondaire(boutonArchiver);
        boutonArchiver.setOnAction(e -> {
            Alerte sel = tableau.getSelectionModel().getSelectedItem();
            if (sel != null) {
                alerteDAO.delete(sel.getId());
                listeAlertes.remove(sel);
            }
        });

        HBox ligneActions = new HBox(12, boutonMarquerLue, boutonArchiver);
        ligneActions.setAlignment(Pos.CENTER_LEFT);

        VBox blocTableau = new VBox(10, tableau, ligneActions);
        blocTableau.setPadding(new Insets(20));
        blocTableau.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");

        // ── Formulaire de création ────────────────────────────────────────────
        Label titreFormulaire = new Label("Créer une alerte");
        titreFormulaire.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        TextField champTitre = new TextField();
        champTitre.setPromptText("Titre de l'alerte");
        champTitre.setPrefWidth(240);

        TextField champMessage = new TextField();
        champMessage.setPromptText("Message");
        champMessage.setPrefWidth(240);

        ComboBox<String> choixNiveau = new ComboBox<>();
        choixNiveau.getItems().addAll("Info", "Urgent", "Critique");
        choixNiveau.setPromptText("Niveau");
        choixNiveau.setPrefWidth(130);

        Button boutonCreer = new Button("Créer");
        styliserBoutonPrincipal(boutonCreer);

        boutonCreer.setOnAction(e -> {
            if (!champTitre.getText().isEmpty() && choixNiveau.getValue() != null) {
                Alerte nouvelle = new Alerte(
                        champTitre.getText(),
                        choixNiveau.getValue(),
                        LocalDate.now().toString(),
                        "Active"
                );
                nouvelle.setMessage(champMessage.getText());
                alerteDAO.save(nouvelle);
                listeAlertes.add(nouvelle);
                champTitre.clear();
                champMessage.clear();
                choixNiveau.setValue(null);
            }
        });

        HBox ligneFormulaire = new HBox(12, champTitre, champMessage, choixNiveau, boutonCreer);
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

        Runnable rafraichir = () -> listeAlertes.setAll(alerteDAO.findAll());
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
