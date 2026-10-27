package com.smartmess.model;

import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents an immutable audit entry in the student mess credits wallet ledger.
 */
public class TransactionRecord {
    private int transactionId;
    private int studentId;
    private int amount;
    private String type; // MONTHLY_ALLOWANCE, DEBIT_ORDER, CREDIT_REFUND, TOPUP, ADMIN_ADJUSTMENT
    private int balanceAfter;
    private String notes;
    private LocalDateTime timestamp;

    public TransactionRecord() {
        this.timestamp = LocalDateTime.now();
    }

    public TransactionRecord(int transactionId, int studentId, int amount, String type,
                             int balanceAfter, String notes) {
        this.transactionId = transactionId;
        this.studentId = studentId;
        this.amount = amount;
        this.type = type;
        this.balanceAfter = balanceAfter;
        this.notes = notes;
        this.timestamp = LocalDateTime.now();
    }

    public int getTransactionId() { return transactionId; }
    public void setTransactionId(int transactionId) { this.transactionId = transactionId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
