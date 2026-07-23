package org.example.database;

import org.example.Alerte;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Accès aux données des alertes stockées dans la base SQLite locale.
 * Fournit la lecture, l'écriture et le suivi de l'état de synchronisation
 * (indicateurs {@code dirty} / {@code local_only}) de la table {@code alertes}.
 */
public class AlerteDAO {

    /**
     * Retourne toutes les alertes locales, de la plus récente à la plus ancienne.
     * @return liste des alertes (vide en cas d'erreur SQL)
     */
    public List<Alerte> findAll() {
        List<Alerte> liste = new ArrayList<>();
        String sql = "SELECT * FROM alertes ORDER BY updated_at DESC";
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

    /**
     * Retourne les alertes modifiées localement et non encore poussées vers le serveur.
     * @return liste des alertes marquées {@code dirty}
     */
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

    /**
     * Recherche une alerte par son identifiant.
     * @param id identifiant de l'alerte (identifiant serveur ou identifiant local)
     * @return l'alerte trouvée, ou {@code null} si elle n'existe pas
     */
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

    /**
     * Retourne les alertes d'un quartier donné, de la plus récente à la plus ancienne.
     * @param neighborhoodId identifiant du quartier
     * @return liste des alertes de ce quartier
     */
    public List<Alerte> findByNeighborhood(String neighborhoodId) {
        List<Alerte> liste = new ArrayList<>();
        String sql = "SELECT * FROM alertes WHERE neighborhood_id = ? ORDER BY updated_at DESC";
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, neighborhoodId);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) liste.add(fromResultSet(rs));
        } catch (SQLException e) {
            System.err.println("AlerteDAO.findByNeighborhood : " + e.getMessage());
        }
        return liste;
    }

    /**
     * Insère l'alerte ou la remplace si son identifiant existe déjà.
     * @param alerte alerte à enregistrer localement
     */
    public void save(Alerte alerte) {
        String sql = """
            INSERT OR REPLACE INTO alertes
            (id, title, message, level, statut, updated_at, synced_at, dirty, local_only, neighborhood_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (PreparedStatement stmt = DatabaseManager.getConnection().prepareStatement(sql)) {
            stmt.setString(1, alerte.getId());
            stmt.setString(2, alerte.getTitre());
            stmt.setString(3, alerte.getMessage());
            stmt.setString(4, alerte.getNiveau());
            stmt.setString(5, alerte.getStatut());
            stmt.setString(6, alerte.getUpdatedAt());
            stmt.setString(7, alerte.getSyncedAt());
            stmt.setInt(8, alerte.isDirty() ? 1 : 0);
            stmt.setInt(9, alerte.isLocalOnly() ? 1 : 0);
            stmt.setString(10, alerte.getNeighborhoodId());
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("AlerteDAO.save : " + e.getMessage());
        }
    }

    /**
     * Marque une alerte comme synchronisée avec le serveur
     * (remise à zéro de {@code dirty} et {@code local_only}).
     * @param id identifiant de l'alerte
     * @param syncedAt date de synchronisation à enregistrer
     */
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

    /**
     * Remplace l'identifiant d'une alerte, typiquement après une création
     * en ligne qui renvoie l'identifiant attribué par le serveur.
     * @param ancienId identifiant local actuel
     * @param nouveauId nouvel identifiant à appliquer
     */
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

    /**
     * Supprime une alerte de la base locale.
     * @param id identifiant de l'alerte à supprimer
     */
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
        Alerte alerte = new Alerte(
                rs.getString("id"),
                rs.getString("title"),
                rs.getString("message"),
                rs.getString("level"),
                rs.getString("statut"),
                rs.getString("updated_at"),
                rs.getString("synced_at"),
                rs.getInt("dirty") == 1,
                rs.getInt("local_only") == 1
        );
        alerte.setNeighborhoodId(rs.getString("neighborhood_id"));
        return alerte;
    }
}
