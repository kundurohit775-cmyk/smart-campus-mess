package com.smartmess.model;

import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents an immutable audit entry for kitchen and menu stock alterations.
 */
public class StockChangeRecord {
    private int recordId;
    private int itemId;
    private String itemName;
    private int oldQuantity;
    private int newQuantity;
    private int delta;
    private String reason; // "Sold out", "Spoiled", "Ingredient shortage", "Restocked", "Other"
    private String performedBy;
    private LocalDateTime timestamp;

    public StockChangeRecord() {
        this.timestamp = LocalDateTime.now();
    }

    public StockChangeRecord(int recordId, int itemId, String itemName, int oldQuantity,
                             int newQuantity, String reason, String performedBy) {
        this.recordId = recordId;
        this.itemId = itemId;
        this.itemName = itemName;
        this.oldQuantity = oldQuantity;
        this.newQuantity = newQuantity;
        this.delta = newQuantity - oldQuantity;
        this.reason = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Stock Adjustment";
        this.performedBy = (performedBy != null && !performedBy.trim().isEmpty()) ? performedBy.trim() : "admin@campus.edu";
        this.timestamp = LocalDateTime.now();
    }

    public int getRecordId() { return recordId; }
    public void setRecordId(int recordId) { this.recordId = recordId; }

    public int getItemId() { return itemId; }
    public void setItemId(int itemId) { this.itemId = itemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public int getOldQuantity() { return oldQuantity; }
    public void setOldQuantity(int oldQuantity) { this.oldQuantity = oldQuantity; }

    public int getNewQuantity() { return newQuantity; }
    public void setNewQuantity(int newQuantity) { this.newQuantity = newQuantity; }

    public int getDelta() { return delta; }
    public void setDelta(int delta) { this.delta = delta; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
