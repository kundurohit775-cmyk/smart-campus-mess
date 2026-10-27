package com.smartmess.service;

import com.smartmess.collections.MenuCatalog;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.MenuItem;
import com.smartmess.model.OrderItem;
import com.smartmess.model.Student;
import com.smartmess.exception.*;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * Demonstrates OOP: Abstraction & Interface Design.
 * Defines the public contract for all SmartMess kitchen, credit, and ordering capabilities.
 */
public interface IMessService {

    /**
     * Initializes the menu catalog from persistent storage or default data.
     */
    void initializeCatalog();

    /**
     * Retrieves the collections-backed MenuCatalog.
     */
    MenuCatalog getCatalog();

    /**
     * Fetches student profile and available credits.
     */
    Student getStudentProfile(int studentId);

    /**
     * Places a new meal order atomically with credit verification and inventory deduction.
     */
    BaseOrder placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String roomAddress)
            throws OutOfStockException, InsufficientCreditsException, MenuItemNotFoundException;

    /**
     * Cancels an order and refunds student credits if still pending.
     */
    void cancelOrder(int orderId, int studentId) throws InvalidOrderStateException;

    /**
     * Exports order history to CSV using try-with-resources file streams.
     */
    File exportOrderHistory(int studentId, String filePath) throws IOException;

    /**
     * Retrieves list of pending orders in the kitchen FIFO queue.
     */
    List<BaseOrder> getPendingKitchenOrders();

    /**
     * Simulates cooking the next pending kitchen order.
     */
    BaseOrder processNextKitchenOrder();
}
