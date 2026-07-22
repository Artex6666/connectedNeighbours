package org.example.services;

import javafx.scene.control.Alert;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;

import java.io.FileWriter;
import java.io.IOException;

/**
 * Service d'export CSV des tableaux affichés dans l'interface JavaFX.
 * Écrit les colonnes et les lignes visibles dans un fichier, puis informe
 * l'utilisateur du résultat via une boîte de dialogue.
 */
public class ExportService {

    /**
     * Exporte le contenu d'un TableView vers un fichier texte séparé par des points-virgules.
     * @param table tableau JavaFX dont les colonnes et éléments sont exportés
     * @param fileName chemin du fichier de destination
     */
    @SuppressWarnings({ "rawtypes", "unchecked" })
    public static void exportTable(TableView<?> table, String fileName) {

        try (FileWriter writer = new FileWriter(fileName)) {

            for (TableColumn col : table.getColumns()) {
                writer.write(escape(col.getText()) + ";");
            }
            writer.write("\n");

            for (Object item : table.getItems()) {
                for (TableColumn col : table.getColumns()) {
                    Object value = col.getCellData(item);
                    writer.write(escape(value != null ? value.toString() : "") + ";");
                }
                writer.write("\n");
            }

            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle("Export");
            alert.setHeaderText(null);
            alert.setContentText("Export réussi :\n" + fileName);
            alert.showAndWait();

        } catch (IOException e) {
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Erreur export");
            alert.setHeaderText(null);
            alert.setContentText("Impossible d'exporter le fichier :\n" + e.getMessage());
            alert.showAndWait();

            e.printStackTrace();
        }
    }

    private static String escape(String value) {
        return value
                .replace(";", ",")
                .replace("\n", " ")
                .replace("\r", " ");
    }
}