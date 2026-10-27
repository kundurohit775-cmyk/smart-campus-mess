package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends AbstractUser for cafeteria chef staff.
 */
public class Chef extends AbstractUser {
    private String kitchenSection;
    private int ordersPreparedToday;

    public Chef(int id, String name, String email, String phone, String kitchenSection) {
        super(id, name, email, phone);
        this.kitchenSection = kitchenSection;
        this.ordersPreparedToday = 0;
    }

    public String getKitchenSection() {
        return kitchenSection;
    }

    public void setKitchenSection(String kitchenSection) {
        this.kitchenSection = kitchenSection;
    }

    public int getOrdersPreparedToday() {
        return ordersPreparedToday;
    }

    public void incrementOrdersPrepared() {
        this.ordersPreparedToday++;
    }

    @Override
    public String getRoleDescription() {
        return "Chef (Mess Kitchen Staff - " + kitchenSection + ")";
    }
}
