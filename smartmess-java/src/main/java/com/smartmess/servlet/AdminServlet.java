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
 * Handles Admin campus analytics, 1-click monthly credit reset to 9,000, and top 5 dishes.
 */
public class AdminServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public AdminServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        List<MenuItem> top5 = messService.getTop5Dishes();

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("ordersToday", 74);
        data.put("creditsConsumedToday", 8450);
        data.put("activeStudents", 482);
        data.put("top5Dishes", top5);

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
            JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
            String action = json.has("action") ? json.get("action").getAsString() : "";

            if ("reset_credits".equalsIgnoreCase(action)) {
                int amount = json.has("amount") ? json.get("amount").getAsInt() : 9000;
                messService.resetAllStudentCredits(amount);
                responseData.put("success", true);
                responseData.put("message", "All student balances successfully reset to " + amount + " Credits.");
            } else if ("adjust_credit".equalsIgnoreCase(action)) {
                int studentId = json.get("studentId").getAsInt();
                int delta = json.get("delta").getAsInt();
                messService.topUpCredits(studentId, delta);
                responseData.put("success", true);
                responseData.put("message", "Adjusted student #" + studentId + " credits by " + delta);
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
