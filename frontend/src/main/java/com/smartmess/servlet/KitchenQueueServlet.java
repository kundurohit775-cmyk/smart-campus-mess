package com.smartmess.servlet;

import com.google.gson.Gson;
import com.smartmess.model.BaseOrder;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles HTTP GET to inspect pending kitchen FIFO queue and HTTP POST to advance the queue.
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

        BaseOrder processed = messService.processNextKitchenOrder();
        Map<String, Object> responseData = new HashMap<>();

        if (processed != null) {
            resp.setStatus(HttpServletResponse.SC_OK);
            responseData.put("success", true);
            responseData.put("message", "Order #" + processed.getOrderId() + " (" + processed.getPickupToken() + ") is now being cooked.");
            responseData.put("order", processed);
        } else {
            resp.setStatus(HttpServletResponse.SC_OK);
            responseData.put("success", false);
            responseData.put("message", "Kitchen queue is currently empty. No pending orders.");
        }

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
