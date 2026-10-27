package com.smartmess.model;

/**
 * Represents the lifecycle stages of an order in the SmartMess system.
 * Follows the canonical status flow:
 * PENDING -> ACCEPTED -> PREPARING -> READY -> COMPLETED (or CANCELLED)
 */
public enum OrderStatus {
    PENDING("Pending"),
    ACCEPTED("Accepted"),
    PREPARING("Preparing"),
    READY("Ready"),
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
        // Graceful normalization: Cooking -> Preparing
        if ("Cooking".equalsIgnoreCase(text.trim())) {
            return PREPARING;
        }
        throw new IllegalArgumentException("Unknown order status: " + text);
    }
}
