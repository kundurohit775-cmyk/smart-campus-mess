package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.OrderStatus;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles chef kitchen queue operations:
 * - Live inspection of incoming orders (Room delivery orders appear ONLY if approved by warden)
 * - Estimated prep time configuration per order
 * - Explicit order advancement: Accept -> Start Cooking -> Mark Ready -> Out for Delivery -> Delivered / Complete
 */
public class KitchenQueueServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson;

    public KitchenQueueServlet(IMessService messService) {
        this.messService = messService;
        this.gson = GsonHelper.getGson();
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setStatus(HttpServletResponse.SC_OK);

        List<BaseOrder> pendingOrders = messService.getPendingKitchenOrders();

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("pendingCount", pendingOrders.size());
        responseData.put("queue", pendingOrders);

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }

        Map<String, Object> responseData = new HashMap<>();
        String raw = sb.toString().trim();

        try {
            if (!raw.isEmpty()) {
                JsonObject json = gson.fromJson(raw, JsonObject.class);
                String action = json.has("action") ? json.get("action").getAsString() : "advance";

                if ("set_prep_time".equalsIgnoreCase(action)) {
                    int orderId = json.get("orderId").getAsInt();
                    int mins = json.get("prepMinutes").getAsInt();
                    String activity = json.has("chefActivity") ? json.get("chefActivity").getAsString() : null;

                    BaseOrder updated = messService.updateOrderPrepTime(orderId, mins, activity);
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Prep time for Order #" + orderId + " set to " + mins + " minutes.");
                    responseData.put("order", updated);

                } else if ("advance_status".equalsIgnoreCase(action) || "status_update".equalsIgnoreCase(action)) {
                    int orderId = json.get("orderId").getAsInt();
                    String statusStr = json.get("status").getAsString();
                    String activity = json.has("chefActivity") ? json.get("chefActivity").getAsString() : null;
                    OrderStatus newStatus = OrderStatus.fromString(statusStr);

                    BaseOrder updated = messService.advanceOrderStatus(orderId, newStatus, activity);
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Order #" + orderId + " progressed to " + newStatus.getDisplayName());
                    responseData.put("order", updated);
                } else {
                    BaseOrder processed = messService.processNextKitchenOrder();
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", processed != null);
                    responseData.put("message", processed != null ? "Order #" + processed.getOrderId() + " is now being cooked." : "Queue is empty.");
                    responseData.put("order", processed);
                }
            } else {
                BaseOrder processed = messService.processNextKitchenOrder();
                resp.setStatus(HttpServletResponse.SC_OK);
                responseData.put("success", processed != null);
                responseData.put("message", processed != null ? "Order #" + processed.getOrderId() + " is now being cooked." : "Queue is empty.");
                responseData.put("order", processed);
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("message", e.getMessage());
        }

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
