package com.smartmess.servlet;

import com.google.gson.Gson;
import com.smartmess.model.MenuItem;
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
 * Handles HTTP GET requests to retrieve menu items with optional category and health filtering.
 * Follows MVC: Controller handling HTTP requests and returning JSON view.
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

        resp.setStatus(HttpServletResponse.SC_OK); // 200 OK
        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
