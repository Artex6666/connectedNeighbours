package org.example;

import javafx.scene.Scene;
import javafx.stage.Stage;

public class Navigateur {

    private static Stage stage;

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
}