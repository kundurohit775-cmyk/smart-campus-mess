package com.smartmess.db;

import com.smartmess.model.*;
import com.smartmess.exception.InsufficientCreditsException;
import com.smartmess.exception.OutOfStockException;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates JDBC:
 * 1. Transactions with setAutoCommit(false), commit(), and rollback().
 * 2. Multi-table ACID order creation with atomic credit and stock mutation.
 * 3. Parameterized queries for security and performance.
 */
public class OrderDAO {

    private final StudentDAO studentDAO = new StudentDAO();
    private final MenuItemDAO menuItemDAO = new MenuItemDAO();

    /**
     * Executes an ACID-compliant atomic order checkout in PostgreSQL.
     * Demonstrates transactions and rollback on failure.
     */
    public BaseOrder placeOrderTransaction(Connection conn, BaseOrder order) 
            throws SQLException, InsufficientCreditsException, OutOfStockException {

        boolean originalAutoCommit = conn.getAutoCommit();
        try {
            // STEP 1: Begin Transaction
            conn.setAutoCommit(false);

            // STEP 2: Verify and Lock Student Credits
            Student student = studentDAO.findById(conn, order.getStudentId());
            if (student == null) {
                throw new SQLException("Student ID #" + order.getStudentId() + " not found.");
            }

            if (!student.hasSufficientCredits(order.getTotalAmount())) {
                throw new InsufficientCreditsException(
                    student.getId(), order.getTotalAmount(), student.getRemainingCredits()
                );
            }

            // STEP 3: Verify and Deduct Inventory for Each Ordered Item
            for (OrderItem oi : order.getItems()) {
                String checkStockSql = "SELECT item_name, available_quantity FROM menu_items WHERE item_id = ? FOR UPDATE";
                try (PreparedStatement checkStmt = conn.prepareStatement(checkStockSql)) {
                    checkStmt.setInt(1, oi.getItemId());
                    try (ResultSet rs = checkStmt.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Menu item ID #" + oi.getItemId() + " not found.");
                        }
                        int stock = rs.getInt("available_quantity");
                        if (stock < oi.getQuantity()) {
                            throw new OutOfStockException(oi.getItemId(), rs.getString("item_name"), oi.getQuantity(), stock);
                        }
                    }
                }
                menuItemDAO.deductStock(conn, oi.getItemId(), oi.getQuantity());
            }

            // STEP 4: Deduct Credits
            int newRemaining = student.getRemainingCredits() - order.getTotalAmount();
            int newUsed = student.getUsedCredits() + order.getTotalAmount();
            studentDAO.updateCredits(conn, student.getId(), newRemaining, newUsed);

            // STEP 5: Insert Order Record into orders table
            String insertOrderSql = "INSERT INTO orders (student_id, total_amount, total_calories, order_status, pickup_token, " +
                                   "                    delivery_type, health_request_id, delivery_address, order_time) " +
                                   "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) RETURNING order_id";

            int generatedOrderId;
            try (PreparedStatement orderStmt = conn.prepareStatement(insertOrderSql)) {
                orderStmt.setInt(1, order.getStudentId());
                orderStmt.setInt(2, order.getTotalAmount());
                orderStmt.setInt(3, order.getTotalCalories());
                orderStmt.setString(4, order.getStatus().getDisplayName());
                orderStmt.setString(5, order.getPickupToken());
                orderStmt.setString(6, order.getDeliveryType());

                if (order instanceof RoomDeliveryOrder) {
                    RoomDeliveryOrder rdo = (RoomDeliveryOrder) order;
                    if (rdo.getHealthRequestId() > 0) {
                        orderStmt.setInt(7, rdo.getHealthRequestId());
                    } else {
                        orderStmt.setNull(7, Types.INTEGER);
                    }
                    orderStmt.setString(8, rdo.getDeliveryAddress());
                } else {
                    orderStmt.setNull(7, Types.INTEGER);
                    orderStmt.setNull(8, Types.VARCHAR);
                }

                try (ResultSet rs = orderStmt.executeQuery()) {
                    if (rs.next()) {
                        generatedOrderId = rs.getInt("order_id");
                        order.setOrderId(generatedOrderId);
                    } else {
                        throw new SQLException("Failed to obtain generated order_id.");
                    }
                }
            }

            // STEP 6: Insert Order Items into order_items table
            String insertItemSql = "INSERT INTO order_items (order_id, item_id, quantity, price, calories, subtotal) " +
                                   "VALUES (?, ?, ?, ?, ?, ?)";
            try (PreparedStatement itemStmt = conn.prepareStatement(insertItemSql)) {
                for (OrderItem oi : order.getItems()) {
                    itemStmt.setInt(1, generatedOrderId);
                    itemStmt.setInt(2, oi.getItemId());
                    itemStmt.setInt(3, oi.getQuantity());
                    itemStmt.setInt(4, oi.getPrice());
                    itemStmt.setInt(5, oi.getCalories() != null ? oi.getCalories() : 0);
                    itemStmt.setInt(6, oi.getSubtotal());
                    itemStmt.addBatch();
                }
                itemStmt.executeBatch();
            }

            // STEP 7: Transaction Commit
            conn.commit();
            System.out.printf("✅ [JDBC Transaction] Order #%d committed successfully. %d Credits debited.%n",
                    order.getOrderId(), order.getTotalAmount());

            return order;

        } catch (Exception e) {
            // STEP 8: Transaction Rollback on Failure
            System.err.printf("⚠️ [JDBC Rollback] Order transaction failed: %s. Rolling back changes...%n", e.getMessage());
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(originalAutoCommit);
        }
    }

    /**
     * Reads all orders for a given student ID from PostgreSQL.
     */
    public List<BaseOrder> findOrdersByStudentId(Connection conn, int studentId) throws SQLException {
        List<BaseOrder> list = new ArrayList<>();
        String sql = "SELECT o.order_id, o.student_id, s.name as student_name, o.total_amount, o.total_calories, " +
                     "       o.order_status, o.pickup_token, o.delivery_type, o.delivery_address, o.order_time " +
                     "FROM orders o " +
                     "JOIN students s ON o.student_id = s.student_id " +
                     "WHERE o.student_id = ? " +
                     "ORDER BY o.order_id DESC";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int orderId = rs.getInt("order_id");
                    String studentName = rs.getString("student_name");
                    String delType = rs.getString("delivery_type");
                    String address = rs.getString("delivery_address");
                    String token = rs.getString("pickup_token");
                    OrderStatus status = OrderStatus.fromString(rs.getString("order_status"));

                    BaseOrder order;
                    if ("hostel-delivery".equalsIgnoreCase(delType)) {
                        order = new RoomDeliveryOrder(orderId, studentId, studentName, address != null ? address : "Hostel Room", 0);
                    } else {
                        order = new DineInOrder(orderId, studentId, studentName);
                    }
                    order.setPickupToken(token);
                    order.setStatus(status);
                    order.setTotalAmount(rs.getInt("total_amount"));
                    order.setTotalCalories(rs.getInt("total_calories"));
                    if (rs.getTimestamp("order_time") != null) {
                        order.setOrderTime(rs.getTimestamp("order_time").toLocalDateTime());
                    }
                    list.add(order);
                }
            }
        }
        return list;
    }
}
