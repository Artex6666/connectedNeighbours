package org.example.database;

import org.example.Conflit;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Accès aux données des conflits de synchronisation enregistrés localement.
 * Un conflit est créé quand une entité modifiée hors ligne a aussi été
 * modifiée côté serveur ; il reste en attente jusqu'à sa résolution.
 */
public class ConflitDAO {

    /**
     * Retourne les conflits non résolus, du plus récent au plus ancien.
     * @return liste des conflits en attente de résolution
     */
    public List<Conflit> findUnresolved() {
        List<Conflit> liste = new ArrayList<>();
        String sql = "SELECT * FROM conflits WHERE resolved = 0 ORDER BY detected_at DESC";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                liste.add(fromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("ConflitDAO.findUnresolved : " + e.getMessage());
        }
        return liste;
    }

    /**
     * Compte les conflits non résolus.
     * @return nombre de conflits en attente (0 en cas d'erreur SQL)
     */
    public int count() {
        String sql = "SELECT COUNT(*) FROM conflits WHERE resolved = 0";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            System.err.println("ConflitDAO.count : " + e.getMessage());
        }
        return 0;
    }

    /**
     * Enregistre un nouveau conflit, marqué comme non résolu.
     * @param conflit conflit détecté à conserver
     */
    public void save(Conflit conflit) {
        String sql = """
            INSERT INTO conflits (entity_type, entity_id, local_data, server_data, detected_at, resolved)
            VALUES (?, ?, ?, ?, ?, 0)
        """;
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, conflit.getEntityType());
            stmt.setString(2, conflit.getEntityId());
            stmt.setString(3, conflit.getLocalData());
            stmt.setString(4, conflit.getServerData());
            stmt.setString(5, conflit.getDetectedAt());
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("ConflitDAO.save : " + e.getMessage());
        }
    }

    /**
     * Marque un conflit comme résolu.
     * @param id identifiant du conflit
     */
    public void resolve(int id) {
        String sql = "UPDATE conflits SET resolved = 1 WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("ConflitDAO.resolve : " + e.getMessage());
        }
    }

    private Conflit fromResultSet(ResultSet rs) throws SQLException {
        return new Conflit(
                rs.getInt("id"),
                rs.getString("entity_type"),
                rs.getString("entity_id"),
                rs.getString("local_data"),
                rs.getString("server_data"),
                rs.getString("detected_at")
        );
    }
}
