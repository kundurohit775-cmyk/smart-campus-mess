package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.model.PreOrder;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles next-day special pre-orders to eliminate kitchen overproduction and food waste.
 * GET /api/java/preorders: list student's pre-orders.
 * POST /api/java/preorders: book special for tomorrow.
 */
public class PreOrderServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public PreOrderServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String studentIdParam = req.getParameter("studentId");
        int studentId = (studentIdParam != null && !studentIdParam.isEmpty()) ? Integer.parseInt(studentIdParam) : 22;

        List<PreOrder> list = messService.getPreOrders(studentId);
        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("studentId", studentId);
        data.put("preOrders", list);
        data.put("preorders", list);
        data.put("specialCatalog", messService.getPreOrderCatalog());

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(data));
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }

        Map<String, Object> responseData = new HashMap<>();
        try {
            int studentId = 22;
            int itemId = 12;
            int quantity = 1;

            if (sb.length() > 0) {
                try {
                    JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
                    if (json != null) {
                        if (json.has("studentId")) studentId = json.get("studentId").getAsInt();
                        if (json.has("itemId")) itemId = json.get("itemId").getAsInt();
                        if (json.has("quantity")) quantity = json.get("quantity").getAsInt();
                    }
                } catch (Exception ignored) {}
            }

            if (req.getParameter("studentId") != null && !req.getParameter("studentId").isEmpty()) {
                try { studentId = Integer.parseInt(req.getParameter("studentId")); } catch (Exception ignored) {}
            }
            if (req.getParameter("itemId") != null && !req.getParameter("itemId").isEmpty()) {
                try { itemId = Integer.parseInt(req.getParameter("itemId")); } catch (Exception ignored) {}
            }
            if (req.getParameter("quantity") != null && !req.getParameter("quantity").isEmpty()) {
                try { quantity = Integer.parseInt(req.getParameter("quantity")); } catch (Exception ignored) {}
            }

            PreOrder pre = messService.placePreOrder(studentId, itemId, quantity, LocalDate.now().plusDays(1));
            resp.setStatus(HttpServletResponse.SC_CREATED);
            responseData.put("success", true);
            responseData.put("message", "Next-day pre-order confirmed! Token: " + pre.getPickupToken());
            responseData.put("token", pre.getPickupToken());
            responseData.put("pickupToken", pre.getPickupToken());
            responseData.put("targetDate", pre.getScheduledDate().toString());
            responseData.put("scheduledDate", pre.getScheduledDate().toString());
            responseData.put("preOrder", pre);
            responseData.put("preOrders", messService.getPreOrders(studentId));
            responseData.put("preorders", messService.getPreOrders(studentId));
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
