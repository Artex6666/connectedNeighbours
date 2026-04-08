package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class VueStatistiques {

    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        Button btnDashboard = new Button("Dashboard");
        Button btnIncidents = new Button("Incidents");
        Button btnAlertes = new Button("Alertes");
        Button btnStats = new Button("Statistiques");
        Button btnDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(btnDashboard);
        styliserBoutonNav(btnIncidents);
        styliserBoutonNav(btnAlertes);
        styliserBoutonNavActif(btnStats);
        styliserBoutonDanger(btnDeconnexion);

        btnDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        btnIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        btnAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        btnDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        HBox menuGauche = new HBox(20, logo, btnDashboard, btnIncidents, btnAlertes, btnStats);
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox menuDroite = new HBox(btnDeconnexion);
        menuDroite.setAlignment(Pos.CENTER_RIGHT);

        HBox navbar = new HBox(20, menuGauche, espace, menuDroite);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;"
        );

        Label titre = new Label("Statistiques");
        titre.setStyle(
                "-fx-font-size: 24px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label sousTitre = new Label("Vue synthétique des données administratives.");
        sousTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
        );

        VBox entetePage = new VBox(5, titre, sousTitre);
        entetePage.setAlignment(Pos.CENTER_LEFT);

        HBox ligne1 = new HBox(
                20,
                creerCarteStatistique("Incidents ce mois", "18"),
                creerCarteStatistique("Alertes traitées", "11")
        );

        HBox ligne2 = new HBox(
                20,
                creerCarteStatistique("Voisins actifs", "74"),
                creerCarteStatistique("Taux participation", "68%")
        );

        ligne1.setAlignment(Pos.CENTER_LEFT);
        ligne2.setAlignment(Pos.CENTER_LEFT);

        Label titreBloc = new Label("Résumé");
        titreBloc.setStyle(
                "-fx-font-size: 16px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label texteResume = new Label(
                "Les statistiques montrent une activité régulière dans le quartier.\n" +
                        "Le nombre d’incidents reste modéré et la participation aux événements est satisfaisante."
        );
        texteResume.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #495057;"
        );
        texteResume.setWrapText(true);

        Button boutonActualiser = new Button("Actualiser");
        Button boutonExporter = new Button("Exporter");


        styliserBoutonPrincipal(boutonActualiser);
        styliserBoutonSecondaire(boutonExporter);


        boutonActualiser.setOnAction(e -> boutonActualiser.setText("Actualisé"));
        boutonExporter.setOnAction(e -> System.out.println("Export simulé"));


        HBox ligneBoutons = new HBox(12, boutonActualiser, boutonExporter);
        ligneBoutons.setAlignment(Pos.CENTER_LEFT);

        VBox blocResume = new VBox(12, titreBloc, texteResume, ligneBoutons);
        blocResume.setPadding(new Insets(20));
        blocResume.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        VBox contenu = new VBox(20, entetePage, ligne1, ligne2, blocResume);
        contenu.setAlignment(Pos.TOP_LEFT);
        contenu.setPadding(new Insets(30));
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    private VBox creerCarteStatistique(String titre, String valeur) {
        Label labelTitre = new Label(titre);
        labelTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
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
                        "-fx-border-color: #d9dee3;" +
                        "-fx-border-radius: 8;" +
                        "-fx-background-radius: 8;"
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