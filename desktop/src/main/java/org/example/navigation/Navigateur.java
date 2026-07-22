package org.example;

import javafx.scene.Scene;
import javafx.stage.Stage;

/**
 * Routeur de navigation de l'application desktop.
 * Conserve la fenêtre principale et remplace sa scène par la vue demandée
 * (connexion, dashboard, incidents, alertes, statistiques, plugins, exports,
 * conflits, admin, quartier).
 */
public class Navigateur {

    private static Stage stage;

    /**
     * Enregistre la fenêtre principale utilisée pour toutes les navigations.
     *
     * @param stagePrincipal fenêtre principale JavaFX
     */
    public static void definirStage(Stage stagePrincipal) {
        stage = stagePrincipal;
    }

    public static void afficherConnexion() {
        Scene scene = new Scene(new VueConnexion().creerVue(), 900, 600);
        stage.setScene(scene);
    }

    public static void afficherDashboard() {
        Scene scene = new Scene(new VueDashboard().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherIncidents() {
        Scene scene = new Scene(new VueIncidents().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherAlertes() {
        Scene scene = new Scene(new VueAlertes().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherStatistiques() {
        Scene scene = new Scene(new VueStatistiques().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherPlugins() {
        Scene scene = new Scene(new VuePlugins().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherExports() {
        Scene scene = new Scene(new VueExports().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    public static void afficherConflits() {
        Scene scene = new Scene(new VueConflits().creerVue(), 1200, 700);
        stage.setScene(scene);
    }

    public static void afficherAdmin() {
        Scene scene = new Scene(new VueAdmin().creerVue(), 1100, 700);
        stage.setScene(scene);
    }

    /**
     * Affiche la vue détaillée d'un quartier.
     *
     * @param neighborhoodId identifiant du quartier à afficher
     * @param nom nom du quartier affiché dans la vue
     */
    public static void afficherQuartier(String neighborhoodId, String nom) {
        Scene scene = new Scene(new VueQuartier(neighborhoodId, nom).creerVue(), 1100, 700);
        stage.setScene(scene);
    }
}
