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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Demonstrates OOP: Full concrete implementation of IMessService.
 * Orchestrates:
 * - Collections Framework (MenuCatalog, KitchenOrderQueue, Lists, HashMaps, ConcurrentHashMap)
 * - Exception Handling (custom domain exceptions)
 * - File Handling (OrderHistoryExporter, AuditLogFileManager)
 * - Multithreading (AsyncAuditLogger)
 * - JDBC Transactions (OrderDAO, StudentDAO, MenuItemDAO)
 * - Dynamic Credit Controls & Audit Trails
 * - Menu & Inventory Stock Management
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
    private final List<StockChangeRecord> inMemoryStockLogs;
    private final Map<String, Map<String, Boolean>> adminWidgetPrefs;
    private final Map<String, List<String>> adminWidgetOrders;
    private final SustainabilityMetrics sustainabilityMetrics;
    private final AtomicInteger orderIdSequence;
    private final AtomicInteger preOrderIdSequence;
    private final AtomicInteger healthRequestIdSequence;
    private final AtomicInteger transactionIdSequence;
    private final AtomicInteger stockRecordIdSequence;
    private final AtomicInteger menuItemIdSequence;
    private volatile boolean autoMonthlyReissueEnabled = true;

    public MessServiceImpl() {
        this.catalog = new MenuCatalog();
        this.kitchenQueue = new KitchenOrderQueue();
        this.auditManager = new AuditLogFileManager("smartmess_audit_log.txt");
        this.asyncLogger = new AsyncAuditLogger(auditManager);

        this.studentDAO = new StudentDAO();
        this.menuItemDAO = new MenuItemDAO();
        this.orderDAO = new OrderDAO();

        this.inMemoryStudents = new LinkedHashMap<>();
        this.inMemoryOrders = new ConcurrentHashMap<>();
        this.inMemoryPreOrders = Collections.synchronizedList(new ArrayList<>());
        this.inMemoryHealthRequests = Collections.synchronizedList(new ArrayList<>());
        this.inMemoryTransactions = Collections.synchronizedList(new ArrayList<>());
        this.inMemoryStockLogs = Collections.synchronizedList(new ArrayList<>());
        this.adminWidgetPrefs = new ConcurrentHashMap<>();
        this.adminWidgetOrders = new ConcurrentHashMap<>();
        this.sustainabilityMetrics = new SustainabilityMetrics(142.5, 356.25, 25650.0, 356, 78);

        this.orderIdSequence = new AtomicInteger(100);
        this.preOrderIdSequence = new AtomicInteger(500);
        this.healthRequestIdSequence = new AtomicInteger(10);
        this.transactionIdSequence = new AtomicInteger(1000);
        this.stockRecordIdSequence = new AtomicInteger(100);
        this.menuItemIdSequence = new AtomicInteger(20);

        initializeCatalog();
        seedDefaultState();
    }

    private void seedDefaultState() {
        // 1. Seed diverse campus students
        registerStudent(new Student(22, "Rohit Kundu", "rohit.kundu2022@vitstudent.ac.in", "+91 9876543210", "22BCE1022", "Block B", "Room 304", 8700, 9000));
        registerStudent(new Student(23, "Aarav Sharma", "aarav.sharma2023@vitstudent.ac.in", "+91 9876543211", "23BCE1145", "Block B", "Room 112", 8200, 9000));
        registerStudent(new Student(24, "Priya Patel", "priya.patel2022@vitstudent.ac.in", "+91 9876543212", "22BEE1089", "Block A", "Room 205", 9000, 9000));
        registerStudent(new Student(25, "Karan Verma", "karan.verma2021@vitstudent.ac.in", "+91 9876543213", "21BCS1004", "Block C", "Room 410", 6400, 9500));
        registerStudent(new Student(26, "Ananya Iyer", "ananya.iyer2023@vitstudent.ac.in", "+91 9876543214", "23BIT1056", "Block D", "Room 108", 7800, 9000));
        registerStudent(new Student(27, "Devansh Mehta", "devansh.mehta2022@vitstudent.ac.in", "+91 9876543215", "22BME1033", "Block A", "Room 318", 9000, 9000));

        // 2. Seed initial credit ledger transactions
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, "Rohit Kundu", "22BCE1022", 9000, "MONTHLY_ALLOWANCE", 9000, "Monthly campus allowance credit", "SYSTEM"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, "Rohit Kundu", "22BCE1022", -120, "DEBIT_ORDER", 8880, "Order #68 - Masala Dosa", "STUDENT"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 22, "Rohit Kundu", "22BCE1022", -180, "DEBIT_ORDER", 8700, "Order #70 - Paneer Butter Masala", "STUDENT"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 23, "Aarav Sharma", "23BCE1145", 9000, "MONTHLY_ALLOWANCE", 9000, "Monthly campus allowance credit", "SYSTEM"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 23, "Aarav Sharma", "23BCE1145", -800, "DEBIT_ORDER", 8200, "Order #69 - Cafeteria Lunch Platter", "STUDENT"));
        inMemoryTransactions.add(new TransactionRecord(transactionIdSequence.incrementAndGet(), 25, "Karan Verma", "21BCS1004", 9500, "MONTHLY_ALLOWANCE", 9500, "Special research scholar monthly allowance", "admin@campus.edu"));

        // 3. Seed historical & current health/sick-leave requests
        // Previous historical request for student 22 (Approved 20 days ago)
        HealthRequest hrHist22 = new HealthRequest(8, 22, "Rohit Kundu", "22BCE1022", "Block B", "Room 304",
                "Acute gastroenteritis and dehydration", "Clinic prescription slip verified",
                LocalDate.now().minusDays(20), "All Meals (Breakfast, Lunch, Dinner)");
        hrHist22.setStatus("APPROVED");
        hrHist22.setWardenName("Dr. S. Raman");
        hrHist22.setReviewedAt(LocalDateTime.now().minusDays(20));
        inMemoryHealthRequests.add(hrHist22);

        // Current approved request for student 22 (Approved today -> enables room delivery)
        HealthRequest hrApproved = new HealthRequest(healthRequestIdSequence.incrementAndGet(), 22, "Rohit Kundu", "22BCE1022",
                "Block B", "Room 304", "Severe viral fever & prescribed bed rest", "Doctor advised complete isolation and bed rest for 48 hours",
                LocalDate.now(), "All Meals (Breakfast, Lunch, Dinner)");
        hrApproved.setStatus("APPROVED");
        hrApproved.setWardenName("Dr. S. Raman");
        hrApproved.setStudentEmail("rohit.kundu2022@vitstudent.ac.in");
        hrApproved.setStudentPhone("+91 9876543210");
        hrApproved.setReviewedAt(LocalDateTime.now().minusHours(2));
        inMemoryHealthRequests.add(hrApproved);

        // Pending health request for student 23 (Block B - Aarav Sharma)
        HealthRequest hrPendingB = new HealthRequest(healthRequestIdSequence.incrementAndGet(), 23, "Aarav Sharma", "23BCE1145",
                "Block B", "Room 112", "Sprained ankle during football practice, unable to walk to mess",
                "X-Ray attached. Orthopedic doctor recommended zero weight bearing for 3 days.",
                LocalDate.now(), "Lunch, Dinner");
        hrPendingB.setStatus("PENDING");
        hrPendingB.setStudentEmail("aarav.sharma2023@vitstudent.ac.in");
        hrPendingB.setStudentPhone("+91 9876543211");
        inMemoryHealthRequests.add(hrPendingB);

        // Pending health request for student 24 (Block A - Priya Patel)
        HealthRequest hrPendingA = new HealthRequest(healthRequestIdSequence.incrementAndGet(), 24, "Priya Patel", "22BEE1089",
                "Block A", "Room 205", "Severe migraine and seasonal respiratory infection",
                "Doctor prescribed bed rest and hydration.",
                LocalDate.now(), "Dinner");
        hrPendingA.setStatus("PENDING");
        hrPendingA.setStudentEmail("priya.patel2022@vitstudent.ac.in");
        hrPendingA.setStudentPhone("+91 9876543212");
        inMemoryHealthRequests.add(hrPendingA);

        // 4. Seed active order for student 22 (TK-3584)
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

        // 5. Seed pre-order for tomorrow
        PreOrder pre = new PreOrder(preOrderIdSequence.incrementAndGet(), 22, "Rohit Kundu", 7, "Hyderabadi Dum Biryani (Chef Special)", 1, 180, LocalDate.now().plusDays(1));
        inMemoryPreOrders.add(pre);

        // 6. Seed initial stock logs
        inMemoryStockLogs.add(new StockChangeRecord(stockRecordIdSequence.incrementAndGet(), 1, "Masala Dosa", 50, 45, "Breakfast kitchen dispatch", "chef@campus.edu"));
        inMemoryStockLogs.add(new StockChangeRecord(stockRecordIdSequence.incrementAndGet(), 5, "Dal Tadka with Jeera Rice", 40, 8, "Lunch service high demand", "chef@campus.edu"));
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
            catalog.addItem(new MenuItem(1, "Masala Dosa", "Breakfast", 60, 320, 45,
                    "Crisp golden crepe roasted with pure ghee and stuffed with spiced potato masala, served with coconut chutney & sambar.",
                    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(2, "Idli Vada Combo", "Breakfast", 50, 280, 50,
                    "Steamed fluffy rice cakes paired with a crunchy medu vada, accompanied by lentil sambar and coriander dip.",
                    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(3, "South Indian Veg Thali", "Lunch", 90, 650, 60,
                    "Grand platter featuring two vegetable curries, dal, rasam, curd, fragrant rice, appalam, and sweet payasam.",
                    "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80", 20));
            catalog.addItem(new MenuItem(4, "Paneer Butter Masala & Roti", "Lunch", 120, 580, 35,
                    "Cottage cheese cubes gently simmered in a velvety tomato-cashew gravy with warm whole-wheat tandoori rotis.",
                    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80", 12));
            catalog.addItem(new MenuItem(5, "Dal Tadka with Jeera Rice", "Lunch", 80, 480, 8,
                    "Yellow lentils tempered with ghee, cumin seeds, garlic, and Kashmiri red chillies served with cumin basmati rice.",
                    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(6, "Chicken Biryani", "Dinner", 150, 720, 50,
                    "Tender marinated chicken pieces layered with aromatic basmati rice, saffron, caramelised onions, and mint raita.",
                    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(7, "Hyderabadi Dum Biryani", "Dinner", 180, 750, 30,
                    "Authentic slow dum cooked vegetable biryani infused with kewra water, green cardamom, and crispy cashew nuts.",
                    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(8, "Veg Fried Rice & Manchurian", "Dinner", 110, 520, 40,
                    "Wok-tossed basmati rice with spring onions and garlic, served with crispy vegetable dumplings in spicy sauce.",
                    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80", 15));
            catalog.addItem(new MenuItem(9, "Samosa (2 pcs)", "Snacks", 30, 260, 80,
                    "Crisp flaky pastry pockets filled with spiced potatoes and green peas, served with sweet date-tamarind chutney.",
                    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", 20));
            catalog.addItem(new MenuItem(10, "Filter Coffee", "Beverages", 20, 95, 100,
                    "Traditional South Indian frothy chicory-coffee decoction brewed with piping hot fresh dairy milk.",
                    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", 25));
            catalog.addItem(new MenuItem(11, "Fresh Lime Soda", "Beverages", 25, 60, 90,
                    "Chilled sparkling mineral water blended with hand-pressed Kagzi limes, black salt, and organic mint leaves.",
                    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80", 20));
        }

        // Always guarantee that Next-Day Special Pre-Order dishes exist in the catalog
        if (catalog.findById(12) == null) {
            SpecialMenuItem biryani = new SpecialMenuItem(12, "Chef Weekend Royal Biryani", "Dinner", 200, 780, 25,
                    LocalDate.now().plusDays(1));
            biryani.setDescription("Slow-cooked dum biryani prepared with aged basmati, whole spices, saffron essence, and garnished with roasted cashews & boiled egg / paneer.");
            biryani.setImageUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80");
            catalog.addItem(biryani);
        }
        if (catalog.findById(13) == null) {
            SpecialMenuItem pulao = new SpecialMenuItem(13, "Sunday Shahi Paneer Pulao Feast", "Dinner", 190, 680, 30,
                    LocalDate.now().plusDays(1));
            pulao.setDescription("Royal saffron-infused basmati rice layered with charcoal-smoked malai paneer cubes, ghee, fried onions, and served with burani raita.");
            pulao.setImageUrl("https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80");
            catalog.addItem(pulao);
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
        Student defaultStudent = new Student(studentId, "Rohit Kundu", "rohit.kundu2022@vitstudent.ac.in", "+91 9876543210", "Block B - Room 304", 9000);
        inMemoryStudents.put(studentId, defaultStudent);
        return defaultStudent;
    }

    @Override
    public synchronized void registerStudent(Student student) {
        if (student != null) {
            inMemoryStudents.put(student.getId(), student);
            if (DatabaseConnection.isConfigured()) {
                try (Connection conn = DatabaseConnection.getConnection()) {
                    studentDAO.updateCredits(conn, student.getId(), student.getRemainingCredits(), student.getUsedCredits());
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public synchronized List<Student> getAllStudents() {
        List<Student> list = new ArrayList<>(inMemoryStudents.values());
        list.sort(Comparator.comparing(Student::getName));
        return list;
    }

    @Override
    public synchronized Student findStudentByRegNumber(String regNumber) {
        if (regNumber == null || regNumber.trim().isEmpty()) return null;
        String query = regNumber.trim().toUpperCase();
        for (Student s : inMemoryStudents.values()) {
            if (query.equalsIgnoreCase(s.getRegistrationNumber())) {
                return s;
            }
        }
        return null;
    }

    // =========================================================================
    // ADMIN CREDIT CONTROLS (PER-STUDENT, BULK, & AUTOMATIC REISSUE)
    // =========================================================================

    @Override
    public synchronized void addStudentCredits(int studentId, int amount, String reason, String adminName) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero.");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A mandatory reason is required to add student credits.");
        }
        Student student = getStudentProfile(studentId);
        student.addCredits(amount);
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";

        TransactionRecord tr = new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                amount,
                "ADMIN_ADD",
                student.getRemainingCredits(),
                reason.trim(),
                admin
        );
        inMemoryTransactions.add(tr);
        asyncLogger.logAsync("ADMIN_CREDIT_ADD", "Admin " + admin + " credited +" + amount + " to " + student.getName() + " (" + student.getRegistrationNumber() + "). Reason: " + reason);
    }

    @Override
    public synchronized void deductStudentCredits(int studentId, int amount, String reason, String adminName) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero.");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A mandatory reason is required to deduct student credits.");
        }
        Student student = getStudentProfile(studentId);
        int actualDeduct = Math.min(student.getRemainingCredits(), amount);
        student.deductCredits(actualDeduct);
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";

        TransactionRecord tr = new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                -actualDeduct,
                "ADMIN_DEDUCT",
                student.getRemainingCredits(),
                reason.trim(),
                admin
        );
        inMemoryTransactions.add(tr);
        asyncLogger.logAsync("ADMIN_CREDIT_DEDUCT", "Admin " + admin + " deducted -" + actualDeduct + " from " + student.getName() + " (" + student.getRegistrationNumber() + "). Reason: " + reason);
    }

    @Override
    public synchronized void setStudentMonthlyLimit(int studentId, int newLimit, String adminName) {
        if (newLimit < 0) {
            throw new IllegalArgumentException("Monthly limit cannot be negative.");
        }
        Student student = getStudentProfile(studentId);
        int oldLimit = student.getMonthlyLimit();
        student.setMonthlyLimit(newLimit);
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";

        TransactionRecord tr = new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                0,
                "LIMIT_UPDATE",
                student.getRemainingCredits(),
                "Custom monthly allowance limit updated from " + oldLimit + " to " + newLimit + " Credits",
                admin
        );
        inMemoryTransactions.add(tr);
        asyncLogger.logAsync("ADMIN_LIMIT_UPDATE", "Admin " + admin + " changed monthly limit of " + student.getName() + " to " + newLimit);
    }

    @Override
    public synchronized void reissueStudentCredits(int studentId, String adminName) {
        Student student = getStudentProfile(studentId);
        int limit = student.getMonthlyLimit();
        int delta = limit - student.getRemainingCredits();
        student.resetToMonthlyLimit();
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";

        TransactionRecord tr = new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                delta,
                "MONTHLY_REISSUE",
                student.getRemainingCredits(),
                "Wallet reset to monthly limit (" + limit + " Credits)",
                admin
        );
        inMemoryTransactions.add(tr);
        asyncLogger.logAsync("ADMIN_CREDIT_REISSUE", "Admin " + admin + " reissued credits for " + student.getName() + " back to " + limit);
    }

    @Override
    public synchronized int reissueAllStudentsCredits(String adminName) {
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
        int count = 0;
        for (Student s : inMemoryStudents.values()) {
            int limit = s.getMonthlyLimit();
            int delta = limit - s.getRemainingCredits();
            s.resetToMonthlyLimit();
            inMemoryTransactions.add(new TransactionRecord(
                    transactionIdSequence.incrementAndGet(),
                    s.getId(),
                    s.getName(),
                    s.getRegistrationNumber(),
                    delta,
                    "MONTHLY_REISSUE",
                    limit,
                    "Bulk 1-Click Monthly Credit Reissue (Limit: " + limit + ")",
                    admin
            ));
            count++;
        }
        asyncLogger.logAsync("ADMIN_BULK_REISSUE", "Admin " + admin + " reissued monthly credits for all " + count + " students.");
        return count;
    }

    @Override
    public synchronized int bulkCreditAction(List<Integer> studentIds, String action, int amount, String reason, String adminName) {
        if (studentIds == null || studentIds.isEmpty()) return 0;
        int count = 0;
        for (Integer sid : studentIds) {
            if (inMemoryStudents.containsKey(sid)) {
                if ("REISSUE".equalsIgnoreCase(action)) {
                    reissueStudentCredits(sid, adminName);
                    count++;
                } else if ("ADD".equalsIgnoreCase(action)) {
                    addStudentCredits(sid, amount, reason != null ? reason : "Bulk administrative credit allocation", adminName);
                    count++;
                }
            }
        }
        return count;
    }

    @Override
    public boolean isAutoMonthlyReissueEnabled() {
        return autoMonthlyReissueEnabled;
    }

    @Override
    public void setAutoMonthlyReissueEnabled(boolean enabled) {
        this.autoMonthlyReissueEnabled = enabled;
        asyncLogger.logAsync("ADMIN_AUTO_REISSUE_CONFIG", "Auto monthly 1st-of-month credit reissue set to " + enabled);
    }

    @Override
    public int triggerMonthlyReissue(String adminName) {
        return reissueAllStudentsCredits(adminName);
    }

    @Override
    public synchronized List<TransactionRecord> getAllTransactions() {
        List<TransactionRecord> list = new ArrayList<>(inMemoryTransactions);
        Collections.reverse(list);
        return list;
    }

    // =========================================================================
    // MENU & STOCK CUSTOMIZATION
    // =========================================================================

    @Override
    public synchronized void addMenuItem(MenuItem item, String adminName) {
        if (item == null) return;
        if (item.getItemId() <= 0) {
            item.setItemId(menuItemIdSequence.incrementAndGet());
        }
        catalog.addItem(item);
        String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
        StockChangeRecord rec = new StockChangeRecord(
                stockRecordIdSequence.incrementAndGet(),
                item.getItemId(),
                item.getItemName(),
                0,
                item.getAvailableQuantity(),
                "New Dish added to catalog",
                admin
        );
        inMemoryStockLogs.add(rec);
        asyncLogger.logAsync("MENU_ITEM_ADDED", "Admin " + admin + " added new menu item #" + item.getItemId() + " (" + item.getItemName() + ")");
    }

    @Override
    public synchronized void updateMenuItem(MenuItem item, String adminName) {
        if (item == null) return;
        MenuItem existing = catalog.findById(item.getItemId());
        if (existing != null) {
            int oldStock = existing.getAvailableQuantity();
            existing.setItemName(item.getItemName());
            existing.setCategory(item.getCategory());
            existing.setPrice(item.getPrice());
            existing.setCalories(item.getCalories());
            existing.setDescription(item.getDescription());
            if (item.getImageUrl() != null && !item.getImageUrl().trim().isEmpty()) {
                existing.setImageUrl(item.getImageUrl());
            }
            existing.setLowStockThreshold(item.getLowStockThreshold());
            existing.setActive(item.isActive());
            existing.setAvailableQuantity(item.getAvailableQuantity());

            String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
            if (oldStock != item.getAvailableQuantity()) {
                StockChangeRecord rec = new StockChangeRecord(
                        stockRecordIdSequence.incrementAndGet(),
                        item.getItemId(),
                        item.getItemName(),
                        oldStock,
                        item.getAvailableQuantity(),
                        "Dish details and stock edited",
                        admin
                );
                inMemoryStockLogs.add(rec);
            }
            asyncLogger.logAsync("MENU_ITEM_UPDATED", "Admin " + admin + " updated menu item #" + item.getItemId() + " (" + item.getItemName() + ")");
        }
    }

    @Override
    public synchronized void updateItemStock(int itemId, int newQuantity, String reason, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            int oldQuantity = item.getAvailableQuantity();
            int finalQty = Math.max(0, newQuantity);
            item.setAvailableQuantity(finalQty);
            String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
            String note = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Direct stock quantity adjustment";

            StockChangeRecord rec = new StockChangeRecord(
                    stockRecordIdSequence.incrementAndGet(),
                    itemId,
                    item.getItemName(),
                    oldQuantity,
                    finalQty,
                    note,
                    admin
            );
            inMemoryStockLogs.add(rec);
            asyncLogger.logAsync("STOCK_UPDATE", "Stock for #" + itemId + " (" + item.getItemName() + ") changed from " + oldQuantity + " to " + finalQty + " by " + admin + ". Reason: " + note);
        }
    }

    @Override
    public synchronized void adjustItemStock(int itemId, int delta, String reason, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            updateItemStock(itemId, item.getAvailableQuantity() + delta, reason, adminName);
        }
    }

    @Override
    public synchronized void toggleItemAvailability(int itemId, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            item.setActive(!item.isActive());
            String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
            StockChangeRecord rec = new StockChangeRecord(
                    stockRecordIdSequence.incrementAndGet(),
                    itemId,
                    item.getItemName(),
                    item.getAvailableQuantity(),
                    item.getAvailableQuantity(),
                    item.isActive() ? "Marked Available in Menu" : "Marked Sold Out / Unavailable",
                    admin
            );
            inMemoryStockLogs.add(rec);
            asyncLogger.logAsync("STOCK_TOGGLED", "Item #" + itemId + " availability toggled to " + item.isActive() + " by " + admin);
        }
    }

    @Override
    public synchronized void removeStock(int itemId, int amountToRemove, String reason, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            int oldQuantity = item.getAvailableQuantity();
            int newQuantity = (amountToRemove <= 0) ? 0 : Math.max(0, oldQuantity - amountToRemove);
            String note = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Removed Stock";
            updateItemStock(itemId, newQuantity, note, adminName);
        }
    }

    @Override
    public synchronized void deleteMenuItem(int itemId, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            // Check if past orders exist for this item to preserve historical records
            boolean hasPastOrders = false;
            for (BaseOrder o : inMemoryOrders.values()) {
                if (o.getItems() != null) {
                    for (OrderItem oi : o.getItems()) {
                        if (oi.getItemId() == itemId) {
                            hasPastOrders = true;
                            break;
                        }
                    }
                }
                if (hasPastOrders) break;
            }

            String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
            if (hasPastOrders) {
                // Rule: If it has past orders, archive it so history is preserved
                item.setArchived(true);
                item.setActive(false);
                StockChangeRecord rec = new StockChangeRecord(
                        stockRecordIdSequence.incrementAndGet(),
                        itemId,
                        item.getItemName(),
                        item.getAvailableQuantity(),
                        0,
                        "Archived (Past orders preserved)",
                        admin
                );
                inMemoryStockLogs.add(rec);
                asyncLogger.logAsync("MENU_ITEM_ARCHIVED", "Item #" + itemId + " archived due to past order history by " + admin);
            } else {
                catalog.getAllItems().remove(item);
                StockChangeRecord rec = new StockChangeRecord(
                        stockRecordIdSequence.incrementAndGet(),
                        itemId,
                        item.getItemName(),
                        item.getAvailableQuantity(),
                        0,
                        "Deleted from catalog",
                        admin
                );
                inMemoryStockLogs.add(rec);
                asyncLogger.logAsync("MENU_ITEM_DELETED", "Item #" + itemId + " deleted by " + admin);
            }
        }
    }

    @Override
    public synchronized void setLowStockThreshold(int itemId, int threshold, String adminName) {
        MenuItem item = catalog.findById(itemId);
        if (item != null) {
            item.setLowStockThreshold(threshold);
            String admin = (adminName != null && !adminName.trim().isEmpty()) ? adminName.trim() : "admin@campus.edu";
            asyncLogger.logAsync("LOW_STOCK_THRESHOLD_SET", "Low stock threshold for #" + itemId + " set to " + threshold + " by " + admin);
        }
    }

    @Override
    public synchronized List<MenuItem> getLowStockItems() {
        List<MenuItem> low = new ArrayList<>();
        for (MenuItem item : catalog.getAllItems()) {
            if (item.isActive() && item.isLowStock()) {
                low.add(item);
            }
        }
        return low;
    }

    @Override
    public synchronized List<StockChangeRecord> getStockChangeLogs() {
        List<StockChangeRecord> list = new ArrayList<>(inMemoryStockLogs);
        Collections.reverse(list);
        return list;
    }

    // =========================================================================
    // ORDERING & KITCHEN PIPELINE (STRICT STOCK & SICK-LEAVE CHECKS)
    // =========================================================================

    @Override
    public synchronized BaseOrder placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String roomAddress)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException, MessException {

        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Cannot place an order with zero items.");
        }

        Student student = getStudentProfile(studentId);
        int generatedId = orderIdSequence.incrementAndGet();

        // 1. Strict Stock Checks across all requested items
        for (OrderItem oi : items) {
            MenuItem dish = catalog.findById(oi.getItemId());
            if (dish == null || dish.isArchived()) {
                throw new MenuItemNotFoundException("Menu item #" + oi.getItemId() + " is not available.");
            }
            if (!dish.isActive() || dish.getAvailableQuantity() <= 0) {
                throw new OutOfStockException("Item '" + dish.getItemName() + "' is sold out / not available.");
            }
            if (dish.getAvailableQuantity() < oi.getQuantity()) {
                throw new OutOfStockException("Item '" + dish.getItemName() + "' only has " +
                        dish.getAvailableQuantity() + " remaining. Cannot order " + oi.getQuantity() + " portions.");
            }
        }

        BaseOrder order;
        if (isRoomDelivery) {
            // Rule 1: Room delivery rejected if no approved sick leave exists for that student and date
            LocalDate today = LocalDate.now();
            if (!hasApprovedSickLeave(studentId, today)) {
                throw new MessException("Hostel room delivery is rejected: No approved sick-leave clearance found for " +
                        student.getName() + " on " + today + ". Please apply for warden approval.");
            }
            String finalAddr = (roomAddress != null && !roomAddress.trim().isEmpty())
                    ? roomAddress.trim() : student.getHostelRoom();
            order = new RoomDeliveryOrder(generatedId, studentId, student.getName(), finalAddr);
        } else {
            order = new DineInOrder(generatedId, studentId, student.getName());
        }

        for (OrderItem oi : items) {
            order.addItem(oi);
        }

        int totalAmount = order.getTotalAmount();
        if (!student.hasSufficientCredits(totalAmount)) {
            throw new InsufficientCreditsException(
                    String.format("Insufficient credits. Required: %d Cr, Available: %d Cr.",
                            totalAmount, student.getRemainingCredits())
            );
        }

        // Deduct student credits & record transaction
        student.deductCredits(totalAmount);
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                studentDAO.updateCredits(conn, studentId, student.getRemainingCredits(), student.getUsedCredits());
            } catch (Exception ignored) {}
        }
        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                -totalAmount,
                "DEBIT_ORDER",
                student.getRemainingCredits(),
                "Order #" + generatedId + " (" + order.getPickupToken() + ")",
                "STUDENT"
        ));

        // Deduct inventory stock & record changes
        for (OrderItem oi : items) {
            MenuItem dish = catalog.findById(oi.getItemId());
            if (dish != null) {
                int oldStock = dish.getAvailableQuantity();
                dish.setAvailableQuantity(dish.getAvailableQuantity() - oi.getQuantity());
                inMemoryStockLogs.add(new StockChangeRecord(
                        stockRecordIdSequence.incrementAndGet(),
                        dish.getItemId(),
                        dish.getItemName(),
                        oldStock,
                        dish.getAvailableQuantity(),
                        "Order #" + generatedId + " fulfillment",
                        "STUDENT"
                ));
            }
        }

        order.setStatus(OrderStatus.PENDING);
        order.setEstimatedPrepMinutes(15);
        order.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(15));
        order.setChefActivity("Order received, pending chef confirmation");

        inMemoryOrders.put(order.getOrderId(), order);
        kitchenQueue.enqueue(order);

        asyncLogger.logAsync("ORDER_PLACED", String.format("Order #%d (%s) placed by Student #%d (%s). Amount: %d Cr. Delivery: %s",
                order.getOrderId(), order.getPickupToken(), studentId, student.getName(), totalAmount,
                isRoomDelivery ? "Hostel Room (" + order.getDeliveryAddress() + ")" : "Cafeteria Pickup"));

        return order;
    }

    @Override
    public synchronized BaseOrder cancelOrder(int orderId, int studentId) throws InvalidOrderStateException {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order == null) {
            throw new InvalidOrderStateException("Order #" + orderId + " was not found.");
        }
        if (order.getStudentId() != studentId) {
            throw new InvalidOrderStateException("Unauthorized: You do not own Order #" + orderId);
        }
        // Rule: Only allowed action on an active order is Cancel, permitted strictly while still Pending
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException("Order #" + orderId + " is currently " + order.getStatus().getDisplayName() +
                    " and cannot be cancelled. Cancellation is strictly allowed only while Pending.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setChefActivity("Order cancelled by student. Credits refunded.");

        // Refund student credits
        Student student = getStudentProfile(studentId);
        student.refundCredits(order.getTotalAmount());
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                studentDAO.updateCredits(conn, studentId, student.getRemainingCredits(), student.getUsedCredits());
            } catch (Exception ignored) {}
        }
        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                order.getTotalAmount(),
                "CREDIT_REFUND",
                student.getRemainingCredits(),
                "Refund for cancelled Order #" + orderId + " (" + order.getPickupToken() + ")",
                "SYSTEM"
        ));

        // Restore inventory stock
        if (order.getItems() != null) {
            for (OrderItem oi : order.getItems()) {
                MenuItem dish = catalog.findById(oi.getItemId());
                if (dish != null) {
                    int oldStock = dish.getAvailableQuantity();
                    dish.setAvailableQuantity(dish.getAvailableQuantity() + oi.getQuantity());
                    inMemoryStockLogs.add(new StockChangeRecord(
                            stockRecordIdSequence.incrementAndGet(),
                            dish.getItemId(),
                            dish.getItemName(),
                            oldStock,
                            dish.getAvailableQuantity(),
                            "Order #" + orderId + " cancellation restock",
                            "SYSTEM"
                    ));
                }
            }
        }

        asyncLogger.logAsync("ORDER_CANCELLED", "Order #" + orderId + " cancelled by student #" + studentId + ". Refunded " + order.getTotalAmount() + " Cr.");
        return order;
    }

    @Override
    public synchronized BaseOrder updateOrderStatus(int orderId, OrderStatus newStatus) {
        BaseOrder order = inMemoryOrders.get(orderId);
        if (order != null) {
            order.setStatus(newStatus);
            asyncLogger.logAsync("STATUS_UPDATE", "Order #" + orderId + " updated to " + newStatus.getDisplayName());
        }
        return order;
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
    public synchronized PreOrder placePreOrder(int studentId, int itemId, int quantity, LocalDate scheduledDate)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException {
        MenuItem item = catalog.findById(itemId);
        if (item == null) {
            throw new MenuItemNotFoundException("Pre-order item #" + itemId + " not found.");
        }
        if (quantity <= 0) quantity = 1;
        if (item instanceof SpecialMenuItem) {
            SpecialMenuItem special = (SpecialMenuItem) item;
            if (special.getRemainingSpecialStock() < quantity) {
                throw new OutOfStockException("Only " + special.getRemainingSpecialStock() + " portions remaining for " + special.getItemName());
            }
            special.setPreOrderCount(special.getPreOrderCount() + quantity);
        }
        Student student = getStudentProfile(studentId);
        int total = item.getPrice() * quantity;
        if (!student.hasSufficientCredits(total)) {
            throw new InsufficientCreditsException(String.format("Insufficient credits for pre-order. Required: %d Cr, Available: %d Cr.", total, student.getRemainingCredits()));
        }
        student.deductCredits(total);
        if (DatabaseConnection.isConfigured()) {
            try (Connection conn = DatabaseConnection.getConnection()) {
                studentDAO.updateCredits(conn, studentId, student.getRemainingCredits(), student.getUsedCredits());
            } catch (Exception ignored) {}
        }
        LocalDate date = scheduledDate != null ? scheduledDate : LocalDate.now().plusDays(1);
        PreOrder pre = new PreOrder(preOrderIdSequence.incrementAndGet(), studentId, student.getName(), itemId, item.getItemName(), quantity, total, date);
        inMemoryPreOrders.add(pre);
        inMemoryTransactions.add(new TransactionRecord(
                transactionIdSequence.incrementAndGet(),
                studentId,
                student.getName(),
                student.getRegistrationNumber(),
                -total,
                "DEBIT_PREORDER",
                student.getRemainingCredits(),
                "Pre-Order #" + pre.getPreOrderId() + " (" + item.getItemName() + ")",
                "STUDENT"
        ));
        asyncLogger.logAsync("PREORDER_PLACED", "Pre-order #" + pre.getPreOrderId() + " placed by student #" + studentId);
        return pre;
    }

    @Override
    public synchronized List<PreOrder> getPreOrders(int studentId) {
        List<PreOrder> list = new ArrayList<>();
        for (PreOrder p : inMemoryPreOrders) {
            if (p.getStudentId() == studentId) list.add(p);
        }
        list.sort((a, b) -> Integer.compare(b.getPreOrderId(), a.getPreOrderId()));
        return list;
    }

    @Override
    public synchronized List<SpecialMenuItem> getPreOrderCatalog() {
        List<SpecialMenuItem> list = new ArrayList<>();
        for (MenuItem item : catalog.getAllItems()) {
            if (item instanceof SpecialMenuItem && !item.isArchived()) {
                list.add((SpecialMenuItem) item);
            }
        }
        return list;
    }

    // =========================================================================
    // SICK-LEAVE & WARDEN APPROVAL WORKFLOW
    // =========================================================================

    @Override
    public synchronized HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date) {
        return submitHealthRequest(studentId, hostel, room, reason, date, "All Meals (Breakfast, Lunch, Dinner)");
    }

    @Override
    public synchronized HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date, String mealsNeeded) {
        Student s = getStudentProfile(studentId);
        return submitHealthRequest(studentId, s.getName(), s.getRegistrationNumber(), s.getPhone(), hostel, room, reason, "", date, mealsNeeded);
    }

    @Override
    public synchronized HealthRequest submitHealthRequest(int studentId, String studentName, String regNo, String phone,
                                                          String hostel, String room, String reason, String attachedNote,
                                                          LocalDate date, String mealsNeeded) {
        HealthRequest hr = new HealthRequest(
                healthRequestIdSequence.incrementAndGet(),
                studentId,
                studentName != null ? studentName : ("Student #" + studentId),
                regNo != null ? regNo : ("22BCE10" + String.format("%02d", studentId)),
                hostel,
                room,
                reason,
                attachedNote,
                date != null ? date : LocalDate.now(),
                mealsNeeded
        );
        Student s = getStudentProfile(studentId);
        hr.setStudentEmail(s.getEmail());
        hr.setStudentPhone(phone != null ? phone : s.getPhone());
        inMemoryHealthRequests.add(hr);

        asyncLogger.logAsync("HEALTH_REQUEST_SUBMITTED", "Sick leave #" + hr.getRequestId() + " submitted by " + hr.getStudentName() +
                " (" + hr.getRegistrationNumber() + ") for " + hr.getHostelName() + " - " + hr.getRoomNumber());
        return hr;
    }

    @Override
    public synchronized List<HealthRequest> getPendingHealthRequests() {
        List<HealthRequest> list = new ArrayList<>();
        for (HealthRequest hr : inMemoryHealthRequests) {
            if ("PENDING".equalsIgnoreCase(hr.getStatus())) {
                list.add(hr);
            }
        }
        list.sort((a, b) -> Integer.compare(b.getRequestId(), a.getRequestId()));
        return list;
    }

    @Override
    public synchronized List<HealthRequest> getHealthRequestsForStudent(int studentId) {
        List<HealthRequest> list = new ArrayList<>();
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (hr.getStudentId() == studentId) {
                list.add(hr);
            }
        }
        list.sort((a, b) -> Integer.compare(b.getRequestId(), a.getRequestId()));
        return list;
    }

    @Override
    public synchronized List<HealthRequest> getStudentLeaveHistory(int studentId) {
        List<HealthRequest> list = new ArrayList<>();
        for (HealthRequest hr : inMemoryHealthRequests) {
            if (hr.getStudentId() == studentId && !"PENDING".equalsIgnoreCase(hr.getStatus())) {
                list.add(hr);
            }
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
                if (!approve && (rejectionReason == null || rejectionReason.trim().isEmpty())) {
                    throw new IllegalArgumentException("A written rejection reason is strictly required to reject sick leave.");
                }

                hr.setStatus(approve ? "APPROVED" : "REJECTED");
                hr.setRejectionReason(approve ? "" : rejectionReason.trim());
                hr.setWardenName(wardenName);
                hr.setReviewedAt(LocalDateTime.now());

                // Rule: After a decision, student is notified instantly
                String studentMail = hr.getStudentEmail() != null ? hr.getStudentEmail() : "student@vitstudent.ac.in";
                System.out.printf("📧 [Email & In-App Alert] Dispatched to %s (%s):%n" +
                                  "   Subject: Sick-Leave Request #%d Decision: %s%n" +
                                  "   Hostel: %s | Room: %s | Reviewed By: Warden %s%n" +
                                  "   Message: %s%n",
                        hr.getStudentName(), studentMail, hr.getRequestId(), hr.getStatus(),
                        hr.getHostelName(), hr.getRoomNumber(), wardenName,
                        approve ? "Room delivery is now ENABLED for your account for " + hr.getRequestDate() + "."
                                : "Request rejected. Reason: " + rejectionReason);

                // Rule: An approved request appears in the chef's queue as a room-delivery order, and a rejected request does not
                if (approve) {
                    int recoveryOrderId = orderIdSequence.incrementAndGet();
                    String deliveryAddr = hr.getHostelName() + " - " + hr.getRoomNumber();
                    RoomDeliveryOrder recoveryOrder = new RoomDeliveryOrder(
                            recoveryOrderId,
                            hr.getStudentId(),
                            hr.getStudentName(),
                            deliveryAddr
                    );
                    recoveryOrder.setPickupToken("RD-" + (2000 + (recoveryOrderId % 8000)));
                    recoveryOrder.setStatus(OrderStatus.ACCEPTED);
                    recoveryOrder.setEstimatedPrepMinutes(20);
                    recoveryOrder.setEstimatedReadyTime(LocalDateTime.now().plusMinutes(20));
                    recoveryOrder.setChefActivity("Warden approved recovery meal. Chef preparing room delivery.");
                    recoveryOrder.addItem(new OrderItem(
                            5,
                            "Recovery Meal (" + (hr.getMealsNeeded() != null ? hr.getMealsNeeded() : "All Meals") + ")",
                            1,
                            0, // Provided under warden approved sick-leave clearance
                            450
                    ));
                    inMemoryOrders.put(recoveryOrder.getOrderId(), recoveryOrder);
                    kitchenQueue.enqueue(recoveryOrder);
                    asyncLogger.logAsync("ROOM_DELIVERY_DISPATCHED", "Approved sick leave #" + requestId +
                            " automatically generated kitchen queue room delivery order #" + recoveryOrder.getOrderId() + " (" + recoveryOrder.getPickupToken() + ")");
                }

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
            student.addCredits(amount);
            if (DatabaseConnection.isConfigured()) {
                try (Connection conn = DatabaseConnection.getConnection()) {
                    studentDAO.updateCredits(conn, studentId, student.getRemainingCredits(), student.getUsedCredits());
                } catch (Exception ignored) {}
            }
            inMemoryTransactions.add(new TransactionRecord(
                    transactionIdSequence.incrementAndGet(),
                    studentId,
                    student.getName(),
                    student.getRegistrationNumber(),
                    amount,
                    "TOPUP",
                    student.getRemainingCredits(),
                    "Razorpay 1:1 Credit Wallet Top-up",
                    "STUDENT"
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
        adjustItemStock(itemId, delta, "Quick Stock Delta", "chef@campus.edu");
    }

    @Override
    public synchronized void toggleStockStatus(int itemId) {
        toggleItemAvailability(itemId, "chef@campus.edu");
    }

    @Override
    public synchronized void resetAllStudentCredits(int amount) {
        reissueAllStudentsCredits("admin@campus.edu");
    }

    @Override
    public SustainabilityMetrics getSustainabilityMetrics() {
        return sustainabilityMetrics;
    }

    @Override
    public List<MenuItem> getTop5Dishes() {
        List<MenuItem> all = new ArrayList<>(catalog.getAllItems());
        all.removeIf(MenuItem::isArchived);
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
    public synchronized List<BaseOrder> getPendingKitchenOrders() {
        List<BaseOrder> list = new ArrayList<>();
        for (BaseOrder o : inMemoryOrders.values()) {
            if (o.getStatus() != OrderStatus.COMPLETED &&
                o.getStatus() != OrderStatus.CANCELLED &&
                o.getStatus() != OrderStatus.DELIVERED) {
                // Room-delivery orders appear in the queue ONLY if approved by the warden
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

    // =========================================================================
    // ADMIN DASHBOARD WIDGET PREFERENCES
    // =========================================================================

    @Override
    public Map<String, Boolean> getAdminWidgetPreferences(String adminEmail) {
        String key = (adminEmail != null && !adminEmail.trim().isEmpty()) ? adminEmail.trim().toLowerCase() : "default";
        return adminWidgetPrefs.computeIfAbsent(key, k -> {
            Map<String, Boolean> def = new LinkedHashMap<>();
            def.put("widget_orders", true);
            def.put("widget_credits", true);
            def.put("widget_low_stock", true);
            def.put("widget_pending_leaves", true);
            def.put("widget_top_dishes", true);
            return def;
        });
    }

    @Override
    public void saveAdminWidgetPreferences(String adminEmail, Map<String, Boolean> prefs, List<String> order) {
        String key = (adminEmail != null && !adminEmail.trim().isEmpty()) ? adminEmail.trim().toLowerCase() : "default";
        if (prefs != null) {
            adminWidgetPrefs.put(key, new LinkedHashMap<>(prefs));
        }
        if (order != null && !order.isEmpty()) {
            adminWidgetOrders.put(key, new ArrayList<>(order));
        }
    }

    @Override
    public List<String> getAdminWidgetOrder(String adminEmail) {
        String key = (adminEmail != null && !adminEmail.trim().isEmpty()) ? adminEmail.trim().toLowerCase() : "default";
        return adminWidgetOrders.computeIfAbsent(key, k -> Arrays.asList(
                "widget_orders", "widget_credits", "widget_low_stock", "widget_pending_leaves", "widget_top_dishes"
        ));
    }
}
