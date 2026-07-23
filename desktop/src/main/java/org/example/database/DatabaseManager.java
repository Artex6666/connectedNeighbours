package org.example.database;

import java.sql.*;

/**
 * Gère la connexion à la base SQLite locale de l'application desktop.
 * Maintient une connexion unique partagée et crée le schéma
 * (incidents, alertes, conflits) au démarrage.
 */
public class DatabaseManager {

    private static final String DB_URL = "jdbc:sqlite:bobconnect.db";
    private static Connection connection;

    /**
     * Retourne la connexion SQLite partagée, en la rouvrant si nécessaire.
     * @return connexion ouverte vers la base locale
     * @throws SQLException si la connexion ne peut pas être établie
     */
    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            connection = DriverManager.getConnection(DB_URL);
        }
        return connection;
    }

    /**
     * Initialise la base : réglages PRAGMA, création des tables si absentes
     * et migration ajoutant la colonne {@code neighborhood_id}.
     */
    public static void initialiser() {
        try {
            Connection conn = getConnection();

            try (Statement pragma = conn.createStatement()) {
                pragma.execute("PRAGMA busy_timeout = 5000");
                pragma.execute("PRAGMA journal_mode=WAL");
            }

            Statement stmt = conn.createStatement();

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT,
                    status TEXT,
                    updated_at TEXT,
                    synced_at TEXT,
                    dirty INTEGER DEFAULT 1,
                    local_only INTEGER DEFAULT 1
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS alertes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    message TEXT,
                    level TEXT,
                    statut TEXT,
                    updated_at TEXT,
                    synced_at TEXT,
                    dirty INTEGER DEFAULT 1,
                    local_only INTEGER DEFAULT 1
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS conflits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    local_data TEXT NOT NULL,
                    server_data TEXT NOT NULL,
                    detected_at TEXT NOT NULL,
                    resolved INTEGER DEFAULT 0
                )
            """);

            // Migration : ajout de neighborhood_id si la colonne n'existe pas encore
            for (String table : new String[]{"incidents", "alertes"}) {
                try {
                    stmt.execute("ALTER TABLE " + table + " ADD COLUMN neighborhood_id TEXT");
                } catch (SQLException ignored) {
                    // Colonne déjà présente
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erreur initialisation base de données : " + e.getMessage(), e);
        }
    }
}
