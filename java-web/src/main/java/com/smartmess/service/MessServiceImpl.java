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
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstrates OOP: Full concrete implementation of IMessService.
 * Orchestrates:
 * - Collections Framework (MenuCatalog, KitchenOrderQueue, Lists, HashMaps)
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
    private final List<PreOrder> inMemoryPreOrders;
    private final List<HealthRequest> inMemoryHealthRequests;
    private final List<TransactionRecord> inMemoryTransactions;
    private final SustainabilityMetrics sustainabilityMetrics;
    private final AtomicInteger orderIdSequence;
    private final AtomicInteger preOrderIdSequence;
    private final AtomicInteger healthRequestIdSequence;
    private final AtomicInteger transactionIdSequence;

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
        this.inMemoryPreOrders = new ArrayList<>();
        this.inMemoryHealthRequests = new ArrayList<>();
        this.inMemoryTransactions = new ArrayList<>();
        this.sustainabilityMetrics = new SustainabilityMetrics(142.5, 356.25, 25650.0, 356, 78);

        this.orderIdSequence = new AtomicInteger(100);
        this.preOrderIdSequence = new AtomicInteger(500);
        this.healthRequestIdSequence = new AtomicInteger(10);
        this.transactionIdSequence = new AtomicInteger(1000);

        initializeCatalog();
        seedDefaultState();
    }

    private void seedDefaultState() {
        // Seed primary student
        Student student = new Student(22, "Rohit Kundu", "rohit.kundu2022@vitstudent.ac.in", "+91 9876543210", "Block B - Room 304", 8700);
        inMemoryStudents.put(student.getId(), student);

        // Seed sample transactions
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, 9000, "MONTHLY_ALLOWANCE", 9000, "Monthly campus allowance credit"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, -120, "DEBIT_ORDER", 8880, "Order #68 - Masala Dosa"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, -180, "DEBIT_ORDER", 8700, "Order #70 - Paneer Butter Masala"));

        // Seed sample health request (Approved for student 22 for today -> enables room delivery)
        HealthRequest hrApproved = new HealthRequest(healthRequestIdSequence.incrementAndGet(), 22, "Rohit Kundu", "Block B", "Room 304", "Severe viral fever & prescribed bed rest", LocalDate.now(), "All Meals (Breakfast, Lunch, Dinner)");
        hrApproved.setStatus("APPROVED");
        hrApproved.setWardenName("Dr. S. Raman");
        hrApproved.setStudentEmail("rohit.kundu2022@vitstudent.ac.in");
        hrApproved.setReviewedAt(LocalDateTime.now().minusHours(2));
        inMemoryHealthRequests.add(hrApproved);

        // Seed pending health request for Warden review demonstration (Block B)
        HealthRequest hrPending = new HealthRequest(healthRequestIdSequence.incrementAndGet(), 23, "Aarav Sharma", "Block B", "Room 112", "Sprained ankle, unable to walk to cafeteria", LocalDate.now(), "Lunch, Dinner");
        hrPending.setStatus("PENDING");
        hrPending.setStudentEmail("aarav.sharma2023@vitstudent.ac.in");
        inMemoryHealthRequests.add(hrPending);

        // Seed active order for live tracking (TK-3584)
        BaseOrder activeOrder = new DineInOrder(orderIdSequence.incrementAndGet(), 22, "Rohit Kundu");
        activeOrder.setPickupToken("TK-3584");
        activeOrder.setStatus(OrderStatus.PREPARING);
        activeOrder.setEstimatedPrepMinutes(15);
        activeOrder.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(11));
        activeOrder.setChefActivity("Chef is preparing your order");
        activeOrder.addItem(new OrderItem(4, "Paneer Butter Masala & Roti", 1, 120, 580));
        activeOrder.addItem(new OrderItem(10, "Fresh Lime Soda", 1, 30, 90));
        inMemoryOrders.put(activeOrder.getOrderId(), activeOrder);
        kitchenQueue.enqueue(activeOrder);

        // Seed sample pre-order
        PreOrder pre = new PreOrder(preOrderIdSequence.incrementAndGet(), 22, "Rohit Kundu", 7, "Hyderabadi Dum Biryani (Chef Special)", 1, 180, LocalDate.now().plusDays(1));
        inMemoryPreOrders.add(pre);
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
            catalog.addItem(new MenuItem(1, "Masala Dosa", "Breakfast", 60, 320, 45));
            catalog.addItem(new MenuItem(2, "Idli Vada Combo", "Breakfast", 50, 280, 50));
            catalog.addItem(new MenuItem(3, "South Indian Veg Thali", "Lunch", 90, 650, 60));
            catalog.addItem(new MenuItem(4, "Paneer Butter Masala & Roti", "Lunch", 120, 580, 35));
            catalog.addItem(new MenuItem(5, "Dal Tadka with Jeera Rice", "Lunch", 80, 480, 40));
            catalog.addItem(new MenuItem(6, "Chicken Biryani", "Dinner", 150, 720, 50));
            catalog.addItem(new MenuItem(7, "Hyderabadi Dum Biryani", "Dinner", 180, 750, 30));
            catalog.addItem(new MenuItem(8, "Veg Fried Rice & Manchurian", "Dinner", 110, 520, 40));
            catalog.addItem(new MenuItem(9, "Samosa (2 pcs)", "Snacks", 30, 260, 80));
            catalog.addItem(new MenuItem(10, "Filter Coffee", "Beverages", 20, 95, 100));
            catalog.addItem(new MenuItem(11, "Fresh Lime Soda", "Beverages", 25, 60, 90));
            catalog.addItem(new SpecialMenuItem(12, "Chef Weekend Royal Biryani", "Dinner", 200, 780, 25,
                    LocalDate.now().plusDays(1)));
        }
    }

    @Override
    public MenuCatalog getCatalog() {
        return catalog;
    }

    @Override
    public synchronized Student getStudentProfile(int studentId) {
        if (inMemoryStudents.containsKey(studentId)) {
            return inMemoryStudents.get(studentId);
        }
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                Student s = studentDAO.findById(conn, studentId);
                if (s != null) {
                    inMemoryStudents.put(studentId, s);
                    return s;
                }
            } catch (SQLException ignored) {}
        }
        Student defaultStudent = new Student(studentId, "Rohit Kundu", "rohit.kundu2022@vitstudent.ac.in", "+91 9876543210", "Block B - Room 304", 1250);
        inMemoryStudents.put(studentId, defaultStudent);
        return defaultStudent;
    }

    @Override
    public synchronized void registerStudent(Student student) {
        if (student != null) {
            inMemoryStudents.put(student.getId(), student);
        }
    }

    @Override
    public synchronized BaseOrder placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String roomAddress)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException, MessException {

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Cannot place an order with zero items.");
        }

        Student student = getStudentProfile(studentId);
        int generatedId = orderIdSequence.incrementAndGet();

        BaseOrder order;
        if (isRoomDelivery) {
            if (!hasApprovedSickLeave(studentId, LocalDate.now())) {
                throw new MessException("Room delivery requires an approved sick-leave request for today's date from your hostel warden.");
            }
            order = new RoomDeliveryOrder(generatedId, studentId, student.getName(),
                    roomAddress != null ? roomAddress : student.getRoomNumber(), 0);
        } else {
            order = new DineInOrder(generatedId, studentId, student.getName());
        }

        for (OrderItem reqItem : items) {
            MenuItem catalogItem = catalog.findById(reqItem.getItemId());
            if (catalogItem == null) {
                throw new MenuItemNotFoundException(reqItem.getItemId());
            }
            if (catalogItem.getAvailableQuantity() < reqItem.getQuantity()) {
                throw new OutOfStockException(catalogItem.getItemId(), catalogItem.getItemName(),
                        reqItem.getQuantity(), catalogItem.getAvailableQuantity());
            }
            OrderItem lineItem = new OrderItem(
                    catalogItem.getItemId(),
                    catalogItem.getItemName(),
                    reqItem.getQuantity(),
                    catalogItem.getPrice(),
                    catalogItem.getCalories()
            );
            order.addItem(lineItem);
        }

        if (isRoomDelivery) {
            order.setTotalAmount(order.getTotalAmount() + 20); // Delivery fee
        }

        if (!student.hasSufficientCredits(order.getTotalAmount())) {
            throw new InsufficientCreditsException(student.getId(), order.getTotalAmount(), student.getRemainingCredits());
        }

        boolean dbCommitted = false;
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                orderDAO.placeOrderTransaction(conn, order);
                dbCommitted = true;
            } catch (SQLException e) {
                System.out.printf("⚠️ [JDBC Fallback] Cloud DB unavailable (%s). Processing in-memory.%n", e.getMessage());
            }
        }

        if (!dbCommitted) {
            student.deductCredits(order.getTotalAmount());
            for (OrderItem oi : order.getItems()) {
                catalog.reduceStock(oi.getItemId(), oi.getQuantity());
            }
        }

        // Add to Transaction Ledger
        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                -order.getTotalAmount(),
                "DEBIT_ORDER",
                student.getRemainingCredits(),
                "Order #" + order.getOrderId() + " (" + order.getPickupToken() + ")"
        ));

        inMemoryOrders.put(order.getOrderId(), order);
        kitchenQueue.enqueue(order);

        asyncLogger.logAsync("ORDER_PLACED", String.format(
                "STUDENT: #%-4d | ORDER: #%-4d | AMOUNT: %-4d Cr | Token: %s | %s | %d items",
                studentId, order.getOrderId(), order.getTotalAmount(), order.getPickupToken(),
                order.getFulfillmentDescription(), order.getItems().size()
        ));

        return order;
    }

    @Override
    public synchronized BaseOrder cancelOrder(int orderId, int studentId) throws InvalidOrderStateException {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order == null) {
            throw new InvalidOrderStateException(orderId, OrderStatus.CANCELLED, "cancel non-existent order");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException(orderId, order.getStatus(), "cancel");
        }

        order.setStatus(OrderStatus.CANCELLED);
        Student student = getStudentProfile(studentId);
        student.refundCredits(order.getTotalAmount());

        for (OrderItem item : order.getItems()) {
            catalog.increaseStock(item.getItemId(), item.getQuantity());
        }

        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                order.getTotalAmount(),
                "CREDIT_REFUND",
                student.getRemainingCredits(),
                "Refund for Cancelled Order #" + orderId
        ));

        asyncLogger.logAsync("ORDER_CANCELLED", "Order #" + orderId + " cancelled. Refunded " + order.getTotalAmount() + " Cr.");
        return order;
    }

    @Override
    public synchronized BaseOrder updateOrderStatus(int orderId, OrderStatus newStatus) {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order != null) {
            order.setStatus(newStatus);
            asyncLogger.logAsync("STATUS_UPDATE", "Order #" + orderId + " is now " + newStatus.getDisplayName());
        }
        return order;
    }

    @Override
    public synchronized PreOrder placePreOrder(int studentId, int itemId, int quantity, LocalDate scheduledDate)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException {
        MenuItem item = catalog.findById(itemId);
        if (item == null) throw new MenuItemNotFoundException(itemId);
        if (item.getAvailableQuantity() < quantity) {
            throw new OutOfStockException(itemId, item.getItemName(), quantity, item.getAvailableQuantity());
        }

        Student student = getStudentProfile(studentId);
        int total = item.getPrice() * quantity;
        if (!student.hasSufficientCredits(total)) {
            throw new InsufficientCreditsException(studentId, total, student.getRemainingCredits());
        }

        student.deductCredits(total);
        item.setAvailableQuantity(item.getAvailableQuantity() - quantity);

        PreOrder pre = new PreOrder(preOrderIdSequence.incrementAndGet(), studentId, student.getName(),
                itemId, item.getItemName(), quantity, total, scheduledDate);
        inMemoryPreOrders.add(pre);

        // Update sustainability
        sustainabilityMetrics.setFoodSavedKg(sustainabilityMetrics.getFoodSavedKg() + (quantity * 0.45));
        sustainabilityMetrics.setCo2AvoidedKg(sustainabilityMetrics.getCo2AvoidedKg() + (quantity * 0.45 * 2.5));
        sustainabilityMetrics.setWaterSavedLiters(sustainabilityMetrics.getWaterSavedLiters() + (quantity * 0.45 * 180));
        sustainabilityMetrics.setTotalPreOrders(sustainabilityMetrics.getTotalPreOrders() + 1);

        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                -total,
                "DEBIT_PREORDER",
                student.getRemainingCredits(),
                "Pre-Order Special #" + pre.getPreOrderId() + " (" + pre.getPickupToken() + ")"
        ));

        return pre;
    }

    @Override
    public synchronized List<PreOrder> getPreOrders(int studentId) {
        List<PreOrder> list = new ArrayList<>();
        for (PreOrder p : inMemoryPreOrders) {
            if (p.getStudentId() == studentId) list.add(p);
        }
        return list;
    }

    @Override
    public synchronized HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date) {
        return submitHealthRequest(studentId, hostel, room, reason, date, "All Meals (Breakfast, Lunch, Dinner)");
    }

    @Override
    public synchronized HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date, String mealsNeeded) {
        Student s = getStudentProfile(studentId);
        HealthRequest hr = new HealthRequest(healthRequestIdSequence.incrementAndGet(), studentId, s.getName(), hostel, room, reason, date, mealsNeeded);
        hr.setStudentEmail(s.getEmail());
        hr.setStudentPhone(s.getPhone());
        inMemoryHealthRequests.add(hr);
        asyncLogger.logAsync("HEALTH_REQUEST_SUBMITTED", "Student #" + studentId + " (" + s.getName() + ") requested sick leave room delivery for " + hostel + " " + room);
        return hr;
    }

    @Override
    public synchronized List<HealthRequest> getPendingHealthRequests() {
        return new ArrayList<>(inMemoryHealthRequests);
    }

    @Override
    public synchronized List<HealthRequest> getHealthRequestsForStudent(int studentId) {
        List<HealthRequest> list = new ArrayList<>();
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (hr.getStudentId() == studentId) list.add(hr);
        }
        list.sort((a, b) -> Integer.compare(b.getRequestId(), a.getRequestId()));
        return list;
    }

    @Override
    public synchronized List<HealthRequest> getHealthRequestsForHostel(String hostelBlock) {
        List<HealthRequest> list = new ArrayList<>();
        String query = hostelBlock != null ? hostelBlock.trim().toLowerCase() : "";
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (query.isEmpty() || (hr.getHostelName() != null && hr.getHostelName().toLowerCase().contains(query))) {
                list.add(hr);
            }
        }
        list.sort((a, b) -> Integer.compare(b.getRequestId(), a.getRequestId()));
        return list;
    }

    @Override
    public synchronized boolean hasApprovedSickLeave(int studentId, LocalDate date) {
        LocalDate checkDate = date != null ? date : LocalDate.now();
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (hr.getStudentId() == studentId &&
                "APPROVED".equalsIgnoreCase(hr.getStatus()) &&
                checkDate.equals(hr.getRequestDate())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public synchronized HealthRequest reviewHealthRequest(int requestId, boolean approve, String rejectionReason, String wardenName) {
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (hr.getRequestId() == requestId) {
                // Rule: Once a decision is made it cannot be changed
                if (!"PENDING".equalsIgnoreCase(hr.getStatus())) {
                    throw new IllegalStateException("Request #" + requestId + " has already been finalized as " + hr.getStatus() + " and cannot be modified.");
                }
                hr.setStatus(approve ? "APPROVED" : "REJECTED");
                hr.setRejectionReason(approve ? "" : rejectionReason);
                hr.setWardenName(wardenName);
                hr.setReviewedAt(java.time.LocalDateTime.now());

                // Rule: Send the student a live notification and an email as soon as the warden decides
                String studentMail = hr.getStudentEmail() != null ? hr.getStudentEmail() : "student@vitstudent.ac.in";
                System.out.printf("📧 [Email & Push Notification] Dispatched to %s (%s):%n" +
                                  "   Subject: Sick-Leave Request #%d Decision: %s%n" +
                                  "   Hostel: %s | Room: %s | Reviewed By: Warden %s%n" +
                                  "   Message: %s%n",
                        hr.getStudentName(), studentMail, hr.getRequestId(), hr.getStatus(),
                        hr.getHostelName(), hr.getRoomNumber(), wardenName,
                        approve ? "Room delivery is now ENABLED for your account for " + hr.getRequestDate() + "."
                                : "Request rejected. Reason: " + rejectionReason);

                asyncLogger.logAsync("HEALTH_REQUEST_REVIEWED", "Request #" + requestId + " was " + hr.getStatus() + " by " + wardenName);
                return hr;
            }
        }
        return null;
    }

    @Override
    public synchronized void topUpCredits(int studentId, int amount) {
        if (amount > 0) {
            Student student = getStudentProfile(studentId);
            student.setRemainingCredits(student.getRemainingCredits() + amount);
            inMemoryTransactions.add(new TransactionRecord(
                    transactionIdSequence.incrementAndGet(),
                    studentId,
                    amount,
                    "TOPUP",
                    student.getRemainingCredits(),
                    "Razorpay 1:1 Credit Wallet Top-up"
            ));
            asyncLogger.logAsync("WALLET_TOPUP", "Student #" + studentId + " topped up " + amount + " Credits.");
        }
    }

    @Override
    public synchronized List<TransactionRecord> getTransactions(int studentId) {
        List<TransactionRecord> list = new ArrayList<>();
        for (TransactionRecord tr : inMemoryTransactions) {
            if (tr.getStudentId() == studentId) list.add(tr);
        }
        Collections.reverse(list);
        return list;
    }

    @Override
    public synchronized void adjustStock(int itemId, int delta) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            item.setAvailableQuantity(Math.max(0, item.getAvailableQuantity() + delta));
            asyncLogger.logAsync("STOCK_ADJUSTMENT", "Item #" + itemId + " stock adjusted by " + delta + " (Now: " + item.getAvailableQuantity() + ")");
        }
    }

    @Override
    public synchronized void toggleStockStatus(int itemId) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            item.setActive(!item.isActive());
            asyncLogger.logAsync("STOCK_TOGGLED", "Item #" + itemId + " active status toggled to " + item.isActive());
        }
    }

    @Override
    public synchronized void resetAllStudentCredits(int amount) {
        for (Student s : inMemoryStudents.values()) {
            s.setRemainingCredits(amount);
            s.setUsedCredits(0);
            inMemoryTransactions.add(new TransactionRecord(
                    transactionIdSequence.incrementAndGet(),
                    s.getId(),
                    amount,
                    "MONTHLY_ALLOWANCE",
                    amount,
                    "Admin Monthly 9,000 Credits Reset"
            ));
        }
        asyncLogger.logAsync("ADMIN_RESET", "All student credits reset to " + amount + " Credits.");
    }

    @Override
    public SustainabilityMetrics getSustainabilityMetrics() {
        return sustainabilityMetrics;
    }

    @Override
    public List<MenuItem> getTop5Dishes() {
        List<MenuItem> all = catalog.getAllItems();
        all.sort((a, b) -> Integer.compare(b.getPrice(), a.getPrice()));
        return all.subList(0, Math.min(5, all.size()));
    }

    @Override
    public File exportOrderHistory(int studentId, String filePath) throws IOException {
        List<BaseOrder> orders = new ArrayList<>(inMemoryOrders.values());
        if (orders.isEmpty() && DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                orders = orderDAO.findOrdersByStudentId(conn, studentId);
            } catch (SQLException ignored) {}
        }
        return OrderHistoryExporter.exportOrdersToCSV(orders, filePath);
    }

    public KitchenOrderQueue getKitchenQueue() {
        return kitchenQueue;
    }

    public void shutdown() {
        if (asyncLogger != null) {
            asyncLogger.shutdown();
        }
    }

    @Override
    public synchronized BaseOrder updateOrderPrepTime(int orderId, int minutes, String chefActivity) {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order != null) {
            order.setEstimatedPrepMinutes(minutes);
            if (chefActivity != null && !chefActivity.trim().isEmpty()) {
                order.setChefActivity(chefActivity.trim());
            }
            asyncLogger.logAsync("PREP_TIME_UPDATED", "Order #" + orderId + " prep time set to " + minutes + "m. Estimated ready: " + order.getEstimatedReadyTime());
        }
        return order;
    }

    @Override
    public synchronized BaseOrder advanceOrderStatus(int orderId, OrderStatus nextStatus, String chefActivity) {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order != null) {
            order.setStatus(nextStatus);
            if (chefActivity != null && !chefActivity.trim().isEmpty()) {
                order.setChefActivity(chefActivity.trim());
            }
            asyncLogger.logAsync("STATUS_ADVANCED", "Order #" + orderId + " (" + order.getPickupToken() + ") is now " + nextStatus.getDisplayName() + " | Activity: " + order.getChefActivity());
        }
        return order;
    }

    @Override
    public synchronized List<BaseOrder> getActiveOrdersForStudent(int studentId) {
        List<BaseOrder> list = new ArrayList<>();
        for (BaseOrder o : inMemoryOrders.values()) {
            if (o.getStudentId() == studentId) {
                if (o.getStatus() != OrderStatus.COMPLETED &&
                    o.getStatus() != OrderStatus.CANCELLED &&
                    o.getStatus() != OrderStatus.DELIVERED) {
                    list.add(o);
                }
            }
        }
        list.sort((a, b) -> Integer.compare(b.getOrderId(), a.getOrderId()));
        return list;
    }

    @Override
    public synchronized List<BaseOrder> getOrderHistory(int studentId) {
        List<BaseOrder> list = new ArrayList<>();
        for (BaseOrder o : inMemoryOrders.values()) {
            if (o.getStudentId() == studentId) {
                list.add(o);
            }
        }
        list.sort((a, b) -> Integer.compare(b.getOrderId(), a.getOrderId()));
        return list;
    }

    @Override
    public synchronized BaseOrder getOrderById(int orderId) {
        return inMemoryOrders.get(orderId);
    }

    @Override
    public synchronized List<BaseOrder> getPendingKitchenOrders() {
        List<BaseOrder> list = new ArrayList<>();
        for (BaseOrder o : inMemoryOrders.values()) {
            if (o.getStatus() != OrderStatus.COMPLETED &&
                o.getStatus() != OrderStatus.CANCELLED &&
                o.getStatus() != OrderStatus.DELIVERED) {
                // Rule 4: Room-delivery orders appear in the queue ONLY if approved by the warden
                if (o instanceof RoomDeliveryOrder) {
                    if (hasApprovedSickLeave(o.getStudentId(), o.getOrderTime().toLocalDate())) {
                        list.add(o);
                    }
                } else {
                    list.add(o);
                }
            }
        }
        list.sort(Comparator.comparing(BaseOrder::getOrderId));
        return list;
    }

    @Override
    public synchronized BaseOrder processNextKitchenOrder() {
        BaseOrder order = kitchenQueue.dequeue();
        if (order != null) {
            order.setStatus(OrderStatus.PREPARING);
            asyncLogger.logAsync("KITCHEN_PROGRESSION", "Chef began cooking Order #" + order.getOrderId() + " (" + order.getPickupToken() + ")");
        }
        return order;
    }
}
