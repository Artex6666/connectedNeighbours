package org.example.database;

import org.example.Incident;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class IncidentDAO {

    public List<Incident> findAll() {
        List<Incident> liste = new ArrayList<>();
        String sql = "SELECT * FROM incidents ORDER BY date DESC";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                liste.add(fromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("IncidentDAO.findAll : " + e.getMessage());
        }
        return liste;
    }

    public List<Incident> findDirty() {
        List<Incident> liste = new ArrayList<>();
        String sql = "SELECT * FROM incidents WHERE dirty = 1";
        try (Statement stmt = DatabaseManager.getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                liste.add(fromResultSet(rs));
            }
        } catch (SQLException e) {
            System.err.println("IncidentDAO.findDirty : " + e.getMessage());
        }
        return liste;
    }

    public Incident findById(String id) {
        String sql = "SELECT * FROM incidents WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return fromResultSet(rs);
        } catch (SQLException e) {
            System.err.println("IncidentDAO.findById : " + e.getMessage());
        }
        return null;
    }

    public void save(Incident incident) {
        String sql = """
            INSERT OR REPLACE INTO incidents
            (id, titre, description, priorite, statut, date, updated_at, synced_at, dirty, local_only)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, incident.getId());
            stmt.setString(2, incident.getTitre());
            stmt.setString(3, incident.getDescription());
            stmt.setString(4, incident.getPriorite());
            stmt.setString(5, incident.getStatut());
            stmt.setString(6, incident.getDate());
            stmt.setString(7, incident.getUpdatedAt());
            stmt.setString(8, incident.getSyncedAt());
            stmt.setInt(9, incident.isDirty() ? 1 : 0);
            stmt.setInt(10, incident.isLocalOnly() ? 1 : 0);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("IncidentDAO.save : " + e.getMessage());
        }
    }

    public void markSynced(String id, String syncedAt) {
        String sql = "UPDATE incidents SET dirty = 0, local_only = 0, synced_at = ? WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, syncedAt);
            stmt.setString(2, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("IncidentDAO.markSynced : " + e.getMessage());
        }
    }

    public void updateId(String ancienId, String nouveauId) {
        String sql = "UPDATE incidents SET id = ? WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, nouveauId);
            stmt.setString(2, ancienId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("IncidentDAO.updateId : " + e.getMessage());
        }
    }

    public void delete(String id) {
        String sql = "DELETE FROM incidents WHERE id = ?";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("IncidentDAO.delete : " + e.getMessage());
        }
    }

    private Incident fromResultSet(ResultSet rs) throws SQLException {
        return new Incident(
                rs.getString("id"),
                rs.getString("titre"),
                rs.getString("description"),
                rs.getString("priorite"),
                rs.getString("statut"),
                rs.getString("date"),
                rs.getString("updated_at"),
                rs.getString("synced_at"),
                rs.getInt("dirty") == 1,
                rs.getInt("local_only") == 1
        );
    }
}
