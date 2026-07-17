package org.example.plugins;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ServiceLoader;

public class PluginLoader {

    public void loadPlugins() {

        File dossierPlugins = new File("plugins");

        if (!dossierPlugins.exists()) {
            System.out.println("Le dossier plugins n'existe pas.");
            dossierPlugins.mkdirs();
            return;
        }

        File[] fichiersJar = dossierPlugins.listFiles(
                (dir, name) -> name.endsWith(".jar")
        );

        if (fichiersJar == null || fichiersJar.length == 0) {
            System.out.println("Aucun plugin trouvé.");
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
                    System.out.println("Plugin chargé : " + plugin.getName());

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