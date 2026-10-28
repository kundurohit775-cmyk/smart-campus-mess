package com.smartmess.service;

import com.smartmess.collections.MenuCatalog;
import com.smartmess.exception.*;
import com.smartmess.model.*;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

/**
 * Demonstrates OOP: Abstraction & Interface Design.
 * Defines the public contract for all SmartMess kitchen, credit, ordering, pre-order,
 * sick-leave, and administrative capabilities.
 */
public interface IMessService {

    void initializeCatalog();

    MenuCatalog getCatalog();

    Student getStudentProfile(int studentId);

    void registerStudent(Student student);

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

    List<HealthRequest> getPendingHealthRequests();

    List<HealthRequest> getHealthRequestsForStudent(int studentId);

    List<HealthRequest> getHealthRequestsForHostel(String hostelBlock);

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
}
