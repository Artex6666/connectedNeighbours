package org.example;

import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import org.example.database.ConflitDAO;
import org.example.database.IncidentDAO;
import org.example.services.SyncService;

import java.time.Instant;

/**
 * Bloc "Outils de démo" (hors ligne simulé, synchro forcée, conflit de test),
 * réutilisable depuis n'importe quelle vue d'accueil (admin, quartier) pour que
 * ces outils restent accessibles quel que soit le rôle connecté.
 */
public class VueOutilsDemo {

    /**
     * Construit le bloc "Outils de démo".
     *
     * @return le bloc encadré prêt à être ajouté à un conteneur
     */
    public static VBox creerBlocDemo() {
        Label titreDemo = new Label("Outils de démo");
        titreDemo.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label labelStatutSync = new Label("Statut synchro : " + SyncService.statutProperty().get());
        labelStatutSync.setStyle("-fx-font-size: 12px; -fx-text-fill: #6c757d;");
        SyncService.statutProperty().addListener((obs, ancien, val) ->
                Platform.runLater(() -> labelStatutSync.setText("Statut synchro : " + val))
        );

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

        Button boutonForcerSync = new Button("Forcer une synchro");
        boutonForcerSync.setStyle(
                "-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );
        boutonForcerSync.setOnAction(e -> SyncService.synchroniserMaintenant());

        Button boutonSimulerConflit = new Button("Simuler un conflit");
        boutonSimulerConflit.setStyle(
                "-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );
        boutonSimulerConflit.setOnAction(e -> {
            IncidentDAO incidentDAO = new IncidentDAO();
            String entityId = incidentDAO.findAll().isEmpty()
                    ? "demo-incident-id"
                    : incidentDAO.findAll().get(0).getId();

            Conflit conflit = new Conflit(0, "incident", entityId,
                    "{\"title\":\"Lampadaire cassé\",\"status\":\"open\",\"priority\":\"high\"}",
                    "{\"title\":\"Lampadaire cassé\",\"status\":\"resolved\",\"priority\":\"low\"}",
                    Instant.now().toString());
            new ConflitDAO().save(conflit);
            SyncService.nbConflitsProperty().set(new ConflitDAO().count());
            boutonSimulerConflit.setText("Conflit créé ✓");
            boutonSimulerConflit.setDisable(true);
        });

        Button boutonVoirConflits = new Button("⚠ Voir les conflits");
        boutonVoirConflits.setStyle(
                "-fx-background-color: #8e44ad; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 6; -fx-padding: 8 16 8 16;"
        );
        boutonVoirConflits.setVisible(SyncService.nbConflitsProperty().get() > 0);
        boutonVoirConflits.setManaged(SyncService.nbConflitsProperty().get() > 0);
        SyncService.nbConflitsProperty().addListener((obs, ancien, nb) -> {
            boolean present = nb.intValue() > 0;
            boutonVoirConflits.setVisible(present);
            boutonVoirConflits.setManaged(present);
        });
        boutonVoirConflits.setOnAction(e -> Navigateur.afficherConflits());

        HBox ligneDemo = new HBox(12, boutonHorsLigne, boutonForcerSync, boutonSimulerConflit, boutonVoirConflits);
        ligneDemo.setAlignment(Pos.CENTER_LEFT);

        VBox blocDemo = new VBox(12, titreDemo, labelStatutSync, ligneDemo);
        blocDemo.setPadding(new Insets(20));
        blocDemo.setStyle(
                "-fx-background-color: white; -fx-border-color: #f39c12;" +
                "-fx-border-radius: 6; -fx-background-radius: 6; -fx-border-width: 2;"
        );
        return blocDemo;
    }
}
