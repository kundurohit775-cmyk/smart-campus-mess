package com.smartmess.concurrency;

import com.smartmess.collections.KitchenOrderQueue;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.OrderStatus;

/**
 * Demonstrates Multithreading:
 * Implements Runnable to execute kitchen cooking and ticket status progression
 * asynchronously on dedicated chef threads.
 */
public class KitchenWorkerThread implements Runnable {
    private final String chefName;
    private final KitchenOrderQueue queue;
    private volatile boolean running;
    private int ordersProcessed;

    public KitchenWorkerThread(String chefName, KitchenOrderQueue queue) {
        this.chefName = chefName;
        this.queue = queue;
        this.running = true;
        this.ordersProcessed = 0;
    }

    public void stopWorker() {
        this.running = false;
    }

    @Override
    public void run() {
        System.out.printf("👨‍🍳 [%s] [Thread-%d] Chef kitchen worker started and listening for incoming order tickets...%n",
                chefName, Thread.currentThread().getId());

        while (running && !Thread.currentThread().isInterrupted()) {
            BaseOrder order = queue.pollNextOrder();
            if (order != null) {
                processOrder(order);
                ordersProcessed++;
            } else {
                try {
                    // Small sleep when queue is empty to avoid busy-waiting
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        System.out.printf("👨‍🍳 [%s] Kitchen worker shift finished. Total orders cooked: %d.%n",
                chefName, ordersProcessed);
    }

    private void processOrder(BaseOrder order) {
        try {
            // Transition 1: Pending -> Preparing (Cooking)
            order.setStatus(OrderStatus.PREPARING);
            System.out.printf("🔥 [%s] Started Cooking Order #%d (Token: %s) for %s [%s]%n",
                    chefName, order.getOrderId(), order.getPickupToken(), order.getStudentName(), order.getFulfillmentDescription());

            // Simulate cooking time safely
            Thread.sleep(400);

            // Transition 2: Preparing -> Ready
            order.setStatus(OrderStatus.READY);
            System.out.printf("🔔 [%s] Order #%d (Token: %s) is now READY for pickup/delivery!%n",
                    chefName, order.getOrderId(), order.getPickupToken());

            // Finalize order
            queue.markOrderCompleted(order);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public int getOrdersProcessed() {
        return ordersProcessed;
    }
}
