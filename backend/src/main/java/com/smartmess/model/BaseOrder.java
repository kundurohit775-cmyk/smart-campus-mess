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

    // Real-Time Kitchen Workflow & Countdown fields
    private int estimatedPrepMinutes = 15;
    private LocalDateTime estimatedReadyTime;
    private String chefActivity = "Order placed, waiting for chef to accept";

    public BaseOrder(int orderId, int studentId, String studentName) {
        this.orderId = orderId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.status = OrderStatus.PENDING;
        this.items = new ArrayList<>();
        this.orderTime = LocalDateTime.now();
        this.estimatedPrepMinutes = 15;
        this.estimatedReadyTime = this.orderTime.plusMinutes(15);
        this.chefActivity = "Order placed, waiting for chef to accept";
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

    public boolean isRoomDelivery() {
        return "hostel-delivery".equalsIgnoreCase(getDeliveryType());
    }

    public String getDeliveryAddress() {
        return "Cafeteria Pickup";
    }

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
        if ((status == OrderStatus.COMPLETED || status == OrderStatus.DELIVERED) && this.completedTime == null) {
            this.completedTime = LocalDateTime.now();
        }
        // Auto-update chef activity text appropriately if not manually overridden
        if (status == OrderStatus.ACCEPTED) {
            this.chefActivity = "Order accepted, cooking starts soon";
        } else if (status == OrderStatus.PREPARING) {
            this.chefActivity = "Chef is preparing your order";
        } else if (status == OrderStatus.READY) {
            this.chefActivity = "Food is ready for pickup!";
        } else if (status == OrderStatus.OUT_FOR_DELIVERY) {
            this.chefActivity = "Rider dispatched, out for delivery to your room";
        } else if (status == OrderStatus.DELIVERED) {
            this.chefActivity = "Delivered to your hostel room. Enjoy your meal!";
        } else if (status == OrderStatus.COMPLETED) {
            this.chefActivity = "Order completed. Enjoy your meal!";
        } else if (status == OrderStatus.CANCELLED) {
            this.chefActivity = "Order cancelled by student";
        }
    }

    public int getEstimatedPrepMinutes() {
        return estimatedPrepMinutes;
    }

    public void setEstimatedPrepMinutes(int estimatedPrepMinutes) {
        this.estimatedPrepMinutes = estimatedPrepMinutes;
        LocalDateTime base = this.orderTime != null ? this.orderTime : LocalDateTime.now();
        this.estimatedReadyTime = base.plusMinutes(estimatedPrepMinutes);
    }

    public LocalDateTime getEstimatedReadyTime() {
        if (estimatedReadyTime == null) {
            LocalDateTime base = this.orderTime != null ? this.orderTime : LocalDateTime.now();
            this.estimatedReadyTime = base.plusMinutes(estimatedPrepMinutes);
        }
        return estimatedReadyTime;
    }

    public void setEstimatedReadyTime(LocalDateTime estimatedReadyTime) {
        this.estimatedReadyTime = estimatedReadyTime;
    }

    public String getChefActivity() {
        return chefActivity != null ? chefActivity : "Order placed, waiting for chef";
    }

    public void setChefActivity(String chefActivity) {
        this.chefActivity = chefActivity;
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
        if (this.estimatedPrepMinutes > 0) {
            this.estimatedReadyTime = orderTime.plusMinutes(this.estimatedPrepMinutes);
        }
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
