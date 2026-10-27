package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends AbstractUser for hostel wardens managing sick-leave room delivery approvals.
 */
public class Warden extends AbstractUser {
    private String assignedHostelBlock;

    public Warden(int id, String name, String email, String phone, String assignedHostelBlock) {
        super(id, name, email, phone);
        this.assignedHostelBlock = assignedHostelBlock;
    }

    public String getAssignedHostelBlock() {
        return assignedHostelBlock;
    }

    public void setAssignedHostelBlock(String assignedHostelBlock) {
        this.assignedHostelBlock = assignedHostelBlock;
    }

    @Override
    public String getRoleDescription() {
        return "Hostel Warden (" + assignedHostelBlock + ")";
    }
}
