package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.smartmess.exception.InsufficientCreditsException;
import com.smartmess.exception.InvalidOrderStateException;
import com.smartmess.exception.MenuItemNotFoundException;
import com.smartmess.exception.OutOfStockException;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.OrderItem;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles:
 * 1. Place order (Atomic JDBC transaction)
 * 2. Instant cancellation while Pending (credit refund + inventory restored)
 * 3. Chef status progression stepper (Pending -> Accepted -> Preparing -> Ready -> Completed)
 */
public class OrderServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson;

    public OrderServlet(IMessService messService) {
        this.messService = messService;
        this.gson = GsonHelper.getGson();
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }

        String jsonBody = sb.toString();
        Map<String, Object> responseData = new HashMap<>();

        try {
            JsonObject json = gson.fromJson(jsonBody, JsonObject.class);
            if (json == null) {
                throw new IllegalArgumentException("Request payload cannot be empty.");
            }

            String action = json.has("action") ? json.get("action").getAsString() : "place";

            if ("cancel".equalsIgnoreCase(action)) {
                // Cancellation flow
                int orderId = json.get("orderId").getAsInt();
                int studentId = json.has("studentId") ? json.get("studentId").getAsInt() : 22;
                BaseOrder cancelled = messService.cancelOrder(orderId, studentId);

                resp.setStatus(HttpServletResponse.SC_OK);
                responseData.put("success", true);
                responseData.put("message", "Order #" + orderId + " cancelled successfully. Credits refunded and inventory restored.");
                responseData.put("order", cancelled);

            } else if ("status_update".equalsIgnoreCase(action)) {
                // Chef status progression
                int orderId = json.get("orderId").getAsInt();
                String statusStr = json.get("status").getAsString();
                OrderStatus newStatus = OrderStatus.fromString(statusStr);
                BaseOrder updated = messService.updateOrderStatus(orderId, newStatus);

                resp.setStatus(HttpServletResponse.SC_OK);
                responseData.put("success", true);
                responseData.put("message", "Order #" + orderId + " progressed to " + newStatus.getDisplayName());
                responseData.put("order", updated);

            } else {
                // Place new order flow
                int studentId = json.has("studentId") ? json.get("studentId").getAsInt() : 22;
                boolean isRoomDelivery = json.has("deliveryType") &&
                        "hostel-delivery".equalsIgnoreCase(json.get("deliveryType").getAsString());
                String deliveryAddress = json.has("deliveryAddress") ? json.get("deliveryAddress").getAsString() : null;

                List<OrderItem> items = new ArrayList<>();
                if (json.has("items")) {
                    JsonArray itemsArray = json.getAsJsonArray("items");
                    for (JsonElement el : itemsArray) {
                        JsonObject itemObj = el.getAsJsonObject();
                        int itemId = itemObj.get("itemId").getAsInt();
                        int qty = itemObj.has("quantity") ? itemObj.get("quantity").getAsInt() : 1;
                        items.add(new OrderItem(itemId, "", qty, 0, 0));
                    }
                }

                if (items.isEmpty()) {
                    throw new IllegalArgumentException("No order items specified in payload.");
                }

                BaseOrder order = messService.placeOrder(studentId, items, isRoomDelivery, deliveryAddress);

                resp.setStatus(HttpServletResponse.SC_CREATED); // 201 Created
                responseData.put("success", true);
                responseData.put("message", "Order placed successfully! Token: " + order.getPickupToken());
                responseData.put("order", order);
            }

        } catch (OutOfStockException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("error", "OUT_OF_STOCK");
            responseData.put("message", e.getMessage());
        } catch (InsufficientCreditsException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("error", "INSUFFICIENT_CREDITS");
            responseData.put("message", e.getMessage());
        } catch (InvalidOrderStateException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("error", "INVALID_STATE");
            responseData.put("message", e.getMessage());
        } catch (MenuItemNotFoundException e) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            responseData.put("success", false);
            responseData.put("error", "ITEM_NOT_FOUND");
            responseData.put("message", e.getMessage());
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("error", "ORDER_FAILED");
            responseData.put("message", e.getMessage());
        }

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
