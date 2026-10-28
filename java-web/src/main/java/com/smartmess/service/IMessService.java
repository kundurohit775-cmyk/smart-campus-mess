package com.smartmess.service;

import com.smartmess.collections.MenuCatalog;
import com.smartmess.exception.*;
import com.smartmess.model.*;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates OOP: Abstraction & Interface Design.
 * Defines the public contract for all SmartMess kitchen, credit, ordering, pre-order,
 * sick-leave, food waste avoidance, and administrative capabilities.
 */
public interface IMessService {

    void initializeCatalog();

    MenuCatalog getCatalog();

    Student getStudentProfile(int studentId);

    void registerStudent(Student student);

    List<Student> getAllStudents();

    Student findStudentByRegNumber(String regNumber);

    void addStudentCredits(int studentId, int amount, String reason, String adminName);

    void deductStudentCredits(int studentId, int amount, String reason, String adminName);

    void setStudentMonthlyLimit(int studentId, int newLimit, String adminName);

    void reissueStudentCredits(int studentId, String adminName);

    int reissueAllStudentsCredits(String adminName);

    int bulkCreditAction(List<Integer> studentIds, String action, int amount, String reason, String adminName);

    boolean isAutoMonthlyReissueEnabled();

    void setAutoMonthlyReissueEnabled(boolean enabled);

    int triggerMonthlyReissue(String adminName);

    List<TransactionRecord> getAllTransactions();

    void addMenuItem(MenuItem item, String adminName);

    void updateMenuItem(MenuItem item, String adminName);

    void updateItemStock(int itemId, int newQuantity, String reason, String adminName);

    void adjustItemStock(int itemId, int delta, String reason, String adminName);

    void toggleItemAvailability(int itemId, String adminName);

    void removeStock(int itemId, int amountToRemove, String reason, String adminName);

    void deleteMenuItem(int itemId, String adminName);

    void setLowStockThreshold(int itemId, int threshold, String adminName);

    List<MenuItem> getLowStockItems();

    List<StockChangeRecord> getStockChangeLogs();

    BaseOrder placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String roomAddress)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException, MessException;

    BaseOrder cancelOrder(int orderId, int studentId) throws InvalidOrderStateException;

    BaseOrder updateOrderStatus(int orderId, OrderStatus newStatus);

    BaseOrder updateOrderPrepTime(int orderId, int minutes, String chefActivity);

    BaseOrder advanceOrderStatus(int orderId, OrderStatus nextStatus, String chefActivity);

    List<BaseOrder> getActiveOrdersForStudent(int studentId);

    List<BaseOrder> getOrderHistory(int studentId);

    BaseOrder getOrderById(int orderId);

    PreOrder placePreOrder(int studentId, int itemId, int quantity, LocalDate scheduledDate)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException;

    List<PreOrder> getPreOrders(int studentId);

    HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date);

    HealthRequest submitHealthRequest(int studentId, String hostel, String room, String reason, LocalDate date, String mealsNeeded);

    HealthRequest submitHealthRequest(int studentId, String studentName, String regNo, String phone,
                                      String hostel, String room, String reason, String attachedNote,
                                      LocalDate date, String mealsNeeded);

    List<HealthRequest> getPendingHealthRequests();

    List<HealthRequest> getHealthRequestsForStudent(int studentId);

    List<HealthRequest> getHealthRequestsForHostel(String hostelBlock);

    List<HealthRequest> getStudentLeaveHistory(int studentId);

    boolean hasApprovedSickLeave(int studentId, LocalDate date);

    HealthRequest reviewHealthRequest(int requestId, boolean approve, String rejectionReason, String wardenName);

    void topUpCredits(int studentId, int amount);

    List<TransactionRecord> getTransactions(int studentId);

    void adjustStock(int itemId, int delta);

    void toggleStockStatus(int itemId);

    void resetAllStudentCredits(int amount);

    SustainabilityMetrics getSustainabilityMetrics();

    List<MenuItem> getTop5Dishes();

    File exportOrderHistory(int studentId, String filePath) throws IOException;

    List<BaseOrder> getPendingKitchenOrders();

    BaseOrder processNextKitchenOrder();

    Map<String, Boolean> getAdminWidgetPreferences(String adminEmail);

    void saveAdminWidgetPreferences(String adminEmail, Map<String, Boolean> prefs, List<String> order);

    List<String> getAdminWidgetOrder(String adminEmail);
}
