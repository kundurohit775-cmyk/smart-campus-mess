package com.smartmess.model;

import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation and Base Model for SmartMess catalog.
 * Represents a standard cafeteria dish with pricing, nutrition, description,
 * imagery, low-stock threshold monitoring, and archival state preservation.
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
    private String description;
    private String imageUrl;
    private int lowStockThreshold;
    private boolean archived;
    private LocalDateTime lastStockUpdated;

    public MenuItem() {
        this.portionWeightKg = 0.450;
        this.active = true;
        this.lowStockThreshold = 15;
        this.archived = false;
        this.lastStockUpdated = LocalDateTime.now();
        this.description = "Freshly prepared campus delicacy.";
        this.imageUrl = "";
    }

    public MenuItem(int itemId, String itemName, String category, int price, Integer calories, int availableQuantity) {
        this(itemId, itemName, category, price, calories, availableQuantity, "Freshly prepared campus delicacy.", "", 15);
    }

    public MenuItem(int itemId, String itemName, String category, int price, Integer calories,
                    int availableQuantity, String description, String imageUrl, int lowStockThreshold) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.category = category;
        this.price = price;
        this.calories = calories;
        this.availableQuantity = availableQuantity;
        this.portionWeightKg = 0.450;
        this.active = true;
        this.description = description != null ? description : "Freshly prepared campus delicacy.";
        this.imageUrl = imageUrl != null ? imageUrl : "";
        this.lowStockThreshold = lowStockThreshold > 0 ? lowStockThreshold : 15;
        this.archived = false;
        this.lastStockUpdated = LocalDateTime.now();
    }

    public int getItemId() {
        return itemId;
    }

    public void setItemId(int itemId) {
        this.itemId = itemId;
    }

    public int getId() {
        return itemId;
    }

    public void setId(int id) {
        this.itemId = id;
    }

    public String getName() {
        return itemName;
    }

    public void setName(String name) {
        this.itemName = name;
    }

    public int getStock() {
        return availableQuantity;
    }

    public void setStock(int stock) {
        this.availableQuantity = stock;
        this.lastStockUpdated = LocalDateTime.now();
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
        this.lastStockUpdated = LocalDateTime.now();
    }

    public double getPortionWeightKg() {
        return portionWeightKg;
    }

    public void setPortionWeightKg(double portionWeightKg) {
        this.portionWeightKg = portionWeightKg;
    }

    public boolean isActive() {
        return active && !archived;
    }

    public void setActive(boolean active) {
        this.active = active;
        this.lastStockUpdated = LocalDateTime.now();
    }

    public String getDescription() {
        return description != null && !description.isEmpty() ? description : "Freshly prepared campus delicacy.";
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl != null ? imageUrl : "";
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getLowStockThreshold() {
        return lowStockThreshold > 0 ? lowStockThreshold : 15;
    }

    public void setLowStockThreshold(int lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public boolean isLowStock() {
        return this.availableQuantity <= this.lowStockThreshold && this.availableQuantity > 0;
    }

    public boolean isSoldOut() {
        return !active || this.availableQuantity <= 0;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
        if (archived) this.active = false;
        this.lastStockUpdated = LocalDateTime.now();
    }

    public LocalDateTime getLastStockUpdated() {
        return lastStockUpdated != null ? lastStockUpdated : LocalDateTime.now();
    }

    public void setLastStockUpdated(LocalDateTime lastStockUpdated) {
        this.lastStockUpdated = lastStockUpdated;
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
