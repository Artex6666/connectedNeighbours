package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import org.example.services.ApiClient;
import org.example.services.SessionManager;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Écran d'administration global de l'application desktop.
 * Liste tous les quartiers récupérés depuis l'API sous forme de cartes et permet
 * d'ouvrir la vue détaillée d'un quartier, en plus de la navigation générale.
 */
public class VueAdmin {

    /**
     * Construit l'arborescence JavaFX de la vue admin : navbar avec badge ADMIN,
     * en-tête et zone défilante contenant les cartes de quartiers.
     *
     * @return le nœud racine de la vue admin
     */
    public Parent creerVue() {

        Image logoImage = new Image(getClass().getResourceAsStream("/logo.png"));
        ImageView logo = new ImageView(logoImage);
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        Button boutonPlugins = new Button("Plugins");
        Button boutonExports = new Button("Exports");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(boutonPlugins);
        styliserBoutonNav(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonPlugins.setOnAction(e -> Navigateur.afficherPlugins());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonDeconnexion.setOnAction(e -> {
            SessionManager.deconnecter();
            Navigateur.afficherConnexion();
        });

        Label badgeAdmin = new Label("ADMIN");
        badgeAdmin.setStyle("-fx-background-color: #8e44ad; -fx-text-fill: white; -fx-font-size: 11px;" +
                "-fx-font-weight: bold; -fx-background-radius: 4; -fx-padding: 3 8 3 8;");

        HBox menuGauche = new HBox(20, logo, badgeAdmin, boutonPlugins, boutonExports);
        menuGauche.setAlignment(Pos.CENTER_LEFT);

        Region espace = new Region();
        HBox.setHgrow(espace, Priority.ALWAYS);

        HBox navbar = new HBox(20, menuGauche, espace, boutonDeconnexion);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Vue globale — Tous les quartiers");
        titre.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Sélectionnez un quartier pour consulter ses données.");
        sousTitre.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        VBox entete = new VBox(5, titre, sousTitre);
        entete.setAlignment(Pos.CENTER_LEFT);

        FlowPane cartes = new FlowPane();
        cartes.setHgap(20);
        cartes.setVgap(20);
        cartes.setPadding(new Insets(10));

        chargerQuartiers(cartes);

        VBox blocDemo = VueOutilsDemo.creerBlocDemo();

        VBox contenuScroll = new VBox(20, cartes, blocDemo);

        ScrollPane scroll = new ScrollPane(contenuScroll);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color: transparent; -fx-background: transparent;");
        VBox.setVgrow(scroll, Priority.ALWAYS);

        VBox contenu = new VBox(20, entete, scroll);
        contenu.setPadding(new Insets(30));

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    /**
     * Appelle l'endpoint {@code /neighborhoods} de l'API et ajoute une carte par quartier
     * au conteneur fourni. En cas d'erreur, un libellé d'erreur est ajouté à la place.
     *
     * @param cartes conteneur qui reçoit les cartes de quartiers
     */
    private void chargerQuartiers(FlowPane cartes) {
        try {
            ApiClient api = SessionManager.getApiClient();
            String reponse = api.get("/neighborhoods");
            JSONObject json = new JSONObject(reponse);
            JSONArray data = json.optJSONArray("data");
            if (data == null) return;

            for (int i = 0; i < data.length(); i++) {
                JSONObject q = data.getJSONObject(i);
                String id = q.optString("_id", "");
                String nom = q.optString("name", "Quartier");
                String description = q.optString("description", "");
                cartes.getChildren().add(creerCarteQuartier(id, nom, description));
            }
        } catch (Exception e) {
            Label err = new Label("Impossible de charger les quartiers : " + e.getMessage());
            err.setStyle("-fx-text-fill: #e74c3c;");
            cartes.getChildren().add(err);
        }
    }

    private VBox creerCarteQuartier(String id, String nom, String description) {
        Label labelNom = new Label(nom);
        labelNom.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label labelDesc = new Label(description.isEmpty() ? "Aucune description" : description);
        labelDesc.setStyle("-fx-font-size: 12px; -fx-text-fill: #6c757d;");
        labelDesc.setWrapText(true);
        labelDesc.setMaxWidth(220);

        Button boutonVoir = new Button("Voir le quartier");
        boutonVoir.setStyle("-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 7 14 7 14;");
        boutonVoir.setOnAction(e -> Navigateur.afficherQuartier(id, nom));

        VBox carte = new VBox(10, labelNom, labelDesc, boutonVoir);
        carte.setPadding(new Insets(20));
        carte.setPrefWidth(260);
        carte.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;" +
                "-fx-border-radius: 8; -fx-background-radius: 8;" +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.06), 6, 0, 0, 2);");
        return carte;
    }

    private void styliserBoutonNav(Button b) {
        b.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonDanger(Button b) {
        b.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-font-size: 13px;" +
                "-fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }
}
