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
import org.example.database.AlerteDAO;
import org.example.database.ConflitDAO;
import org.example.database.IncidentDAO;
import org.example.services.SyncService;
import org.json.JSONObject;

import java.time.Instant;

public class VueConflits {

    private final ConflitDAO conflitDAO = new ConflitDAO();
    private final IncidentDAO incidentDAO = new IncidentDAO();
    private final AlerteDAO alerteDAO = new AlerteDAO();

    private ObservableList<Conflit> listeConflits;
    private ListView<Conflit> listView;
    private VBox panneauDetail;

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
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
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
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Conflits de synchronisation");
        titre.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Résolvez les conflits détectés entre vos données locales et le serveur.");
        sousTitre.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        VBox entete = new VBox(5, titre, sousTitre);
        entete.setAlignment(Pos.CENTER_LEFT);

        listeConflits = FXCollections.observableArrayList(conflitDAO.findUnresolved());
        listView = new ListView<>(listeConflits);
        listView.setPrefWidth(280);
        listView.setPrefHeight(500);

        listView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Conflit item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    String type = item.getEntityType().equals("incident") ? "Incident" : "Alerte";
                    setText(type + " — " + item.getDetectedAt().substring(0, 10));
                }
            }
        });

        panneauDetail = new VBox(16);
        panneauDetail.setPadding(new Insets(20));
        panneauDetail.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc; -fx-border-radius: 6; -fx-background-radius: 6;");

        afficherMessageVide();

        listView.getSelectionModel().selectedItemProperty().addListener(
                (obs, ancien, conflit) -> {
                    if (conflit != null) afficherDetail(conflit);
                }
        );

        HBox contenuPrincipal = new HBox(20, listView, panneauDetail);
        HBox.setHgrow(panneauDetail, Priority.ALWAYS);
        contenuPrincipal.setAlignment(Pos.TOP_LEFT);

        VBox contenu = new VBox(20, entete, contenuPrincipal);
        contenu.setPadding(new Insets(30));
        contenu.setMaxWidth(1200);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");
        return racine;
    }

    private void afficherMessageVide() {
        panneauDetail.getChildren().clear();
        Label msg = new Label("Sélectionnez un conflit dans la liste pour le résoudre.");
        msg.setStyle("-fx-text-fill: #6c757d; -fx-font-size: 13px;");
        panneauDetail.getChildren().add(msg);
    }

    private void afficherDetail(Conflit conflit) {
        panneauDetail.getChildren().clear();

        JSONObject local = new JSONObject(conflit.getLocalData());
        JSONObject serveur = new JSONObject(conflit.getServerData());

        Label titreConf = new Label("Conflit détecté — " + conflit.getEntityType());
        titreConf.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #e74c3c;");

        Label detectedAt = new Label("Détecté le " + conflit.getDetectedAt().substring(0, 10));
        detectedAt.setStyle("-fx-font-size: 12px; -fx-text-fill: #6c757d;");

        VBox colonneLocale = creerColonneConflit("Ma version (locale)", local, "#2f80ed");
        VBox colonneServeur = creerColonneConflit("Version serveur", serveur, "#27ae60");

        HBox comparaison = new HBox(20, colonneLocale, colonneServeur);
        HBox.setHgrow(colonneLocale, Priority.ALWAYS);
        HBox.setHgrow(colonneServeur, Priority.ALWAYS);

        Button btnGarderLocal = new Button("Garder ma version");
        styliserBoutonPrincipal(btnGarderLocal);

        Button btnGarderServeur = new Button("Garder version serveur");
        btnGarderServeur.setStyle(
                "-fx-background-color: #27ae60; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );

        btnGarderLocal.setOnAction(e -> resoudreAvecVersion(conflit, local, true));
        btnGarderServeur.setOnAction(e -> resoudreAvecVersion(conflit, serveur, false));

        HBox boutons = new HBox(12, btnGarderLocal, btnGarderServeur);
        boutons.setAlignment(Pos.CENTER_LEFT);

        panneauDetail.getChildren().addAll(titreConf, detectedAt, comparaison, boutons);
    }

    private VBox creerColonneConflit(String labelTitre, JSONObject data, String couleur) {
        Label header = new Label(labelTitre);
        header.setStyle("-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: " + couleur + ";");

        VBox colonne = new VBox(8, header);
        colonne.setPadding(new Insets(16));
        colonne.setStyle("-fx-background-color: #f8f9fa; -fx-border-color: " + couleur +
                "; -fx-border-radius: 6; -fx-background-radius: 6; -fx-border-width: 2;");

        for (String cle : data.keySet()) {
            String valeur = data.optString(cle, "");
            Label ligne = new Label(cle + " : " + valeur);
            ligne.setStyle("-fx-font-size: 12px; -fx-text-fill: #495057;");
            ligne.setWrapText(true);
            colonne.getChildren().add(ligne);
        }

        return colonne;
    }

    private void resoudreAvecVersion(Conflit conflit, JSONObject versionChoisie, boolean estLocale) {
        String now = Instant.now().toString();

        if (conflit.getEntityType().equals("incident")) {
            Incident inc = incidentDAO.findById(conflit.getEntityId());
            if (inc != null) {
                if (!estLocale) {
                    inc = new Incident(
                            conflit.getEntityId(),
                            versionChoisie.optString("titre", inc.getTitre()),
                            versionChoisie.optString("description", inc.getDescription()),
                            versionChoisie.optString("priorite", inc.getPriorite()),
                            versionChoisie.optString("statut", inc.getStatut()),
                            inc.getDate(), now, now, false, false
                    );
                } else {
                    inc.setDirty(true);
                }
                incidentDAO.save(inc);
            }
        } else {
            Alerte al = alerteDAO.findById(conflit.getEntityId());
            if (al != null) {
                if (!estLocale) {
                    al = new Alerte(
                            conflit.getEntityId(),
                            versionChoisie.optString("titre", al.getTitre()),
                            versionChoisie.optString("message", al.getMessage()),
                            versionChoisie.optString("niveau", al.getNiveau()),
                            versionChoisie.optString("statut", al.getStatut()),
                            al.getDate(), now, now, false, false
                    );
                } else {
                    al.setDirty(true);
                }
                alerteDAO.save(al);
            }
        }

        conflitDAO.resolve(conflit.getId());
        listeConflits.remove(conflit);
        SyncService.synchroniserMaintenant();
        afficherMessageVide();
    }

    private void styliserBoutonNav(Button bouton) {
        bouton.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonPrincipal(Button bouton) {
        bouton.setStyle("-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonDanger(Button bouton) {
        bouton.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }
}
