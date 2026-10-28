package com.smartmess.model;

import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents an immutable audit entry in the student mess credits wallet ledger.
 */
public class TransactionRecord {
    private int transactionId;
    private int studentId;
    private String studentName;
    private String studentRegNumber;
    private int amount;
    private String type; // MONTHLY_ALLOWANCE, DEBIT_ORDER, CREDIT_REFUND, TOPUP, ADMIN_ADD, ADMIN_DEDUCT, MONTHLY_REISSUE, LIMIT_UPDATE
    private int balanceAfter;
    private String notes; // mandatory reason
    private String performedBy; // admin email or "SYSTEM" or "STUDENT"
    private LocalDateTime timestamp;

    public TransactionRecord() {
        this.timestamp = LocalDateTime.now();
        this.performedBy = "SYSTEM";
    }

    public TransactionRecord(int transactionId, int studentId, int amount, String type,
                             int balanceAfter, String notes) {
        this(transactionId, studentId, "Student #" + studentId, "22BCE10" + String.format("%02d", studentId),
                amount, type, balanceAfter, notes, "SYSTEM");
    }

    public TransactionRecord(int transactionId, int studentId, String studentName, String studentRegNumber,
                             int amount, String type, int balanceAfter, String notes, String performedBy) {
        this.transactionId = transactionId;
        this.studentId = studentId;
        this.studentName = studentName != null ? studentName : "Student #" + studentId;
        this.studentRegNumber = studentRegNumber != null ? studentRegNumber : "22BCE10" + String.format("%02d", studentId);
        this.amount = amount;
        this.type = type;
        this.balanceAfter = balanceAfter;
        this.notes = notes;
        this.performedBy = (performedBy != null && !performedBy.trim().isEmpty()) ? performedBy : "SYSTEM";
        this.timestamp = LocalDateTime.now();
    }

    public int getTransactionId() { return transactionId; }
    public void setTransactionId(int transactionId) { this.transactionId = transactionId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName != null ? studentName : "Student #" + studentId; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentRegNumber() { return studentRegNumber != null ? studentRegNumber : "22BCE10" + String.format("%02d", studentId); }
    public void setStudentRegNumber(String studentRegNumber) { this.studentRegNumber = studentRegNumber; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getNotes() { return notes != null ? notes : ""; }
    public String getReason() { return getNotes(); }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPerformedBy() { return performedBy != null ? performedBy : "SYSTEM"; }
    public String getAdminName() { return getPerformedBy(); }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
