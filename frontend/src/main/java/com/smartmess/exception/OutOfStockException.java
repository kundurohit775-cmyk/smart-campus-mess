package com.smartmess.exception;

/**
 * Demonstrates Exception Handling: Custom Checked Exception.
 * Thrown when an order requests more portions than available in kitchen inventory.
 */
public class OutOfStockException extends MessException {
    private final int itemId;
    private final String itemName;
    private final int requestedQuantity;
    private final int availableQuantity;

    public OutOfStockException(int itemId, String itemName, int requestedQuantity, int availableQuantity) {
        super(String.format("Item '%s' (ID #%d) is out of stock! Requested: %d, Available: %d",
                itemName, itemId, requestedQuantity, availableQuantity));
        this.itemId = itemId;
        this.itemName = itemName;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }

    public int getItemId() {
        return itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public int getRequestedQuantity() {
        return requestedQuantity;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }
}
