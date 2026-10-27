package com.smartmess.model;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents a single line item within an order ticket.
 */
public class OrderItem {
    private int orderItemId;
    private int itemId;
    private String itemName;
    private int quantity;
    private int price;
    private Integer calories;
    private int subtotal;

    public OrderItem() {}

    public OrderItem(int itemId, String itemName, int quantity, int price, Integer calories) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.price = price;
        this.calories = calories;
        this.subtotal = price * quantity;
    }

    public int getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(int orderItemId) {
        this.orderItemId = orderItemId;
    }

    public int getItemId() {
        return itemId;
    }

    public void setItemId(int itemId) {
        this.itemId = itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        this.subtotal = this.price * quantity;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
        this.subtotal = price * this.quantity;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }

    public int getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(int subtotal) {
        this.subtotal = subtotal;
    }

    @Override
    public String toString() {
        return String.format("%dx %s @ %d Cr = %d Cr (%d kcal)",
                quantity, itemName, price, subtotal, (calories != null ? calories * quantity : 0));
    }
}
