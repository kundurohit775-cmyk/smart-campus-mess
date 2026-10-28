package com.smartmess.model;

import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends AbstractUser and encapsulates student mess credits, room number,
 * registration number, monthly allowances, and nutritional calorie tracking.
 */
public class Student extends AbstractUser {
    private String registrationNumber;
    private String hostelBlock;
    private String roomNumber;
    private int remainingCredits;
    private int monthlyLimit;
    private int usedCredits;
    private Integer dailyCalorieGoal;
    private boolean healthModeEnabled;
    private LocalDateTime lastUpdated;

    public Student(int id, String name, String email, String phone, String roomNumber, int remainingCredits) {
        this(id, name, email, phone, "22BCE10" + String.format("%02d", id), extractHostelBlock(roomNumber), roomNumber, remainingCredits, 9000);
    }

    public Student(int id, String name, String email, String phone, String registrationNumber,
                   String hostelBlock, String roomNumber, int remainingCredits, int monthlyLimit) {
        super(id, name, email, phone);
        this.registrationNumber = (registrationNumber != null && !registrationNumber.trim().isEmpty())
                ? registrationNumber.trim().toUpperCase() : "22BCE10" + String.format("%02d", id);
        this.hostelBlock = (hostelBlock != null && !hostelBlock.trim().isEmpty())
                ? hostelBlock.trim() : extractHostelBlock(roomNumber);
        this.roomNumber = roomNumber;
        this.remainingCredits = remainingCredits;
        this.monthlyLimit = monthlyLimit > 0 ? monthlyLimit : 9000;
        this.usedCredits = Math.max(0, this.monthlyLimit - remainingCredits);
        this.dailyCalorieGoal = 2000;
        this.healthModeEnabled = false;
        this.lastUpdated = LocalDateTime.now();
    }

    private static String extractHostelBlock(String room) {
        if (room == null) return "Block B";
        String lower = room.toLowerCase();
        if (lower.contains("block a")) return "Block A";
        if (lower.contains("block b")) return "Block B";
        if (lower.contains("block c")) return "Block C";
        if (lower.contains("block d")) return "Block D";
        return "Block B";
    }

    public String getRegistrationNumber() {
        return registrationNumber != null ? registrationNumber : "22BCE10" + String.format("%02d", getId());
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
        this.lastUpdated = LocalDateTime.now();
    }

    public String getHostelBlock() {
        return hostelBlock != null ? hostelBlock : extractHostelBlock(roomNumber);
    }

    public void setHostelBlock(String hostelBlock) {
        this.hostelBlock = hostelBlock;
        this.lastUpdated = LocalDateTime.now();
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getHostelRoom() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
        this.lastUpdated = LocalDateTime.now();
    }

    public void setHostelRoom(String roomNumber) {
        this.roomNumber = roomNumber;
        this.lastUpdated = LocalDateTime.now();
    }

    public int getRemainingCredits() {
        return remainingCredits;
    }

    public void setRemainingCredits(int remainingCredits) {
        this.remainingCredits = remainingCredits;
        this.lastUpdated = LocalDateTime.now();
    }

    public int getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(int monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
        this.lastUpdated = LocalDateTime.now();
    }

    public int getUsedCredits() {
        return usedCredits;
    }

    public void setUsedCredits(int usedCredits) {
        this.usedCredits = usedCredits;
        this.lastUpdated = LocalDateTime.now();
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated != null ? lastUpdated : LocalDateTime.now();
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Integer getDailyCalorieGoal() {
        return dailyCalorieGoal;
    }

    public void setDailyCalorieGoal(Integer dailyCalorieGoal) {
        this.dailyCalorieGoal = dailyCalorieGoal;
    }

    public boolean isHealthModeEnabled() {
        return healthModeEnabled;
    }

    public void setHealthModeEnabled(boolean healthModeEnabled) {
        this.healthModeEnabled = healthModeEnabled;
    }

    public boolean hasSufficientCredits(int amount) {
        return this.remainingCredits >= amount;
    }

    public void deductCredits(int amount) {
        this.remainingCredits -= amount;
        this.usedCredits += amount;
        this.lastUpdated = LocalDateTime.now();
    }

    public void refundCredits(int amount) {
        this.remainingCredits += amount;
        this.usedCredits = Math.max(0, this.usedCredits - amount);
        this.lastUpdated = LocalDateTime.now();
    }

    public void addCredits(int amount) {
        this.remainingCredits += amount;
        this.lastUpdated = LocalDateTime.now();
    }

    public void resetToMonthlyLimit() {
        this.remainingCredits = this.monthlyLimit;
        this.usedCredits = 0;
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Polymorphic implementation of getRoleDescription.
     */
    @Override
    public String getRoleDescription() {
        return "Student (" + getRegistrationNumber() + " - " + getHostelBlock() + ")";
    }
}
