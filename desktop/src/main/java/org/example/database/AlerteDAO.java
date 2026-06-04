package org.example.database;

import org.example.Alerte;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AlerteDAO {

    public List<Alerte> findAll() {
        List<Alerte> liste = new ArrayList<>();
        String sql = "SELECT * FROM alertes ORDER BY date DESC";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                liste.add(fromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("AlerteDAO.findAll : " + e.getMessage());
        }
        return liste;
    }

    public List<Alerte> findDirty() {
        List<Alerte> liste = new ArrayList<>();
        String sql = "SELECT * FROM alertes WHERE dirty = 1";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                liste.add(fromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("AlerteDAO.findDirty : " + e.getMessage());
        }
        return liste;
    }

    public Alerte findById(String id) {
        String sql = "SELECT * FROM alertes WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return fromResultSet(rs);
        } catch (SQLException e) {
            System.err.println("AlerteDAO.findById : " + e.getMessage());
        }
        return null;
    }

    public void save(Alerte alerte) {
        String sql = """
            INSERT OR REPLACE INTO alertes
            (id, titre, message, niveau, statut, date, updated_at, synced_at, dirty, local_only)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, alerte.getId());
            stmt.setString(2, alerte.getTitre());
            stmt.setString(3, alerte.getMessage());
            stmt.setString(4, alerte.getNiveau());
            stmt.setString(5, alerte.getStatut());
            stmt.setString(6, alerte.getDate());
            stmt.setString(7, alerte.getUpdatedAt());
            stmt.setString(8, alerte.getSyncedAt());
            stmt.setInt(9, alerte.isDirty() ? 1 : 0);
            stmt.setInt(10, alerte.isLocalOnly() ? 1 : 0);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("AlerteDAO.save : " + e.getMessage());
        }
    }

    public void markSynced(String id, String syncedAt) {
        String sql = "UPDATE alertes SET dirty = 0, local_only = 0, synced_at = ? WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, syncedAt);
            stmt.setString(2, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("AlerteDAO.markSynced : " + e.getMessage());
        }
    }

    public void updateId(String ancienId, String nouveauId) {
        String sql = "UPDATE alertes SET id = ? WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, nouveauId);
            stmt.setString(2, ancienId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("AlerteDAO.updateId : " + e.getMessage());
        }
    }

    public void delete(String id) {
        String sql = "DELETE FROM alertes WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("AlerteDAO.delete : " + e.getMessage());
        }
    }

    private Alerte fromResultSet(ResultSet rs) throws SQLException {
        return new Alerte(
                rs.getString("id"),
                rs.getString("titre"),
                rs.getString("message"),
                rs.getString("niveau"),
                rs.getString("statut"),
                rs.getString("date"),
                rs.getString("updated_at"),
                rs.getString("synced_at"),
                rs.getInt("dirty") == 1,
                rs.getInt("local_only") == 1
        );
    }
}
