package com.smartmess.concurrency;

import com.smartmess.file.AuditLogFileManager;

import java.util.concurrent.*;

/**
 * Demonstrates Multithreading:
 * Uses ExecutorService thread pool to offload transaction logging asynchronously
 * so student order placement experiences zero I/O latency.
 */
public class AsyncAuditLogger {
    private final ExecutorService executor;
    private final AuditLogFileManager fileManager;

    public AsyncAuditLogger(AuditLogFileManager fileManager) {
        this.fileManager = fileManager;
        // Daemon thread pool so it does not block application exit
        this.executor = Executors.newFixedThreadPool(2, r -> {
            Thread t = new Thread(r);
            t.setName("SmartMess-AsyncAuditWorker-" + t.getId());
            t.setDaemon(true);
            return t;
        });
    }

    /**
     * Submits an asynchronous Runnable audit task.
     */
    public Future<?> logAsync(String action, int studentId, int orderId, int amount, String details) {
        return executor.submit(() -> {
            fileManager.logTransaction(action, studentId, orderId, amount, details);
        });
    }

    /**
     * Submits a Callable task that returns the confirmation message.
     */
    public Future<String> logCallable(String action, int studentId, int orderId, int amount, String details) {
        return executor.submit(() -> {
            fileManager.logTransaction(action, studentId, orderId, amount, details);
            return String.format("SUCCESS: Audit logged for Order #%d by %s", orderId, Thread.currentThread().getName());
        });
    }

    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(2, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
