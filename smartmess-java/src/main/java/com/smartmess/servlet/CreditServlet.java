package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.model.Student;
import com.smartmess.model.TransactionRecord;
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
 * Handles student credit balance inquiries, transaction ledger, and 1:1 Razorpay top-ups.
 */
public class CreditServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public CreditServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String studentIdParam = req.getParameter("studentId");
        int studentId = (studentIdParam != null && !studentIdParam.isEmpty()) ? Integer.parseInt(studentIdParam) : 22;

        Student student = messService.getStudentProfile(studentId);
        List<TransactionRecord> transactions = messService.getTransactions(studentId);

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("studentId", studentId);
        data.put("monthlyLimit", student.getMonthlyLimit());
        data.put("remainingCredits", student.getRemainingCredits());
        data.put("usedCredits", student.getUsedCredits());
        data.put("lowBalanceAlert", student.getRemainingCredits() < 500);
        data.put("healthModeEnabled", student.isHealthModeEnabled());
        data.put("dailyCalorieGoal", student.getDailyCalorieGoal());
        data.put("transactions", transactions);

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
            int studentId = json.has("studentId") ? json.get("studentId").getAsInt() : 22;

            if (json.has("topupAmount")) {
                int amount = json.get("topupAmount").getAsInt();
                messService.topUpCredits(studentId, amount);
                responseData.put("success", true);
                responseData.put("message", "Successfully added " + amount + " Credits via Razorpay payment simulation.");
            } else if (json.has("dailyCalorieGoal")) {
                int goal = json.get("dailyCalorieGoal").getAsInt();
                boolean healthMode = json.has("healthMode") && json.get("healthMode").getAsBoolean();
                Student s = messService.getStudentProfile(studentId);
                s.setDailyCalorieGoal(goal);
                s.setHealthModeEnabled(healthMode);
                responseData.put("success", true);
                responseData.put("message", "Calorie goal updated to " + goal + " kcal.");
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
