package org.example.database;

import org.example.Incident;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Accès aux données des incidents stockés dans la base SQLite locale.
 * Fournit la lecture, l'écriture et le suivi de l'état de synchronisation
 * (indicateurs {@code dirty} / {@code local_only}) de la table {@code incidents}.
 */
public class IncidentDAO {

    /**
     * Retourne tous les incidents locaux, du plus récent au plus ancien.
     * @return liste des incidents (vide en cas d'erreur SQL)
     */
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

    /**
     * Retourne les incidents modifiés localement et non encore poussés vers le serveur.
     * @return liste des incidents marqués {@code dirty}
     */
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

    /**
     * Recherche un incident par son identifiant.
     * @param id identifiant de l'incident (identifiant serveur ou identifiant local)
     * @return l'incident trouvé, ou {@code null} s'il n'existe pas
     */
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

    /**
     * Retourne les incidents d'un quartier donné, du plus récent au plus ancien.
     * @param neighborhoodId identifiant du quartier
     * @return liste des incidents de ce quartier
     */
    public List<Incident> findByNeighborhood(String neighborhoodId) {
        List<Incident> liste = new ArrayList<>();
        String sql = "SELECT * FROM incidents WHERE neighborhood_id = ? ORDER BY date DESC";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, neighborhoodId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) liste.add(fromResultSet(rs));
        } catch (SQLException e) {
            System.err.println("IncidentDAO.findByNeighborhood : " + e.getMessage());
        }
        return liste;
    }

    /**
     * Insère l'incident ou le remplace si son identifiant existe déjà.
     * @param incident incident à enregistrer localement
     */
    public void save(Incident incident) {
        String sql = """
            INSERT OR REPLACE INTO incidents
            (id, titre, description, priorite, statut, date, updated_at, synced_at, dirty, local_only, neighborhood_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            stmt.setString(11, incident.getNeighborhoodId());
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("IncidentDAO.save : " + e.getMessage());
        }
    }

    /**
     * Marque un incident comme synchronisé avec le serveur
     * (remise à zéro de {@code dirty} et {@code local_only}).
     * @param id identifiant de l'incident
     * @param syncedAt date de synchronisation à enregistrer
     */
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

    /**
     * Remplace l'identifiant d'un incident, typiquement après une création
     * en ligne qui renvoie l'identifiant attribué par le serveur.
     * @param ancienId identifiant local actuel
     * @param nouveauId nouvel identifiant à appliquer
     */
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

    /**
     * Supprime un incident de la base locale.
     * @param id identifiant de l'incident à supprimer
     */
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
        Incident inc = new Incident(
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
        inc.setNeighborhoodId(rs.getString("neighborhood_id"));
        return inc;
    }
}
