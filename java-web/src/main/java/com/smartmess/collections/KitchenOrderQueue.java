package com.smartmess.collections;

import com.smartmess.model.BaseOrder;
import com.smartmess.model.OrderStatus;

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Demonstrates Collections Framework:
 * Queue<BaseOrder> for first-in, first-out (FIFO) incoming kitchen ticket ordering.
 * Uses ConcurrentLinkedQueue to ensure thread-safe queue operations across multithreaded order workers.
 */
public class KitchenOrderQueue {
    // Thread-safe FIFO Queue
    private final Queue<BaseOrder> pendingQueue;
    // History list of all processed orders
    private final List<BaseOrder> processedOrders;

    public KitchenOrderQueue() {
        this.pendingQueue = new ConcurrentLinkedQueue<>();
        this.processedOrders = Collections.synchronizedList(new ArrayList<>());
    }

    /**
     * Enqueue a newly placed order into the kitchen FIFO line.
     */
    public void enqueue(BaseOrder order) {
        if (order != null) {
            order.setStatus(OrderStatus.PENDING);
            pendingQueue.offer(order);
        }
    }

    /**
     * Retrieves and removes the head of the queue (next order to cook).
     */
    public BaseOrder pollNextOrder() {
        return pendingQueue.poll();
    }

    /**
     * Retrieves, but does not remove, the head of the queue.
     */
    public BaseOrder peekNextOrder() {
        return pendingQueue.peek();
    }

    /**
     * Marks an order completed and archives it into processed list.
     */
    public void markOrderCompleted(BaseOrder order) {
        if (order != null) {
            order.setStatus(OrderStatus.COMPLETED);
            processedOrders.add(order);
        }
    }

    public int getPendingCount() {
        return pendingQueue.size();
    }

    public boolean isEmpty() {
        return pendingQueue.isEmpty();
    }

    public List<BaseOrder> getAllPendingOrders() {
        return new ArrayList<>(pendingQueue);
    }

    public List<BaseOrder> toList() {
        return getAllPendingOrders();
    }

    public BaseOrder dequeue() {
        return pollNextOrder();
    }

    public List<BaseOrder> getAllProcessedOrders() {
        synchronized (processedOrders) {
            return new ArrayList<>(processedOrders);
        }
    }
}
