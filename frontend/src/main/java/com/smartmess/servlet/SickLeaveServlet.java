package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.model.HealthRequest;
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
 * Handles student sick-leave requests for hostel room delivery and warden review actions.
 */
public class SickLeaveServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public SickLeaveServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        List<HealthRequest> list = messService.getPendingHealthRequests();
        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("requests", list);

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
            String action = json.has("action") ? json.get("action").getAsString() : "submit";

            if ("review".equalsIgnoreCase(action)) {
                // Warden approving or rejecting
                int requestId = json.get("requestId").getAsInt();
                boolean approve = json.get("approve").getAsBoolean();
                String reason = json.has("rejectionReason") ? json.get("rejectionReason").getAsString() : "";
                String warden = json.has("wardenName") ? json.get("wardenName").getAsString() : "Warden Block B";

                HealthRequest updated = messService.reviewHealthRequest(requestId, approve, reason, warden);
                responseData.put("success", true);
                responseData.put("message", "Health request marked " + updated.getStatus());
                responseData.put("request", updated);
            } else {
                // Student submitting request
                int studentId = json.has("studentId") ? json.get("studentId").getAsInt() : 22;
                String hostel = json.has("hostelName") ? json.get("hostelName").getAsString() : "Hostel Block B";
                String room = json.has("roomNumber") ? json.get("roomNumber").getAsString() : "Room 304";
                String reason = json.has("reason") ? json.get("reason").getAsString() : "Medical sick leave";

                HealthRequest hr = messService.submitHealthRequest(studentId, hostel, room, reason, LocalDate.now());
                resp.setStatus(HttpServletResponse.SC_CREATED);
                responseData.put("success", true);
                responseData.put("message", "Sick leave room delivery request submitted to Warden.");
                responseData.put("request", hr);
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
