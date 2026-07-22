package org.example;

import javafx.application.Application;
import javafx.stage.Stage;
import org.example.database.DatabaseManager;
import org.example.services.SyncService;

/**
 * Application JavaFX principale de BobConnect Desktop.
 * Initialise la base locale et le service de synchronisation au démarrage,
 * puis affiche l'écran de connexion dans la fenêtre principale.
 */
public class Main extends Application {

    /**
     * Initialise la base de données locale et le service de synchronisation,
     * puis affiche la vue de connexion.
     *
     * @param stage fenêtre principale fournie par JavaFX
     */
    @Override
    public void start(Stage stage) {
        DatabaseManager.initialiser();
        SyncService.demarrer();

        Navigateur.definirStage(stage);
        Navigateur.afficherConnexion();
        stage.setTitle("Bob Connect");
        stage.show();
    }

    /**
     * Arrête le service de synchronisation à la fermeture de l'application.
     */
    @Override
    public void stop() {
        SyncService.arreter();
    }

    /**
     * Démarre l'application JavaFX.
     *
     * @param args arguments de la ligne de commande
     */
    public static void main(String[] args) {
        launch();
    }
}
