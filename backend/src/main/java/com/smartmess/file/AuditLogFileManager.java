package com.smartmess.file;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates File Handling:
 * Appending audit trails to permanent disk storage and retrieving audit records
 * using try-with-resources and proper character stream encoding.
 */
public class AuditLogFileManager {

    private final String logFilePath;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public AuditLogFileManager(String logFilePath) {
        this.logFilePath = logFilePath;
        ensureDirectoryExists();
    }

    private void ensureDirectoryExists() {
        try {
            Path path = Paths.get(logFilePath);
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
        } catch (IOException e) {
            System.err.println("Failed to create audit log directory: " + e.getMessage());
        }
    }

    /**
     * Appends an audit event to the file using FileWriter(file, true) in try-with-resources.
     */
    public synchronized void logTransaction(String action, int studentId, int orderId, int amount, String details) {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String logEntry = String.format("[%s] ACTION: %-15s | STUDENT: #%-4d | ORDER: #%-4d | AMOUNT: %-4d Cr | %s%n",
                timestamp, action, studentId, orderId, amount, details);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(logFilePath, true))) {
            writer.write(logEntry);
        } catch (IOException e) {
            System.err.println("Error writing to audit log file: " + e.getMessage());
        }
    }

    /**
     * Reads all recorded audit transactions from the log file.
     */
    public List<String> readAllAuditLogs() throws IOException {
        List<String> logs = new ArrayList<>();
        File file = new File(logFilePath);
        if (!file.exists()) {
            return logs;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    logs.add(line);
                }
            }
        }
        return logs;
    }

    public String getLogFilePath() {
        return logFilePath;
    }
}
