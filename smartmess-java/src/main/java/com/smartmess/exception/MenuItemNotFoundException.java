package com.smartmess.exception;

/**
 * Demonstrates Exception Handling: Custom Checked Exception.
 * Thrown when an order or search queries an item ID not present in the menu catalog.
 */
public class MenuItemNotFoundException extends MessException {
    private final int itemId;

    public MenuItemNotFoundException(String message) {
        super(message);
        this.itemId = 0;
    }

    public MenuItemNotFoundException(int itemId) {
        super(String.format("Menu item with ID #%d was not found in the cafeteria catalog.", itemId));
        this.itemId = itemId;
    }

    public int getItemId() {
        return itemId;
    }
}
