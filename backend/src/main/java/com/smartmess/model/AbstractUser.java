package com.smartmess.model;

/**
 * Demonstrates OOP: Abstraction and Encapsulation.
 * Base class for all users in the SmartMess system.
 */
public abstract class AbstractUser {
    private int id;
    private String name;
    private String email;
    private String phone;

    public AbstractUser(int id, String name, String email, String phone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    // Encapsulation: Getter and Setter methods
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    /**
     * Demonstrates OOP: Abstraction.
     * Concrete subclasses must implement role-specific identity behavior.
     */
    public abstract String getRoleDescription();

    @Override
    public String toString() {
        return String.format("[%s] ID: %d | Name: %s | Email: %s", getRoleDescription(), id, name, email);
    }
}
