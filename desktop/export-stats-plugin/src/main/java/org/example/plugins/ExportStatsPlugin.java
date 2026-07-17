package org.example.plugins;

import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;

public class ExportStatsPlugin implements Plugin {

    @Override
    public String getName() {
        return "Export statistiques";
    }

    @Override
    public void execute() {
        String fileName = "export-statistiques-plugin.csv";

        try (FileWriter writer = new FileWriter(fileName)) {
            writer.write("statistique;valeur\n");
            writer.write("Incidents ce mois;18\n");
            writer.write("Alertes traitées;11\n");
            writer.write("Voisins actifs;74\n");
            writer.write("Taux participation;68%\n");
            writer.write("Date export;" + LocalDateTime.now() + "\n");

            System.out.println("Export CSV créé : " + fileName);
        } catch (IOException e) {
            System.err.println("Erreur export CSV : " + e.getMessage());
        }
    }
}