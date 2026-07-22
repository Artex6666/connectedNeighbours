package org.example;

/**
 * Point d'entrée du jar exécutable.
 * Classe intermédiaire qui ne dérive pas de Application, afin de permettre
 * le lancement de JavaFX depuis un jar sans modules explicites.
 */
public class Launcher {
    /**
     * Délègue le démarrage à {@link Main#main(String[])}.
     *
     * @param args arguments de la ligne de commande
     */
    public static void main(String[] args) {
        Main.main(args);
    }
}
