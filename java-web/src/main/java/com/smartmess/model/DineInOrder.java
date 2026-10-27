package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Represents a standard counter-pickup meal tray order.
 */
public class DineInOrder extends BaseOrder {

    public DineInOrder(int orderId, int studentId, String studentName) {
        super(orderId, studentId, studentName);
        // Default standard pickup token format: TK-XXXX
        int tokenNum = 1000 + (int)(Math.random() * 9000);
        setPickupToken(getPickupTokenPrefix() + tokenNum);
    }

    @Override
    public String getPickupTokenPrefix() {
        return "TK-";
    }

    @Override
    public String getDeliveryType() {
        return "self-pickup";
    }

    @Override
    public String getFulfillmentDescription() {
        return "Mess Counter Self-Pickup";
    }
}
