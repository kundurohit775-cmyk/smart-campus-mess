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
    private String registrationNumber;
    private String studentEmail;
    private String studentPhone;
    private String hostelName;
    private String roomNumber;
    private String reason;
    private String attachedNote;
    private String mealsNeeded; // e.g. "Breakfast, Lunch, Dinner" or "All Meals"
    private LocalDate requestDate;
    private String leaveDates; // e.g. "Oct 28, 2026 (Full Day)"
    private LocalDateTime submissionTime;
    private String status; // PENDING, APPROVED, REJECTED
    private String rejectionReason;
    private String wardenName;
    private LocalDateTime reviewedAt;

    public HealthRequest() {
        this.status = "PENDING";
        this.requestDate = LocalDate.now();
        this.leaveDates = "Today (" + LocalDate.now() + ")";
        this.submissionTime = LocalDateTime.now();
        this.mealsNeeded = "All Meals (Breakfast, Lunch, Dinner)";
        this.registrationNumber = "22BCE1022";
        this.attachedNote = "";
    }

    public HealthRequest(int requestId, int studentId, String studentName, String hostelName,
                         String roomNumber, String reason, LocalDate requestDate) {
        this(requestId, studentId, studentName, hostelName, roomNumber, reason, requestDate, "All Meals (Breakfast, Lunch, Dinner)");
    }

    public HealthRequest(int requestId, int studentId, String studentName, String hostelName,
                         String roomNumber, String reason, LocalDate requestDate, String mealsNeeded) {
        this(requestId, studentId, studentName, "22BCE10" + String.format("%02d", studentId),
                hostelName, roomNumber, reason, "", requestDate, mealsNeeded);
    }

    public HealthRequest(int requestId, int studentId, String studentName, String registrationNumber,
                         String hostelName, String roomNumber, String reason, String attachedNote,
                         LocalDate requestDate, String mealsNeeded) {
        this.requestId = requestId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.registrationNumber = (registrationNumber != null && !registrationNumber.trim().isEmpty())
                ? registrationNumber.trim().toUpperCase() : "22BCE10" + String.format("%02d", studentId);
        this.hostelName = hostelName;
        this.roomNumber = roomNumber;
        this.reason = reason;
        this.attachedNote = attachedNote != null ? attachedNote.trim() : "";
        this.requestDate = requestDate != null ? requestDate : LocalDate.now();
        this.leaveDates = this.requestDate.toString();
        this.mealsNeeded = (mealsNeeded != null && !mealsNeeded.trim().isEmpty()) ? mealsNeeded : "All Meals (Breakfast, Lunch, Dinner)";
        this.submissionTime = LocalDateTime.now();
        this.status = "PENDING";
        this.rejectionReason = "";
    }

    public int getRequestId() { return requestId; }
    public void setRequestId(int requestId) { this.requestId = requestId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getRegistrationNumber() {
        return registrationNumber != null ? registrationNumber : "22BCE10" + String.format("%02d", studentId);
    }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getStudentPhone() { return studentPhone != null ? studentPhone : "+91 9876543210"; }
    public void setStudentPhone(String studentPhone) { this.studentPhone = studentPhone; }

    public String getHostelName() { return hostelName; }
    public void setHostelName(String hostelName) { this.hostelName = hostelName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getAttachedNote() { return attachedNote != null ? attachedNote : ""; }
    public void setAttachedNote(String attachedNote) { this.attachedNote = attachedNote; }

    public String getMealsNeeded() { return mealsNeeded != null ? mealsNeeded : "All Meals"; }
    public void setMealsNeeded(String mealsNeeded) { this.mealsNeeded = mealsNeeded; }

    public LocalDate getRequestDate() { return requestDate; }
    public LocalDate getDate() { return requestDate; }
    public void setRequestDate(LocalDate requestDate) {
        this.requestDate = requestDate;
        if (this.leaveDates == null || this.leaveDates.isEmpty()) {
            this.leaveDates = requestDate.toString();
        }
    }

    public String getLeaveDates() {
        return leaveDates != null && !leaveDates.isEmpty() ? leaveDates : (requestDate != null ? requestDate.toString() : "Today");
    }
    public void setLeaveDates(String leaveDates) { this.leaveDates = leaveDates; }

    public LocalDateTime getSubmissionTime() {
        return submissionTime != null ? submissionTime : LocalDateTime.now();
    }
    public void setSubmissionTime(LocalDateTime submissionTime) { this.submissionTime = submissionTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason != null ? rejectionReason : ""; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getWardenName() { return wardenName; }
    public void setWardenName(String wardenName) { this.wardenName = wardenName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public boolean isApproved() {
        return "APPROVED".equalsIgnoreCase(this.status);
    }
}
