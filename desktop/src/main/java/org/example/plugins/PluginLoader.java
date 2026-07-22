package org.example.plugins;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ServiceLoader;

/**
 * Chargeur de plugins de l'application desktop.
 * Parcourt les fichiers .jar du dossier "plugins" et instancie les
 * implémentations de {@link Plugin} déclarées via le mécanisme ServiceLoader.
 */
public class PluginLoader {

    /**
     * Charge et exécute tous les plugins présents dans le dossier "plugins".
     * Crée le dossier s'il n'existe pas. Chaque jar est chargé dans son propre
     * URLClassLoader ; une erreur sur un jar n'interrompt pas les suivants.
     */
    public void loadPlugins() {

        File dossierPlugins = new File("plugins");

        if (!dossierPlugins.exists()) {
            dossierPlugins.mkdirs();
            return;
        }

        File[] fichiersJar = dossierPlugins.listFiles(
                (dir, name) -> name.endsWith(".jar")
        );

        if (fichiersJar == null || fichiersJar.length == 0) {
            return;
        }

        for (File jar : fichiersJar) {
            try {

                URL[] urls = { jar.toURI().toURL() };

                URLClassLoader classLoader =
                        new URLClassLoader(urls, Plugin.class.getClassLoader());

                ServiceLoader<Plugin> plugins =
                        ServiceLoader.load(Plugin.class, classLoader);

                for (Plugin plugin : plugins) {
                    // Exécution du plugin
                    plugin.execute();
                }

            } catch (Exception e) {
                System.err.println("Erreur lors du chargement du plugin : "
                        + jar.getName());

                e.printStackTrace();
            }
        }
    }
}