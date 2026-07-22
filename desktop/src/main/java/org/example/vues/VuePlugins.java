package org.example;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import org.example.plugins.PluginLoader;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

/**
 * Écran « Plugins » de l'application desktop.
 * Présente les extensions disponibles sous forme de cartes indiquant leur état
 * (non installé, actif, désactivé) à partir du contenu du dossier « plugins »,
 * et permet de les installer, activer, désactiver, supprimer ou exécuter.
 */
public class VuePlugins {

    private final File dossierPlugins = new File("plugins");

    /**
     * Construit l'écran de gestion des plugins : crée le dossier « plugins » s'il
     * n'existe pas, affiche la barre de navigation, les cartes des extensions et le
     * bouton de chargement des plugins actifs via {@link PluginLoader}.
     *
     * @return le nœud racine de la vue
     */
    public Parent creerVue() {

        if (!dossierPlugins.exists()) {
            dossierPlugins.mkdirs();
        }

        ImageView logo = new ImageView(new Image(getClass().getResourceAsStream("/logo.png")));
        logo.setFitHeight(40);
        logo.setPreserveRatio(true);

        Button boutonDashboard = new Button("Dashboard");
        Button boutonIncidents = new Button("Incidents");
        Button boutonAlertes = new Button("Alertes");
        Button boutonStatistiques = new Button("Statistiques");
        Button boutonPlugins = new Button("Plugins");
        Button boutonExports = new Button("Exports");
        Button boutonDeconnexion = new Button("Déconnexion");

        styliserBoutonNav(boutonDashboard);
        styliserBoutonNav(boutonIncidents);
        styliserBoutonNav(boutonAlertes);
        styliserBoutonNav(boutonStatistiques);
        styliserBoutonNavActif(boutonPlugins);
        styliserBoutonNav(boutonExports);
        styliserBoutonDanger(boutonDeconnexion);

        boutonDashboard.setOnAction(e -> Navigateur.afficherDashboard());
        boutonIncidents.setOnAction(e -> Navigateur.afficherIncidents());
        boutonAlertes.setOnAction(e -> Navigateur.afficherAlertes());
        boutonStatistiques.setOnAction(e -> Navigateur.afficherStatistiques());
        boutonExports.setOnAction(e -> Navigateur.afficherExports());
        boutonDeconnexion.setOnAction(e -> Navigateur.afficherConnexion());

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

        HBox navbar = new HBox(20, menuGauche, espace, boutonDeconnexion);
        navbar.setPadding(new Insets(10, 20, 10, 20));
        navbar.setAlignment(Pos.CENTER);
        navbar.setStyle("-fx-background-color: white; -fx-border-color: #dcdcdc;");

        Label titre = new Label("Gestion des plugins");
        titre.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label sousTitre = new Label("Installez, activez, désactivez et exécutez les extensions.");
        sousTitre.setStyle("-fx-font-size: 14px; -fx-text-fill: #6c757d;");

        VBox entete = new VBox(5, titre, sousTitre);

        HBox cartes = new HBox(
                20,
                creerCartePlugin(
                        "export-statistiques",
                        "Export statistiques",
                        "Exporter les statistiques au format CSV.",
                        "export-stats-plugin/target/export-stats-plugin-1.0.0.jar"
                ),
                creerCartePlugin(
                        "calendrier-local",
                        "Calendrier local",
                        "Afficher les événements du quartier.",
                        null
                ),
                creerCartePlugin(
                        "analyse-sociale",
                        "Analyse sociale",
                        "Analyser les interactions entre résidents.",
                        null
                )
        );

        cartes.setAlignment(Pos.CENTER);

        Button chargerPlugins = new Button("Charger les plugins actifs");
        styliserBoutonPrincipal(chargerPlugins);
        chargerPlugins.setOnAction(e -> new PluginLoader().loadPlugins());

        VBox contenu = new VBox(30, entete, cartes, chargerPlugins);
        contenu.setPadding(new Insets(40));
        contenu.setAlignment(Pos.TOP_CENTER);

        VBox racine = new VBox(navbar, contenu);
        racine.setStyle("-fx-background-color: #f5f6fa;");

        return racine;
    }

    private VBox creerCartePlugin(String id, String nom, String description, String sourceJarPath) {

        File pluginActif = new File(dossierPlugins, id + ".jar");
        File pluginDesactive = new File(dossierPlugins, id + ".jar.disabled");

        boolean estActif = pluginActif.exists();
        boolean estDesactive = pluginDesactive.exists();
        boolean estInstalle = estActif || estDesactive;

        Label titre = new Label(nom);
        titre.setStyle("-fx-font-size: 18px; -fx-font-weight: bold; -fx-text-fill: #2c3e50;");

        Label desc = new Label(description);
        desc.setWrapText(true);
        desc.setStyle("-fx-font-size: 13px; -fx-text-fill: #6c757d;");

        Label statut = new Label(
                estActif ? "Actif" :
                        estDesactive ? "Désactivé" :
                                "Non installé"
        );

        statut.setStyle(
                estActif ? "-fx-text-fill: #27ae60; -fx-font-weight: bold;" :
                        estDesactive ? "-fx-text-fill: #e67e22; -fx-font-weight: bold;" :
                                "-fx-text-fill: #95a5a6; -fx-font-weight: bold;"
        );

        Button boutonPrincipal = new Button();
        Button boutonSecondaire = new Button();

        if (!estInstalle) {
            boutonPrincipal.setText("Télécharger");
            styliserBoutonVert(boutonPrincipal);
            boutonPrincipal.setOnAction(e -> installerPlugin(sourceJarPath, pluginActif, nom));
            boutonSecondaire.setVisible(false);
        } else if (estActif) {
            boutonPrincipal.setText("Exécuter");
            styliserBoutonPrincipal(boutonPrincipal);
            boutonPrincipal.setOnAction(e -> new PluginLoader().loadPlugins());

            boutonSecondaire.setText("Désactiver");
            styliserBoutonSecondaire(boutonSecondaire);
            boutonSecondaire.setOnAction(e -> desactiverPlugin(pluginActif, pluginDesactive, nom));
        } else {
            boutonPrincipal.setText("Activer");
            styliserBoutonVert(boutonPrincipal);
            boutonPrincipal.setOnAction(e -> activerPlugin(pluginDesactive, pluginActif, nom));

            boutonSecondaire.setText("Supprimer");
            styliserBoutonDanger(boutonSecondaire);
            boutonSecondaire.setOnAction(e -> supprimerPlugin(pluginDesactive, nom));
        }

        HBox boutons = new HBox(10, boutonPrincipal, boutonSecondaire);
        boutons.setAlignment(Pos.CENTER_LEFT);

        VBox carte = new VBox(15, titre, desc, statut, boutons);
        carte.setPadding(new Insets(20));
        carte.setPrefWidth(280);
        carte.setMinHeight(210);
        carte.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: #dcdcdc;" +
                        "-fx-border-radius: 8;" +
                        "-fx-background-radius: 8;"
        );

        return carte;
    }

    private void installerPlugin(String sourceJarPath, File destination, String nom) {
        if (sourceJarPath == null) {
            afficherInfo("Plugin indisponible", nom + " n'est pas encore disponible au téléchargement.");
            return;
        }

        File source = new File(sourceJarPath);

        if (!source.exists()) {
            afficherInfo("Plugin introuvable", "Compile d'abord le plugin :\n" + source.getPath());
            return;
        }

        try {
            Files.copy(source.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
            afficherInfo("Plugin installé", nom + " a été installé et activé.");
            Navigateur.afficherPlugins();
        } catch (IOException e) {
            afficherInfo("Erreur", "Impossible d'installer le plugin.");
            e.printStackTrace();
        }
    }

    private void desactiverPlugin(File actif, File desactive, String nom) {
        if (actif.renameTo(desactive)) {
            afficherInfo("Plugin désactivé", nom + " a été désactivé.");
            Navigateur.afficherPlugins();
        } else {
            afficherInfo("Erreur", "Impossible de désactiver le plugin.");
        }
    }

    private void activerPlugin(File desactive, File actif, String nom) {
        if (desactive.renameTo(actif)) {
            afficherInfo("Plugin activé", nom + " a été activé.");
            Navigateur.afficherPlugins();
        } else {
            afficherInfo("Erreur", "Impossible d'activer le plugin.");
        }
    }

    private void supprimerPlugin(File fichier, String nom) {
        if (fichier.delete()) {
            afficherInfo("Plugin supprimé", nom + " a été supprimé.");
            Navigateur.afficherPlugins();
        } else {
            afficherInfo("Erreur", "Impossible de supprimer le plugin.");
        }
    }

    private void afficherInfo(String titre, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(titre);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private void styliserBoutonNav(Button bouton) {
        bouton.setStyle("-fx-background-color: transparent; -fx-text-fill: #2c3e50; -fx-font-size: 13px;");
    }

    private void styliserBoutonNavActif(Button bouton) {
        bouton.setStyle("-fx-background-color: #e9f2ff; -fx-text-fill: #2f80ed; -fx-font-size: 13px; -fx-font-weight: bold; -fx-background-radius: 5; -fx-padding: 6 12 6 12;");
    }

    private void styliserBoutonPrincipal(Button bouton) {
        bouton.setStyle("-fx-background-color: #2f80ed; -fx-text-fill: white; -fx-font-size: 13px; -fx-font-weight: bold; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonVert(Button bouton) {
        bouton.setStyle("-fx-background-color: #00b35c; -fx-text-fill: white; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonSecondaire(Button bouton) {
        bouton.setStyle("-fx-background-color: white; -fx-text-fill: #2c3e50; -fx-border-color: #cfd6dd; -fx-border-radius: 6; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }

    private void styliserBoutonDanger(Button bouton) {
        bouton.setStyle("-fx-background-color: #e74c3c; -fx-text-fill: white; -fx-background-radius: 6; -fx-padding: 8 16 8 16;");
    }
}