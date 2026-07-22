package org.example.plugins;

/**
 * Contrat que doit implémenter tout plugin externe de l'application.
 * Les implémentations sont découvertes par {@link PluginLoader} via ServiceLoader.
 */
public interface Plugin {

    /**
     * Nom affiché du plugin
     */
    String getName();

    /**
     * Méthode exécutée lorsque le plugin est lancé
     */
    void execute();
}