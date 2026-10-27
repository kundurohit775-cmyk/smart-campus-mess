package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.model.MenuItem;
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
 * Handles:
 * 1. HTTP GET: retrieve menu items with category and health filtering.
 * 2. HTTP POST: Chef / Admin stock toggling (In Stock / Sold Out), portion adjustments (+5 / -5).
 */
public class MenuServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson;

    public MenuServlet(IMessService messService) {
        this.messService = messService;
        this.gson = GsonHelper.getGson();
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String category = req.getParameter("category");
        String healthyOnly = req.getParameter("healthy");

        List<MenuItem> items;
        if ("true".equalsIgnoreCase(healthyOnly)) {
            items = messService.getCatalog().getHealthyItems();
        } else if (category != null && !category.isEmpty()) {
            items = messService.getCatalog().getItemsByCategory(category);
        } else {
            items = messService.getCatalog().getAllItems();
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("count", items.size());
        responseData.put("categories", messService.getCatalog().getUniqueCategories());
        responseData.put("items", items);

        resp.setStatus(HttpServletResponse.SC_OK);
        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
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
            JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
            String action = json.has("action") ? json.get("action").getAsString() : "";

            if ("toggle_stock".equalsIgnoreCase(action)) {
                int itemId = json.get("itemId").getAsInt();
                messService.toggleStockStatus(itemId);
                responseData.put("success", true);
                responseData.put("message", "Item #" + itemId + " availability toggled.");
            } else if ("adjust_portion".equalsIgnoreCase(action)) {
                int itemId = json.get("itemId").getAsInt();
                int delta = json.get("delta").getAsInt();
                messService.adjustStock(itemId, delta);
                responseData.put("success", true);
                responseData.put("message", "Item #" + itemId + " stock adjusted by " + delta);
            } else if ("add_dish".equalsIgnoreCase(action)) {
                String name = json.get("name").getAsString();
                String category = json.get("category").getAsString();
                int price = json.get("price").getAsInt();
                int calories = json.has("calories") ? json.get("calories").getAsInt() : 350;
                int stock = json.has("stock") ? json.get("stock").getAsInt() : 50;

                int newId = messService.getCatalog().getAllItems().size() + 1;
                MenuItem newItem = new MenuItem(newId, name, category, price, calories, stock);
                messService.getCatalog().addItem(newItem);

                responseData.put("success", true);
                responseData.put("message", "Dish '" + name + "' added to catalog.");
                responseData.put("item", newItem);
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
