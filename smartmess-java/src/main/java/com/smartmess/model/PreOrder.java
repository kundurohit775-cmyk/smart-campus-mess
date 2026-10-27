package com.smartmess.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents a next-day special pre-order booking to eliminate kitchen food waste.
 */
public class PreOrder {
    private int preOrderId;
    private int studentId;
    private String studentName;
    private int itemId;
    private String itemName;
    private int quantity;
    private int totalAmount;
    private String pickupToken;
    private LocalDate scheduledDate;
    private String status; // CONFIRMED, CANCELLED, FULFILLED
    private LocalDateTime createdAt;

    public PreOrder() {
        this.status = "CONFIRMED";
        this.createdAt = LocalDateTime.now();
        int tokenNum = 1000 + (int) (Math.random() * 9000);
        this.pickupToken = "PRE-" + tokenNum;
    }

    public PreOrder(int preOrderId, int studentId, String studentName, int itemId, String itemName,
                    int quantity, int totalAmount, LocalDate scheduledDate) {
        this.preOrderId = preOrderId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.itemId = itemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.scheduledDate = scheduledDate;
        this.status = "CONFIRMED";
        this.createdAt = LocalDateTime.now();
        int tokenNum = 1000 + (int) (Math.random() * 9000);
        this.pickupToken = "PRE-" + tokenNum;
    }

    public int getPreOrderId() { return preOrderId; }
    public void setPreOrderId(int preOrderId) { this.preOrderId = preOrderId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public int getItemId() { return itemId; }
    public void setItemId(int itemId) { this.itemId = itemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getTotalAmount() { return totalAmount; }
    public void setTotalAmount(int totalAmount) { this.totalAmount = totalAmount; }

    public String getPickupToken() { return pickupToken; }
    public void setPickupToken(String pickupToken) { this.pickupToken = pickupToken; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean canCancel() {
        return "CONFIRMED".equalsIgnoreCase(this.status);
    }
}
