package com.smartmess.model;

/**
 * Demonstrates OOP: Inheritance and Polymorphism.
 * Extends AbstractUser for campus mess administration.
 */
public class Admin extends AbstractUser {
    private String department;
    private boolean superAdmin;

    public Admin(int id, String name, String email, String phone, String department) {
        super(id, name, email, phone);
        this.department = department;
        this.superAdmin = true;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public boolean isSuperAdmin() {
        return superAdmin;
    }

    public void setSuperAdmin(boolean superAdmin) {
        this.superAdmin = superAdmin;
    }

    @Override
    public String getRoleDescription() {
        return "Admin (Campus Mess Authority - " + department + ")";
    }
}
