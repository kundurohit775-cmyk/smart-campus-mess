package com.smartmess.file;

import com.smartmess.model.BaseOrder;
import com.smartmess.model.OrderItem;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates File Handling:
 * 1. Proper resource management using try-with-resources.
 * 2. Exporting structured order history to CSV files using BufferedWriter and PrintWriter.
 * 3. Reading and parsing CSV records back into memory using BufferedReader and FileReader.
 */
public class OrderHistoryExporter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static boolean exportToCsv(List<BaseOrder> orders, String filePath) {
        try {
            exportOrdersToCSV(orders, filePath);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Exports a list of orders to a clean CSV report.
     * Uses try-with-resources for automatic resource closing.
     */
    public static File exportOrdersToCSV(List<BaseOrder> orders, String filePath) throws IOException {
        Path path = Paths.get(filePath);
        if (path.getParent() != null) {
            Files.createDirectories(path.getParent());
        }

        File file = path.toFile();
        try (PrintWriter writer = new PrintWriter(new BufferedWriter(new FileWriter(file)))) {
            // Write CSV Header
            writer.println("OrderID,PickupToken,StudentID,StudentName,Status,DeliveryType,TotalAmount,TotalCalories,OrderTime,ItemsCount");

            for (BaseOrder order : orders) {
                String line = String.format("%d,%s,%d,\"%s\",%s,%s,%d,%d,%s,%d",
                        order.getOrderId(),
                        order.getPickupToken(),
                        order.getStudentId(),
                        order.getStudentName() != null ? order.getStudentName().replace("\"", "\"\"") : "",
                        order.getStatus().getDisplayName(),
                        order.getDeliveryType(),
                        order.getTotalAmount(),
                        order.getTotalCalories(),
                        order.getOrderTime() != null ? order.getOrderTime().format(DATE_FORMATTER) : "",
                        order.getItems() != null ? order.getItems().size() : 0
                );
                writer.println(line);
            }
        }
        return file;
    }

    /**
     * Reads exported CSV records and returns raw parsed line summaries.
     * Demonstrates FileReader and BufferedReader with try-with-resources.
     */
    public static List<String> readOrderExportSummary(String filePath) throws IOException {
        List<String> records = new ArrayList<>();
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("Export file not found at: " + filePath);
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip CSV header
                }
                if (!line.trim().isEmpty()) {
                    records.add(line.trim());
                }
            }
        }
        return records;
    }
}
