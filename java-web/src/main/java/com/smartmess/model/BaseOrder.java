package com.smartmess.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates OOP: Abstraction and Encapsulation.
 * Abstract base class for all customer orders in the system.
 */
public abstract class BaseOrder {
    private int orderId;
    private int studentId;
    private String studentName;
    private String pickupToken;
    private OrderStatus status;
    private int totalAmount;
    private int totalCalories;
    private LocalDateTime orderTime;
    private LocalDateTime completedTime;
    private List<OrderItem> items;

    public BaseOrder(int orderId, int studentId, String studentName) {
        this.orderId = orderId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.status = OrderStatus.PENDING;
        this.items = new ArrayList<>();
        this.orderTime = LocalDateTime.now();
        this.totalAmount = 0;
        this.totalCalories = 0;
    }

    public void addItem(OrderItem item) {
        if (item != null) {
            this.items.add(item);
            this.totalAmount += item.getSubtotal();
            if (item.getCalories() != null) {
                this.totalCalories += item.getCalories() * item.getQuantity();
            }
        }
    }

    /**
     * Demonstrates OOP: Abstraction.
     * Concrete subclasses define their specific pickup token prefix (e.g. "TK-" vs "ROOM-TK-").
     */
    public abstract String getPickupTokenPrefix();

    /**
     * Demonstrates OOP: Abstraction.
     * Returns delivery modality identifier ('self-pickup' vs 'hostel-delivery').
     */
    public abstract String getDeliveryType();

    /**
     * Polymorphic description of fulfillment destination.
     */
    public abstract String getFulfillmentDescription();

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getPickupToken() {
        return pickupToken;
    }

    public void setPickupToken(String pickupToken) {
        this.pickupToken = pickupToken;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
        if (status == OrderStatus.COMPLETED && this.completedTime == null) {
            this.completedTime = LocalDateTime.now();
        }
    }

    public int getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(int totalAmount) {
        this.totalAmount = totalAmount;
    }

    public int getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(int totalCalories) {
        this.totalCalories = totalCalories;
    }

    public LocalDateTime getOrderTime() {
        return orderTime;
    }

    public void setOrderTime(LocalDateTime orderTime) {
        this.orderTime = orderTime;
    }

    public LocalDateTime getCompletedTime() {
        return completedTime;
    }

    public void setCompletedTime(LocalDateTime completedTime) {
        this.completedTime = completedTime;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
        this.totalAmount = items.stream().mapToInt(OrderItem::getSubtotal).sum();
        this.totalCalories = items.stream()
                .mapToInt(i -> (i.getCalories() != null ? i.getCalories() * i.getQuantity() : 0))
                .sum();
    }

    @Override
    public String toString() {
        return String.format("Order #%d | Token: %s | Status: %s | %s | Total: %d Cr (%d kcal)",
                orderId, pickupToken, status.getDisplayName(), getFulfillmentDescription(), totalAmount, totalCalories);
    }
}
