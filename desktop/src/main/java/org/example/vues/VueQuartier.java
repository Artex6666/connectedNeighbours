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
import org.example.database.AlerteDAO;
import org.example.database.IncidentDAO;
import org.example.services.SessionManager;
import org.example.services.SyncService;

import java.util.List;

/**
 * Écran de détail d'un quartier de l'application desktop.
 * Affiche, pour le quartier sélectionné, des indicateurs (incidents ouverts,
 * alertes actives, incidents résolus) ainsi que les tableaux des incidents et
 * des alertes filtrés sur ce quartier.
 */
public class VueQuartier {

    private final String neighborhoodId;
    private final String nom;
    private final IncidentDAO incidentDAO = new IncidentDAO();
    private final AlerteDAO alerteDAO = new AlerteDAO();

    /**
     * Crée la vue pour un quartier donné.
     *
     * @param neighborhoodId identifiant du quartier utilisé pour filtrer incidents et alertes
     * @param nom nom du quartier affiché dans le titre de la page
     */
    public VueQuartier(String neighborhoodId, String nom) {
        this.neighborhoodId = neighborhoodId;
        this.nom = nom;
    }

    /**
     * Construit l'écran du quartier : barre de navigation adaptée au rôle de la session,
     * indicateurs calculés depuis {@link IncidentDAO} et {@link AlerteDAO}, tableaux des
     * incidents et des alertes, et abonnement à {@link SyncService} pour les rafraîchir.
     *
     * @return le nœud racine de la vue
     */
    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        boolean estAdmin = "admin".equals(SessionManager.getRole());

        Button boutonRetour = new Button(estAdmin ? "← Tous les quartiers" : "Dashboard");
        boutonRetour.setVisible(estAdmin);
        boutonRetour.setManaged(estAdmin);
        styliserBoutonNav(boutonRetour);
        boutonRetour.setOnAction(e -> Navigateur.afficherAdmin());

        Button boutonIncidents = new Button("Incidents");
        Button boutonAlertes = new Button("Alertes");
        Button boutonStatistiques = new Button("Statistiques");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonDanger(boutonDeconnexion);

        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonDeconnexion.setOnAction(e -> {
            SessionManager.deconnecter();
            Navigateur.afficherConnexion();
        });

        HBox menuGauche = new HBox(20, logo, boutonRetour, boutonIncidents, boutonAlertes, boutonStatistiques);
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox navbar = new HBox(20, menuGauche, espace, boutonDeconnexion);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Quartier : " + nom);
        titre.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Incidents et alertes filtrés pour ce quartier.");
        sousTitre.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        // ── KPIs ─────────────────────────────────────────────────────────────
        List<Incident> incidents = incidentDAO.findByNeighborhood(neighborhoodId);
        List<Alerte> alertes = alerteDAO.findByNeighborhood(neighborhoodId);

        long nbOuverts = incidents.stream()
                .filter(i -> "Ouvert".equals(i.getStatut()) || "En cours".equals(i.getStatut()))
                .count();
        long nbAlertes = alertes.stream()
                .filter(a -> !"Lue".equals(a.getStatut()))
                .count();
        long nbResolus = incidents.stream()
                .filter(i -> "Résolu".equals(i.getStatut()))
                .count();

        HBox kpis = new HBox(20,
                creerKpi("Incidents ouverts", String.valueOf(nbOuverts), "#e74c3c"),
                creerKpi("Alertes actives", String.valueOf(nbAlertes), "#f39c12"),
                creerKpi("Résolus", String.valueOf(nbResolus), "#27ae60")
        );

        // ── Tableau incidents ─────────────────────────────────────────────────
        ObservableList<Incident> listeIncidents = FXCollections.observableArrayList(incidents);
        TableView<Incident> tableauInc = new TableView<>(listeIncidents);
        tableauInc.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableauInc.setPrefHeight(220);

        TableColumn<Incident, String> colIncTitre = new TableColumn<>("Titre");
        colIncTitre.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getTitre()));
        TableColumn<Incident, String> colIncPriorite = new TableColumn<>("Priorité");
        colIncPriorite.setCellValueFactory(d -> new SimpleStringProperty(
                d.getValue().getPriorite() != null ? d.getValue().getPriorite() : "—"));
        TableColumn<Incident, String> colIncStatut = new TableColumn<>("Statut");
        colIncStatut.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getStatut()));
        tableauInc.getColumns().addAll(colIncTitre, colIncPriorite, colIncStatut);

        Label titreInc = new Label("Incidents");
        titreInc.setStyle("-fx-font-size: 15px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");
        VBox blocInc = new VBox(10, titreInc, tableauInc);
        blocInc.setPadding(new Insets(20));
        blocInc.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");

        // ── Tableau alertes ───────────────────────────────────────────────────
        ObservableList<Alerte> listeAlertes = FXCollections.observableArrayList(alertes);
        TableView<Alerte> tableauAl = new TableView<>(listeAlertes);
        tableauAl.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableauAl.setPrefHeight(220);

        TableColumn<Alerte, String> colAlTitre = new TableColumn<>("Titre");
        colAlTitre.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getTitre()));
        TableColumn<Alerte, String> colAlNiveau = new TableColumn<>("Niveau");
        colAlNiveau.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getNiveau()));
        TableColumn<Alerte, String> colAlStatut = new TableColumn<>("Statut");
        colAlStatut.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().getStatut()));
        tableauAl.getColumns().addAll(colAlTitre, colAlNiveau, colAlStatut);

        Label titreAl = new Label("Alertes");
        titreAl.setStyle("-fx-font-size: 15px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");
        VBox blocAl = new VBox(10, titreAl, tableauAl);
        blocAl.setPadding(new Insets(20));
        blocAl.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");

        HBox tableaux = new HBox(20, blocInc, blocAl);
        HBox.setHgrow(blocInc, Priority.ALWAYS);
        HBox.setHgrow(blocAl, Priority.ALWAYS);

        VBox entete = new VBox(5, titre, sousTitre);
        entete.setAlignment(Pos.CENTER_LEFT);

        VBox blocDemo = VueOutilsDemo.creerBlocDemo();

        VBox contenu = new VBox(20, entete, kpis, tableaux, blocDemo);
        contenu.setPadding(new Insets(30));

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        Runnable rafraichir = () -> {
            listeIncidents.setAll(incidentDAO.findByNeighborhood(neighborhoodId));
            listeAlertes.setAll(alerteDAO.findByNeighborhood(neighborhoodId));
        };
        SyncService.ajouterListenerSyncTerminee(rafraichir);
        racine.sceneProperty().addListener((obs, ancienne, nouvelle) -> {
            if (nouvelle == null) SyncService.retirerListenerSyncTerminee(rafraichir);
        });

        return racine;
    }

    private VBox creerKpi(String label, String valeur, String couleur) {
        Label lbl = new Label(label);
        lbl.setStyle("-fx-font-size: 12px; -fx-text-fill: #6c757d;");
        Label val = new Label(valeur);
        val.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: " + couleur + ";");
        VBox kpi = new VBox(4, lbl, val);
        kpi.setPadding(new Insets(16));
        kpi.setMinWidth(150);
        kpi.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 6; -fx-background-radius: 6;");
        return kpi;
    }

    private void styliserBoutonNav(Button b) {
        b.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonDanger(Button b) {
        b.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }
}
