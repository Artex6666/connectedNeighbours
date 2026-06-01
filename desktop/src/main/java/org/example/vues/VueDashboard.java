package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class VueDashboard {

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

        styliserBoutonNavActif(boutonDashboard);
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonDanger(boutonDeconnexion);

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
        navbar.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;"
        );

        Label titre = new Label("Tableau de bord");
        titre.setStyle(
                "-fx-font-size: 24px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label sousTitre = new Label("Vue générale de l’administration Bob Connect");
        sousTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
        );

        VBox entete = new VBox(5, titre, sousTitre);
        entete.setAlignment(Pos.CENTER_LEFT);

        VBox carteIncidents = creerCarte("Incidents ouverts", "12");
        VBox carteAlertes = creerCarte("Alertes actives", "5");
        VBox carteUtilisateurs = creerCarte("Utilisateurs", "120");
        VBox carteSynchronisation = creerCarte("Dernière synchro", "18:45");

        HBox ligneCartes = new HBox(20, carteIncidents, carteAlertes, carteUtilisateurs, carteSynchronisation);
        ligneCartes.setAlignment(Pos.CENTER_LEFT);

        Label titreBloc = new Label("Résumé");
        titreBloc.setStyle(
                "-fx-font-size: 16px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label texteBloc = new Label(
                "Cette interface permet de suivre rapidement l’état du quartier, " +
                        "de consulter les incidents, les alertes et les statistiques principales."
        );
        texteBloc.setWrapText(true);
        texteBloc.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #495057;"
        );

        VBox blocResume = new VBox(12, titreBloc, texteBloc);
        blocResume.setPadding(new Insets(20));
        blocResume.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        VBox contenu = new VBox(20, entete, ligneCartes, blocResume);
        contenu.setPadding(new Insets(30));
        contenu.setAlignment(Pos.TOP_LEFT);
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    private VBox creerCarte(String titre, String valeur) {
        Label labelTitre = new Label(titre);
        labelTitre.setStyle(
                "-fx-text-fill: #6c757d;" +
                        "-fx-font-size: 13px;"
        );

        Label labelValeur = new Label(valeur);
        labelValeur.setStyle(
                "-fx-font-size: 28px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        VBox carte = new VBox(8, labelTitre, labelValeur);
        carte.setAlignment(Pos.CENTER_LEFT);
        carte.setPadding(new Insets(20));
        carte.setPrefWidth(220);
        carte.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        return carte;
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