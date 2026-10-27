package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends AbstractUser and encapsulates student mess credits, room number,
 * and daily nutritional calorie tracking.
 */
public class Student extends AbstractUser {
    private String roomNumber;
    private int remainingCredits;
    private int monthlyLimit;
    private int usedCredits;
    private Integer dailyCalorieGoal;
    private boolean healthModeEnabled;

    public Student(int id, String name, String email, String phone, String roomNumber, int remainingCredits) {
        super(id, name, email, phone);
        this.roomNumber = roomNumber;
        this.remainingCredits = remainingCredits;
        this.monthlyLimit = 9000;
        this.usedCredits = 0;
        this.dailyCalorieGoal = 2000;
        this.healthModeEnabled = false;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getHostelRoom() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public void setHostelRoom(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public int getRemainingCredits() {
        return remainingCredits;
    }

    public void setRemainingCredits(int remainingCredits) {
        this.remainingCredits = remainingCredits;
    }

    public int getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(int monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public int getUsedCredits() {
        return usedCredits;
    }

    public void setUsedCredits(int usedCredits) {
        this.usedCredits = usedCredits;
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
    }

    public void refundCredits(int amount) {
        this.remainingCredits += amount;
        this.usedCredits = Math.max(0, this.usedCredits - amount);
    }

    /**
     * Polymorphic implementation of getRoleDescription.
     */
    @Override
    public String getRoleDescription() {
        return "Student (Hostel Mess Resident)";
    }
}
