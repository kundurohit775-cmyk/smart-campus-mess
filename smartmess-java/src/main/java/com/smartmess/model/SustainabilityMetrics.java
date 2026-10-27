package com.smartmess.model;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents aggregated food waste avoidance and environmental sustainability metrics.
 */
public class SustainabilityMetrics {
    private double foodSavedKg;
    private double co2AvoidedKg;
    private double waterSavedLiters;
    private int mealsEquivalent;
    private int totalPreOrders;

    public SustainabilityMetrics() {
        this(142.5, 356.25, 25650.0, 356, 78);
    }

    public SustainabilityMetrics(double foodSavedKg, double co2AvoidedKg, double waterSavedLiters,
                                 int mealsEquivalent, int totalPreOrders) {
        this.foodSavedKg = foodSavedKg;
        this.co2AvoidedKg = co2AvoidedKg;
        this.waterSavedLiters = waterSavedLiters;
        this.mealsEquivalent = mealsEquivalent;
        this.totalPreOrders = totalPreOrders;
    }

    public double getFoodSavedKg() { return foodSavedKg; }
    public void setFoodSavedKg(double foodSavedKg) { this.foodSavedKg = foodSavedKg; }

    public double getCo2AvoidedKg() { return co2AvoidedKg; }
    public void setCo2AvoidedKg(double co2AvoidedKg) { this.co2AvoidedKg = co2AvoidedKg; }

    public double getWaterSavedLiters() { return waterSavedLiters; }
    public void setWaterSavedLiters(double waterSavedLiters) { this.waterSavedLiters = waterSavedLiters; }

    public int getMealsEquivalent() { return mealsEquivalent; }
    public void setMealsEquivalent(int mealsEquivalent) { this.mealsEquivalent = mealsEquivalent; }

    public int getTotalPreOrders() { return totalPreOrders; }
    public void setTotalPreOrders(int totalPreOrders) { this.totalPreOrders = totalPreOrders; }
}
