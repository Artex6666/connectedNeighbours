package org.example;

import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import org.example.database.AlerteDAO;
import org.example.database.ConflitDAO;
import org.example.database.IncidentDAO;
import org.example.services.SyncService;

import java.io.FileWriter;
import java.time.Instant;

/**
 * Écran principal (tableau de bord) de l'application desktop.
 * Affiche la barre de navigation, des indicateurs calculés depuis la base locale
 * (incidents ouverts, alertes actives, dernière synchronisation) ainsi qu'un bloc
 * d'outils de démonstration (mode hors ligne simulé, création d'un conflit de test).
 */
public class VueDashboard {

    /**
     * Construit l'arborescence JavaFX du tableau de bord : navbar, cartes d'indicateurs
     * lues via {@link IncidentDAO} et {@link AlerteDAO}, bloc résumé avec export CSV
     * et bloc d'outils de démo.
     *
     * @return le nœud racine de la vue tableau de bord
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
        Button boutonConflits = new Button("⚠ Conflits");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNavActif(boutonDashboard);
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonNav(boutonPlugins);
        styliserBoutonNav(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonPlugins.setOnAction(e -> Navigateur.afficherPlugins());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonConflits.setOnAction(e -> Navigateur.afficherConflits());
        boutonDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

        boutonConflits.setStyle(
                "-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 12px;" +
                "-fx-background-radius: 5; -fx-padding: 4 10 4 10;"
        );
        boutonConflits.setVisible(SyncService.nbConflitsProperty().get() > 0);
        SyncService.nbConflitsProperty().addListener((obs, ancien, nb) ->
                boutonConflits.setVisible(nb.intValue() > 0)
        );

        Label labelSync = new Label();
        labelSync.textProperty().bind(SyncService.statutProperty());
        labelSync.setStyle("-fx-font-size: 11px; -fx-text-fill: #6c757d;");

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

        HBox menuDroite = new HBox(12, labelSync, boutonConflits, boutonDeconnexion);
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

        Label sousTitre = new Label("Vue générale de l'administration Bob Connect");
        sousTitre.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #6c757d;"
        );

        VBox entete = new VBox(5, titre, sousTitre);
        entete.setAlignment(Pos.CENTER_LEFT);

        // ── KPIs dynamiques depuis SQLite ─────────────────────────────────────
        IncidentDAO incidentDAO = new IncidentDAO();
        AlerteDAO alerteDAO = new AlerteDAO();

        long nbOuverts = incidentDAO.findAll().stream()
                .filter(i -> "Ouvert".equals(i.getStatut()) || "En cours".equals(i.getStatut()))
                .count();
        long nbAlertes = alerteDAO.findAll().stream()
                .filter(a -> !"Lue".equals(a.getStatut()))
                .count();

        Label valeurSynchro = new Label("—");
        valeurSynchro.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");
        String statut = SyncService.statutProperty().get();
        if (statut.startsWith("Synchronisé à ")) {
            valeurSynchro.setText(statut.replace("Synchronisé à ", ""));
        }
        SyncService.statutProperty().addListener((obs, old, val) -> {
            if (val.startsWith("Synchronisé à ")) {
                Platform.runLater(() -> valeurSynchro.setText(val.replace("Synchronisé à ", "")));
            }
        });

        VBox carteIncidents = creerCarte("Incidents ouverts", String.valueOf(nbOuverts));
        VBox carteAlertes = creerCarte("Alertes actives", String.valueOf(nbAlertes));
        VBox carteUtilisateurs = creerCarte("Utilisateurs", "—");
        VBox carteSynchronisation = creerCarteAvecLabel("Dernière synchro", valeurSynchro);

        HBox ligneCartes = new HBox(20, carteIncidents, carteAlertes, carteUtilisateurs, carteSynchronisation);
        ligneCartes.setAlignment(Pos.CENTER_LEFT);

        Label titreBloc = new Label("Résumé");
        titreBloc.setStyle(
                "-fx-font-size: 16px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );

        Label texteBloc = new Label(
                "Cette interface permet de suivre rapidement l'état du quartier, " +
                        "de consulter les incidents, les alertes et les statistiques principales."
        );
        texteBloc.setWrapText(true);
        texteBloc.setStyle(
                "-fx-font-size: 13px;" +
                        "-fx-text-fill: #495057;"
        );

        Button boutonExporter = new Button("Exporter CSV");
        styliserBoutonPrincipal(boutonExporter);
        boutonExporter.setOnAction(e -> exporterDashboard(nbOuverts, nbAlertes));

        VBox blocResume = new VBox(12, titreBloc, texteBloc, boutonExporter);
        blocResume.setPadding(new Insets(20));
        blocResume.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 6;" +
                        "-fx-background-radius: 6;"
        );

        // ── Bloc démo / test ─────────────────────────────────────────────────
        Label titreDemo = new Label("Outils de démo");
        titreDemo.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Button boutonHorsLigne = new Button(
                SyncService.estHorsLigneSimule() ? "✓ Hors ligne simulé" : "Simuler hors ligne"
        );
        boutonHorsLigne.setStyle(
                "-fx-background-color: #f39c12; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );
        boutonHorsLigne.setOnAction(e -> {
            SyncService.basculerModeHorsLigne();
            boutonHorsLigne.setText(
                    SyncService.estHorsLigneSimule() ? "✓ Hors ligne simulé" : "Simuler hors ligne"
            );
        });

        Button boutonSimulerConflit = new Button("Simuler un conflit");
        boutonSimulerConflit.setStyle(
                "-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );
        boutonSimulerConflit.setOnAction(e -> {
            String entityId = incidentDAO.findAll().isEmpty()
                    ? "demo-incident-id"
                    : incidentDAO.findAll().get(0).getId();

            Conflit conflit = new Conflit(0, "incident", entityId,
                    "{\"titre\":\"Lampadaire cassé\",\"statut\":\"Ouvert\",\"priorite\":\"Haute\"}",
                    "{\"titre\":\"Lampadaire cassé\",\"statut\":\"Résolu\",\"priorite\":\"Basse\"}",
                    Instant.now().toString());
            new ConflitDAO().save(conflit);
            SyncService.nbConflitsProperty().set(new ConflitDAO().count());
            boutonSimulerConflit.setText("Conflit créé ✓");
            boutonSimulerConflit.setDisable(true);
        });

        HBox ligneDemo = new HBox(12, boutonHorsLigne, boutonSimulerConflit);
        ligneDemo.setAlignment(Pos.CENTER_LEFT);

        VBox blocDemo = new VBox(12, titreDemo, ligneDemo);
        blocDemo.setPadding(new Insets(20));
        blocDemo.setStyle(
                "-fx-background-color: white; -fx-border-color: #f39c12;" +
                "-fx-border-radius: 6; -fx-background-radius: 6; -fx-border-width: 2;"
        );

        VBox contenu = new VBox(20, entete, ligneCartes, blocResume, blocDemo);
        contenu.setPadding(new Insets(30));
        contenu.setAlignment(Pos.TOP_LEFT);
        contenu.setMaxWidth(1000);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    /**
     * Écrit les indicateurs du tableau de bord dans le fichier CSV {@code dashboard.csv}.
     *
     * @param nbOuverts nombre d'incidents ouverts ou en cours
     * @param nbAlertes nombre d'alertes non lues
     */
    private void exporterDashboard(long nbOuverts, long nbAlertes) {
        try (FileWriter writer = new FileWriter("dashboard.csv")) {
            writer.write("statistique;valeur\n");
            writer.write("Incidents ouverts;" + nbOuverts + "\n");
            writer.write("Alertes actives;" + nbAlertes + "\n");
            String synchro = SyncService.statutProperty().get().replace("Synchronisé à ", "");
            writer.write("Dernière synchro;" + synchro + "\n");
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    private VBox creerCarte(String titre, String valeur) {
        Label labelValeur = new Label(valeur);
        labelValeur.setStyle(
                "-fx-font-size: 28px;" +
                        "-fx-font-weight: bold;" +
                        "-fx-text-fill: #2c3e50;"
        );
        return creerCarteAvecLabel(titre, labelValeur);
    }

    private VBox creerCarteAvecLabel(String titre, Label labelValeur) {
        Label labelTitre = new Label(titre);
        labelTitre.setStyle(
                "-fx-text-fill: #6c757d;" +
                        "-fx-font-size: 13px;"
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
