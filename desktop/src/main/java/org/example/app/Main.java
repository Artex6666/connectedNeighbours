package org.example;

import javafx.application.Application;
import javafx.stage.Stage;
import org.example.database.DatabaseManager;
import org.example.services.SyncService;

public class Main extends Application {

    @Override
    public void start(Stage stage) {
        DatabaseManager.initialiser();
        SyncService.demarrer();

        Navigateur.definirStage(stage);
        Navigateur.afficherDashboard(); // TODO: remettre afficherConnexion()
        stage.setTitle("Bob Connect");
        stage.show();
    }

    @Override
    public void stop() {
        SyncService.arreter();
    }

    public static void main(String[] args) {
        launch();
    }
}
