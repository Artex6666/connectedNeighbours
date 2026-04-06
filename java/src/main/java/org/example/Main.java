package org.example;

import javafx.application.Application;
import javafx.stage.Stage;

public class Main extends Application {

    @Override
    public void start(Stage stage) {
        Navigateur.definirStage(stage);
        Navigateur.afficherConnexion();
        stage.setTitle("Bob Connect");
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}