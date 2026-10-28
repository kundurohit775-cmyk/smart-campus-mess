package com.smartmess.exception;

import com.smartmess.model.OrderStatus;

/**
 * Demonstrates Exception Handling: Custom Checked Exception.
 * Thrown when an illegal lifecycle transition is requested (e.g. canceling an order already Cooking or Ready).
 */
public class InvalidOrderStateException extends MessException {
    private final int orderId;
    private final OrderStatus currentStatus;
    private final String attemptedAction;

    public InvalidOrderStateException(String message) {
        super(message);
        this.orderId = 0;
        this.currentStatus = OrderStatus.PENDING;
        this.attemptedAction = "Modify";
    }

    public InvalidOrderStateException(int orderId, OrderStatus currentStatus, String attemptedAction) {
        super(String.format("Cannot %s for Order #%d because current status is '%s'. Only 'Pending' orders can be modified or cancelled.",
                attemptedAction, orderId, currentStatus.getDisplayName()));
        this.orderId = orderId;
        this.currentStatus = currentStatus;
        this.attemptedAction = attemptedAction;
    }

    public int getOrderId() {
        return orderId;
    }

    public OrderStatus getCurrentStatus() {
        return currentStatus;
    }

    public String getAttemptedAction() {
        return attemptedAction;
    }
}
