package org.example.plugins;

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