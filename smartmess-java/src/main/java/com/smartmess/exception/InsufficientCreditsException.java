package com.smartmess.exception;

/**
 * Demonstrates Exception Handling: Custom Checked Exception.
 * Thrown when a student's mess credit balance is insufficient to cover the order total.
 */
public class InsufficientCreditsException extends MessException {
    private final int studentId;
    private final int requiredCredits;
    private final int availableCredits;

    public InsufficientCreditsException(int studentId, int requiredCredits, int availableCredits) {
        super(String.format("Insufficient mess credits for student ID #%d. Required: %d Cr, Available: %d Cr (Shortfall: %d Cr)",
                studentId, requiredCredits, availableCredits, (requiredCredits - availableCredits)));
        this.studentId = studentId;
        this.requiredCredits = requiredCredits;
        this.availableCredits = availableCredits;
    }

    public int getStudentId() {
        return studentId;
    }

    public int getRequiredCredits() {
        return requiredCredits;
    }

    public int getAvailableCredits() {
        return availableCredits;
    }
}
