package com.smartmess.service;

import com.smartmess.collections.KitchenOrderQueue;
import com.smartmess.collections.MenuCatalog;
import com.smartmess.concurrency.AsyncAuditLogger;
import com.smartmess.db.DatabaseConnection;
import com.smartmess.db.MenuItemDAO;
import com.smartmess.db.OrderDAO;
import com.smartmess.db.StudentDAO;
import com.smartmess.exception.*;
import com.smartmess.file.AuditLogFileManager;
import com.smartmess.file.OrderHistoryExporter;
import com.smartmess.model.*;

import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstrates OOP: Concrete implementation of IMessService.
 * Orchestrates:
 * - Collections Framework (MenuCatalog, KitchenOrderQueue)
 * - Exception Handling (custom domain exceptions)
 * - File Handling (OrderHistoryExporter, AuditLogFileManager)
 * - Multithreading (AsyncAuditLogger)
 * - JDBC Transactions (OrderDAO, StudentDAO, MenuItemDAO)
 */
public class MessServiceImpl implements IMessService {

    private final MenuCatalog catalog;
    private final KitchenOrderQueue kitchenQueue;
    private final AuditLogFileManager auditManager;
    private final AsyncAuditLogger asyncLogger;

    private final StudentDAO studentDAO;
    private final MenuItemDAO menuItemDAO;
    private final OrderDAO orderDAO;

    private final Map<Integer, Student> inMemoryStudents;
    private final Map<Integer, BaseOrder> inMemoryOrders;
    private final AtomicInteger orderIdSequence;

    public MessServiceImpl() {
        this.catalog = new MenuCatalog();
        this.kitchenQueue = new KitchenOrderQueue();
        this.auditManager = new AuditLogFileManager("smartmess_audit_log.txt");
        this.asyncLogger = new AsyncAuditLogger(auditManager);

        this.studentDAO = new StudentDAO();
        this.menuItemDAO = new MenuItemDAO();
        this.orderDAO = new OrderDAO();

        this.inMemoryStudents = new HashMap<>();
        this.inMemoryOrders = new HashMap<>();
        this.orderIdSequence = new AtomicInteger(100);

        initializeCatalog();
    }

    @Override
    public synchronized void initializeCatalog() {
        boolean loadedFromDb = false;
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                List<MenuItem> items = menuItemDAO.findAllActive(conn);
                for (MenuItem item : items) {
                    catalog.addItem(item);
                }
                if (!items.isEmpty()) {
                    System.out.printf("🐘 [JDBC] Loaded %d menu items from PostgreSQL into MenuCatalog collections.%n", items.size());
                    loadedFromDb = true;
                }
            } catch (SQLException e) {
                System.out.println("⚠️ Could not load menu from PostgreSQL (" + e.getMessage() + "). Loading standard mess catalog...");
            }
        }

        if (!loadedFromDb) {
            seedDefaultCatalog();
        }

        // Initialize test student resident
        Student testStudent = new Student(22, "Test Student", "test.student@vitstudent.ac.in", "+919876543210", "Block B - 204", 8790);
        inMemoryStudents.put(testStudent.getId(), testStudent);
    }

    private void seedDefaultCatalog() {
        catalog.addItem(new MenuItem(1, "Crispy Masala Dosa & Sambar", "Breakfast", 60, 320, 45));
        catalog.addItem(new MenuItem(2, "Classic Club Sandwich & Fries", "Breakfast", 75, 450, 30));
        catalog.addItem(new MenuItem(5, "Royal Paneer Butter Masala Thali", "Lunch", 120, 680, 60));
        catalog.addItem(new MenuItem(8, "Executive Mess Deluxe Thali", "Lunch", 140, 750, 50));
        catalog.addItem(new MenuItem(9, "Crispy Samosa Platter (2 Pcs)", "Snacks", 40, 260, 55));
        catalog.addItem(new MenuItem(17, "Iced Cold Coffee with Ice Cream", "Beverages", 50, 220, 48));
        catalog.addItem(new MenuItem(22, "Test Fresh Sprout Salad (Healthy)", "Snacks", 35, 120, 50));
        
        // Add Chef Special
        catalog.addItem(new SpecialMenuItem(27, "Hyderabadi Dum Biryani Feast", "Dinner", 160, 720, 25, LocalDate.now().plusDays(1)));
        catalog.addItem(new SpecialMenuItem(31, "Paneer Butter Masala (Eco-Special)", "Dinner", 120, 580, 20, LocalDate.now().plusDays(1)));
    }

    @Override
    public MenuCatalog getCatalog() {
        return catalog;
    }

    public void registerStudent(Student student) {
        if (student != null) {
            inMemoryStudents.put(student.getId(), student);
        }
    }

    @Override
    public Student getStudentProfile(int studentId) {
        if (inMemoryStudents.containsKey(studentId)) {
            return inMemoryStudents.get(studentId);
        }
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                Student s = studentDAO.findById(conn, studentId);
                if (s != null) return s;
            } catch (SQLException ignored) {}
        }
        return new Student(studentId, "Student #" + studentId, "student" + studentId + "@vitstudent.ac.in", "+919876543210", "Block A - 101", 9000);
    }

    @Override
    public BaseOrder placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String roomAddress)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException {

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item.");
        }

        Student student = getStudentProfile(studentId);
        int generatedId = orderIdSequence.incrementAndGet();

        BaseOrder order;
        if (isRoomDelivery) {
            String address = (roomAddress != null && !roomAddress.trim().isEmpty()) 
                    ? roomAddress.trim() 
                    : (student.getRoomNumber() != null ? student.getRoomNumber() : "Hostel Room");
            order = new RoomDeliveryOrder(generatedId, studentId, student.getName(), address, 0);
        } else {
            order = new DineInOrder(generatedId, studentId, student.getName());
        }

        // Validate items and compute totals
        for (OrderItem oi : items) {
            MenuItem catalogItem = catalog.getItemById(oi.getItemId());
            oi.setItemName(catalogItem.getItemName());
            oi.setPrice(catalogItem.getPrice());
            oi.setCalories(catalogItem.getCalories());
            oi.setQuantity(oi.getQuantity()); // recalculates subtotal

            if (catalogItem.getAvailableQuantity() < oi.getQuantity()) {
                throw new OutOfStockException(
                    catalogItem.getItemId(), catalogItem.getItemName(), oi.getQuantity(), catalogItem.getAvailableQuantity()
                );
            }
            order.addItem(oi);
        }

        // Verify credit balance
        if (!student.hasSufficientCredits(order.getTotalAmount())) {
            throw new InsufficientCreditsException(
                student.getId(), order.getTotalAmount(), student.getRemainingCredits()
            );
        }

        // Database Transaction if configured
        boolean dbCommitted = false;
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                order = orderDAO.placeOrderTransaction(conn, order);
                dbCommitted = true;
            } catch (SQLException e) {
                System.err.println("⚠️ PostgreSQL order placement error: " + e.getMessage() + ". Completing in memory.");
            }
        }

        if (!dbCommitted) {
            // Deduct local memory stock and student credits
            for (OrderItem oi : order.getItems()) {
                MenuItem ci = catalog.getItemById(oi.getItemId());
                ci.setAvailableQuantity(ci.getAvailableQuantity() - oi.getQuantity());
            }
            student.deductCredits(order.getTotalAmount());
            inMemoryStudents.put(student.getId(), student);
        }

        inMemoryOrders.put(order.getOrderId(), order);

        // Enqueue into Multithreaded Kitchen Order Queue
        kitchenQueue.enqueue(order);

        // Multithreaded Asynchronous Audit Logging
        asyncLogger.logAsync("ORDER_PLACED", studentId, order.getOrderId(), order.getTotalAmount(),
                String.format("Token: %s | %s | %d items", order.getPickupToken(), order.getFulfillmentDescription(), order.getItems().size()));

        return order;
    }

    @Override
    public void cancelOrder(int orderId, int studentId) throws InvalidOrderStateException {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order == null) {
            throw new IllegalArgumentException("Order #" + orderId + " does not exist.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException(orderId, order.getStatus(), "Cancel Order");
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Refund credits
        Student student = getStudentProfile(studentId);
        student.refundCredits(order.getTotalAmount());

        // Restore inventory
        for (OrderItem oi : order.getItems()) {
            try {
                MenuItem item = catalog.getItemById(oi.getItemId());
                item.setAvailableQuantity(item.getAvailableQuantity() + oi.getQuantity());
            } catch (MenuItemNotFoundException ignored) {}
        }

        asyncLogger.logAsync("ORDER_CANCELLED", studentId, orderId, order.getTotalAmount(),
                "Order cancelled by student. Credits refunded back to balance.");
    }

    @Override
    public File exportOrderHistory(int studentId, String filePath) throws IOException {
        List<BaseOrder> studentOrders = new ArrayList<>();
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                studentOrders = orderDAO.findOrdersByStudentId(conn, studentId);
            } catch (SQLException ignored) {}
        }

        if (studentOrders.isEmpty()) {
            for (BaseOrder o : inMemoryOrders.values()) {
                if (o.getStudentId() == studentId) {
                    studentOrders.add(o);
                }
            }
        }

        return OrderHistoryExporter.exportOrdersToCSV(studentOrders, filePath);
    }

    @Override
    public List<BaseOrder> getPendingKitchenOrders() {
        return kitchenQueue.getAllPendingOrders();
    }

    @Override
    public BaseOrder processNextKitchenOrder() {
        BaseOrder order = kitchenQueue.pollNextOrder();
        if (order != null) {
            order.setStatus(OrderStatus.PREPARING);
            kitchenQueue.markOrderCompleted(order);
        }
        return order;
    }

    public KitchenOrderQueue getKitchenQueue() {
        return kitchenQueue;
    }

    public void shutdown() {
        asyncLogger.shutdown();
    }
}
