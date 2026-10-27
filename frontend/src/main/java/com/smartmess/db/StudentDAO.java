package com.smartmess.db;

import com.smartmess.model.Student;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

/**
 * Demonstrates JDBC:
 * 1. PreparedStatement for parameterized queries (preventing SQL injection).
 * 2. ResultSet processing for mapping database rows to Student domain model.
 */
public class StudentDAO {

    /**
     * Retrieves a student by studentId along with current monthly credits.
     */
    public Student findById(Connection conn, int studentId) throws SQLException {
        String sql = "SELECT s.student_id, s.name, s.email, s.phone, s.room_number, s.daily_calorie_goal, " +
                     "       s.health_mode_enabled, COALESCE(c.remaining_credits, 9000) AS remaining_credits, " +
                     "       COALESCE(c.used_credits, 0) AS used_credits, COALESCE(c.monthly_limit, 9000) AS monthly_limit " +
                     "FROM students s " +
                     "LEFT JOIN credits c ON s.student_id = c.student_id " +
                     "  AND c.month = ? AND c.year = ? " +
                     "WHERE s.student_id = ?";

        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, month);
            stmt.setInt(2, year);
            stmt.setInt(3, studentId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Student student = new Student(
                        rs.getInt("student_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("room_number"),
                        rs.getInt("remaining_credits")
                    );
                    student.setMonthlyLimit(rs.getInt("monthly_limit"));
                    student.setUsedCredits(rs.getInt("used_credits"));
                    student.setDailyCalorieGoal(rs.getObject("daily_calorie_goal") != null ? rs.getInt("daily_calorie_goal") : 2000);
                    student.setHealthModeEnabled(rs.getBoolean("health_mode_enabled"));
                    return student;
                }
            }
        }
        return null;
    }

    /**
     * Updates student mess credits within an active transaction.
     */
    public void updateCredits(Connection conn, int studentId, int newRemaining, int newUsed) throws SQLException {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        String sql = "INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year, updated_at) " +
                     "VALUES (?, 9000, ?, ?, ?, ?, NOW()) " +
                     "ON CONFLICT (student_id, month, year) " +
                     "DO UPDATE SET remaining_credits = ?, used_credits = ?, updated_at = NOW()";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, studentId);
            stmt.setInt(2, newUsed);
            stmt.setInt(3, newRemaining);
            stmt.setInt(4, month);
            stmt.setInt(5, year);
            stmt.setInt(6, newRemaining);
            stmt.setInt(7, newUsed);

            stmt.executeUpdate();
        }
    }
}
