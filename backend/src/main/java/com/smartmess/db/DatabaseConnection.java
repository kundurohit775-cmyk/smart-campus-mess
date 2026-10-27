package com.smartmess.db;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Demonstrates JDBC: Connection Management & Secure Configuration.
 * 
 * Safely resolves PostgreSQL connection parameters from:
 * 1. System environment variable DATABASE_URL
 * 2. Existing backend/.env file (reusing current SmartMess configuration)
 * 3. Never hardcodes credentials or exposes secrets.
 */
public class DatabaseConnection {

    private static String jdbcUrl;
    private static String user;
    private static String password;
    private static boolean initialized = false;
    private static boolean driverLoaded = false;

    private static synchronized void initialize() {
        if (initialized) return;

        try {
            Class.forName("org.postgresql.Driver");
            driverLoaded = true;
        } catch (ClassNotFoundException e) {
            System.err.println("⚠️ PostgreSQL JDBC Driver not found on classpath: " + e.getMessage());
        }

        String rawUrl = System.getenv("DATABASE_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = readDatabaseUrlFromEnvFile();
        }

        if (rawUrl != null && !rawUrl.trim().isEmpty()) {
            parseAndSetJdbcUrl(rawUrl.trim());
        } else {
            System.out.println("ℹ️ No remote DATABASE_URL detected. Running in memory / offline safe mode.");
        }

        initialized = true;
    }

    private static String readDatabaseUrlFromEnvFile() {
        // Check relative paths from project root or smartmess-java
        String[] possiblePaths = {
            "../backend/.env",
            "backend/.env",
            "./backend/.env",
            "../../backend/.env"
        };

        for (String pathStr : possiblePaths) {
            File envFile = new File(pathStr);
            if (envFile.exists() && envFile.canRead()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.startsWith("DATABASE_URL=")) {
                            String val = line.substring("DATABASE_URL=".length()).trim();
                            // Strip quotes if present
                            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                                (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            return val;
                        }
                    }
                } catch (Exception e) {
                    // Ignore and fallback
                }
            }
        }
        return null;
    }

    private static void parseAndSetJdbcUrl(String rawUrl) {
        try {
            // Converts postgres://user:pass@host:port/db?sslmode=require into standard JDBC
            if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
                URI uri = new URI(rawUrl.replace("postgresql://", "postgres://"));
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    user = parts[0];
                    password = parts[1];
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                StringBuilder sb = new StringBuilder("jdbc:postgresql://").append(host).append(":").append(port).append(path);
                if (query != null && !query.isEmpty()) {
                    sb.append("?").append(query);
                } else {
                    sb.append("?sslmode=require");
                }
                jdbcUrl = sb.toString();
            } else if (rawUrl.startsWith("jdbc:")) {
                jdbcUrl = rawUrl;
            }
        } catch (Exception e) {
            System.err.println("Error parsing DATABASE_URL for JDBC: " + e.getMessage());
            jdbcUrl = null;
        }
    }

    /**
     * Obtains a live JDBC Connection to the SmartMess PostgreSQL database.
     */
    public static Connection getConnection() throws SQLException {
        initialize();

        if (jdbcUrl == null) {
            throw new SQLException("DATABASE_URL is not configured. Database connection unavailable.");
        }

        Properties props = new Properties();
        if (user != null) props.setProperty("user", user);
        if (password != null) props.setProperty("password", password);
        props.setProperty("sslmode", "require");
        props.setProperty("connectTimeout", "5");

        return DriverManager.getConnection(jdbcUrl, props);
    }

    public static boolean isConfigured() {
        initialize();
        return jdbcUrl != null && driverLoaded;
    }

    public static String getSanitizedJdbcUrl() {
        initialize();
        if (jdbcUrl == null) return "Not configured (Offline mode)";
        // Return host and database only, concealing credentials
        return jdbcUrl.replaceAll("//.*@", "//***:***@");
    }
}
