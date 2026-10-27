package com.smartmess.model;

import java.time.LocalDate;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents a chef kitchen wastage log entry per dish per day.
 */
public class WastageRecord {
    private int logId;
    private int itemId;
    private String itemName;
    private LocalDate logDate;
    private int preparedQuantity;
    private int soldQuantity;
    private int wastedQuantity;
    private String reason;

    public WastageRecord() {
        this.logDate = LocalDate.now();
    }

    public WastageRecord(int logId, int itemId, String itemName, LocalDate logDate,
                         int preparedQuantity, int soldQuantity, String reason) {
        this.logId = logId;
        this.itemId = itemId;
        this.itemName = itemName;
        this.logDate = logDate;
        this.preparedQuantity = preparedQuantity;
        this.soldQuantity = soldQuantity;
        this.wastedQuantity = Math.max(0, preparedQuantity - soldQuantity);
        this.reason = reason;
    }

    public int getLogId() { return logId; }
    public void setLogId(int logId) { this.logId = logId; }

    public int getItemId() { return itemId; }
    public void setItemId(int itemId) { this.itemId = itemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }

    public int getPreparedQuantity() { return preparedQuantity; }
    public void setPreparedQuantity(int preparedQuantity) {
        this.preparedQuantity = preparedQuantity;
        this.wastedQuantity = Math.max(0, this.preparedQuantity - this.soldQuantity);
    }

    public int getSoldQuantity() { return soldQuantity; }
    public void setSoldQuantity(int soldQuantity) {
        this.soldQuantity = soldQuantity;
        this.wastedQuantity = Math.max(0, this.preparedQuantity - this.soldQuantity);
    }

    public int getWastedQuantity() { return wastedQuantity; }
    public void setWastedQuantity(int wastedQuantity) { this.wastedQuantity = wastedQuantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
