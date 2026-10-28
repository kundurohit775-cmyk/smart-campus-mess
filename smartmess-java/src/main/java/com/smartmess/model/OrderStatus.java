package com.smartmess.model;

/**
 * Represents the lifecycle stages of an order in the SmartMess system.
 * Follows the canonical status flow:
 * Self-Pickup:   PENDING -> ACCEPTED -> PREPARING -> READY -> COMPLETED (or CANCELLED)
 * Room Delivery: PENDING -> ACCEPTED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED (or CANCELLED)
 */
public enum OrderStatus {
    PENDING("Pending"),
    ACCEPTED("Accepted"),
    PREPARING("Preparing"),
    READY("Ready"),
    OUT_FOR_DELIVERY("Out for Delivery"),
    DELIVERED("Delivered"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static OrderStatus fromString(String text) {
        if (text == null) return PENDING;
        for (OrderStatus status : OrderStatus.values()) {
            if (status.displayName.equalsIgnoreCase(text.trim()) || status.name().equalsIgnoreCase(text.trim())) {
                return status;
            }
        }
        // Graceful normalizations
        if ("Cooking".equalsIgnoreCase(text.trim())) {
            return PREPARING;
        }
        if ("Out for Delivery".equalsIgnoreCase(text.trim()) || "OUT_FOR_DELIVERY".equalsIgnoreCase(text.trim()) || "OutForDelivery".equalsIgnoreCase(text.trim())) {
            return OUT_FOR_DELIVERY;
        }
        if ("Delivered".equalsIgnoreCase(text.trim())) {
            return DELIVERED;
        }
        throw new IllegalArgumentException("Unknown order status: " + text);
    }
}
