package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import org.example.database.AlerteDAO;
import org.example.database.IncidentDAO;
import org.example.services.SessionManager;

import java.io.File;
import java.io.FileWriter;

/**
 * Écran « Statistiques » de l'application desktop.
 * Affiche des cartes de synthèse calculées à partir des incidents et des alertes
 * (incidents enregistrés, alertes traitées, incidents résolus, taux de résolution),
 * et permet d'actualiser la vue ou d'exporter ces chiffres en CSV.
 */
public class VueStatistiques {

    /**
     * Construit l'écran des statistiques : barre de navigation, cartes de synthèse
     * alimentées par {@link IncidentDAO} et {@link AlerteDAO}, et bloc de résumé
     * avec les boutons « Actualiser » et « Exporter ».
     *
     * @return le nœud racine de la vue
     */
    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        boolean estAdmin = "admin".equals(SessionManager.getRole());
        boolean estModerateur = "moderator".equals(SessionManager.getRole());

        Button btnDashboard = new Button(
                estAdmin ? "← Tous les quartiers" : estModerateur ? "← Mon quartier" : "Dashboard");
        Button btnIncidents = new Button("Incidents");
        Button btnAlertes = new Button("Alertes");
        Button btnStats = new Button("Statistiques");
        Button btnDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(btnDashboard);
        styliserBoutonNav(btnIncidents);
        styliserBoutonNav(btnAlertes);
        styliserBoutonNavActif(btnStats);
        styliserBoutonDanger(btnDeconnexion);

        btnDashboard.setOnAction(e -> {
            if (estAdmin) Navigateur.afficherAdmin();
            else if (estModerateur) Navigateur.afficherQuartier(SessionManager.getNeighborhoodId(), "Mon quartier");
            else Navigateur.afficherConnexion();
        });
        btnIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        btnAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        btnDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        HBox menuGauche = new HBox(
                20,
                logo,
                btnDashboard,
                btnIncidents,
                btnAlertes,
                btnStats
        );
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

        IncidentDAO incidentDAO = new IncidentDAO();
        AlerteDAO alerteDAO = new AlerteDAO();

        long totalIncidents = incidentDAO.findAll().size();
        long alertesTraitees = alerteDAO.findAll().stream()
                .filter(a -> "Lue".equals(a.getStatut()))
                .count();
        long incidentsResolus = incidentDAO.findAll().stream()
                .filter(i -> "Résolu".equals(i.getStatut()))
                .count();

        HBox ligne1 = new HBox(
                20,
                creerCarteStatistique("Incidents enregistrés", String.valueOf(totalIncidents)),
                creerCarteStatistique("Alertes traitées", String.valueOf(alertesTraitees))
        );

        HBox ligne2 = new HBox(
                20,
                creerCarteStatistique("Incidents résolus", String.valueOf(incidentsResolus)),
                creerCarteStatistique("Taux résolution",
                        totalIncidents == 0 ? "—"
                        : (incidentsResolus * 100 / totalIncidents) + "%")
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


        boutonActualiser.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonExporter.setOnAction(e -> exporterStatistiques(totalIncidents, alertesTraitees, incidentsResolus));

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

    private void exporterStatistiques(long totalIncidents, long alertesTraitees, long incidentsResolus) {
        try {
            new File("exports").mkdirs();
            try (FileWriter writer = new FileWriter("exports/statistiques.csv")) {
                writer.write("Statistique;Valeur\n");
                writer.write("Incidents enregistrés;" + totalIncidents + "\n");
                writer.write("Alertes traitées;" + alertesTraitees + "\n");
                writer.write("Incidents résolus;" + incidentsResolus + "\n");
                long taux = totalIncidents == 0 ? 0 : incidentsResolus * 100 / totalIncidents;
                writer.write("Taux résolution;" + taux + "%\n");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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