package com.smartmess.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Demonstrates OOP: Encapsulation.
 * Represents a student sick-leave request for hostel room delivery requiring warden approval.
 */
public class HealthRequest {
    private int requestId;
    private int studentId;
    private String studentName;
    private String hostelName;
    private String roomNumber;
    private String reason;
    private LocalDate requestDate;
    private String status; // PENDING, APPROVED, REJECTED
    private String rejectionReason;
    private String wardenName;
    private LocalDateTime reviewedAt;

    public HealthRequest() {
        this.status = "PENDING";
        this.requestDate = LocalDate.now();
    }

    public HealthRequest(int requestId, int studentId, String studentName, String hostelName,
                         String roomNumber, String reason, LocalDate requestDate) {
        this.requestId = requestId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.hostelName = hostelName;
        this.roomNumber = roomNumber;
        this.reason = reason;
        this.requestDate = requestDate;
        this.status = "PENDING";
    }

    public int getRequestId() { return requestId; }
    public void setRequestId(int requestId) { this.requestId = requestId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getHostelName() { return hostelName; }
    public void setHostelName(String hostelName) { this.hostelName = hostelName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDate getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDate requestDate) { this.requestDate = requestDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getWardenName() { return wardenName; }
    public void setWardenName(String wardenName) { this.wardenName = wardenName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public boolean isApproved() {
        return "APPROVED".equalsIgnoreCase(this.status);
    }
}
