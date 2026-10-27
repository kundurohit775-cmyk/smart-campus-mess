package com.smartmess.model;

/**
 * Demonstrates OOP: Encapsulation and Base Model for SmartMess catalog.
 * Represents a standard cafeteria dish with pricing, nutrition, and portion weights.
 */
public class MenuItem {
    private int itemId;
    private String itemName;
    private String category;
    private int price;
    private Integer calories;
    private int availableQuantity;
    private double portionWeightKg;
    private boolean active;

    public MenuItem() {
        this.portionWeightKg = 0.450;
        this.active = true;
    }

    public MenuItem(int itemId, String itemName, String category, int price, Integer calories, int availableQuantity) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.category = category;
        this.price = price;
        this.calories = calories;
        this.availableQuantity = availableQuantity;
        this.portionWeightKg = 0.450;
        this.active = true;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public double getPortionWeightKg() {
        return portionWeightKg;
    }

    public void setPortionWeightKg(double portionWeightKg) {
        this.portionWeightKg = portionWeightKg;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isHealthy() {
        return calories != null && calories <= 400;
    }

    /**
     * Demonstrates OOP: Polymorphism (overridden in SpecialMenuItem).
     */
    public String getItemType() {
        return "Regular Menu Item";
    }

    @Override
    public String toString() {
        return String.format("#%d: %s [%s] - %d Credits (%d kcal, Stock: %d)",
                itemId, itemName, category, price, calories != null ? calories : 0, availableQuantity);
    }
}
