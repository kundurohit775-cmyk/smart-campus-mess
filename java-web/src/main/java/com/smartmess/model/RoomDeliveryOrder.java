package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Represents an approved medical sick-leave hostel room delivery order.
 * Generates tokens prefixed with "ROOM-TK-" to notify kitchen staff explicitly.
 */
public class RoomDeliveryOrder extends BaseOrder {
    private String deliveryAddress;
    private int healthRequestId;

    public RoomDeliveryOrder(int orderId, int studentId, String studentName, String deliveryAddress, int healthRequestId) {
        super(orderId, studentId, studentName);
        this.deliveryAddress = deliveryAddress;
        this.healthRequestId = healthRequestId;
        // Token prefix mentions ROOM explicitly: ROOM-TK-XXXX
        int tokenNum = 1000 + (int)(Math.random() * 9000);
        setPickupToken(getPickupTokenPrefix() + tokenNum);
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public int getHealthRequestId() {
        return healthRequestId;
    }

    public void setHealthRequestId(int healthRequestId) {
        this.healthRequestId = healthRequestId;
    }

    @Override
    public String getPickupTokenPrefix() {
        return "ROOM-TK-";
    }

    @Override
    public String getDeliveryType() {
        return "hostel-delivery";
    }

    @Override
    public String getFulfillmentDescription() {
        return "Room Delivery to: " + deliveryAddress;
    }
}
