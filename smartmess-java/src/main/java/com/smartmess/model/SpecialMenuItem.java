package com.smartmess.model;

import java.time.LocalDate;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends MenuItem to represent Chef Specials available exclusively for Next-Day Pre-Order.
 */
public class SpecialMenuItem extends MenuItem {
    private int specialStockLimit;
    private LocalDate specialAvailableDate;
    private int preOrderCount;

    public SpecialMenuItem(int itemId, String itemName, String category, int price, Integer calories,
                           int specialStockLimit, LocalDate specialAvailableDate) {
        super(itemId, itemName, category, price, calories, specialStockLimit);
        this.specialStockLimit = specialStockLimit;
        this.specialAvailableDate = specialAvailableDate;
        this.preOrderCount = 0;
    }

    public int getSpecialStockLimit() {
        return specialStockLimit;
    }

    public void setSpecialStockLimit(int specialStockLimit) {
        this.specialStockLimit = specialStockLimit;
    }

    public LocalDate getSpecialAvailableDate() {
        return specialAvailableDate;
    }

    public void setSpecialAvailableDate(LocalDate specialAvailableDate) {
        this.specialAvailableDate = specialAvailableDate;
    }

    public int getPreOrderCount() {
        return preOrderCount;
    }

    public void setPreOrderCount(int preOrderCount) {
        this.preOrderCount = preOrderCount;
    }

    public int getRemainingSpecialStock() {
        return Math.max(0, specialStockLimit - preOrderCount);
    }

    /**
     * Polymorphic override of getItemType.
     */
    @Override
    public String getItemType() {
        return "Chef Special (Pre-Order Only for " + specialAvailableDate + ")";
    }

    @Override
    public String toString() {
        return super.toString() + String.format(" [Special Limit: %d, Date: %s]", specialStockLimit, specialAvailableDate);
    }
}
