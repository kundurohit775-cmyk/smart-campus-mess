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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles student sick-leave requests for hostel room delivery and warden review actions:
 * - Student submission with hostel block, room number, reason, date, and meals needed.
 * - Warden review strictly restricted to assigned hostel block with Approve and Reject (with reason).
 * - Enforces immutability: once decided, requests cannot be modified.
 * - Sends student live notification & email upon warden decision.
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

        String studentIdParam = req.getParameter("studentId");
        String hostelBlockParam = req.getParameter("hostelBlock");

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);

        if (studentIdParam != null) {
            try {
                int studentId = Integer.parseInt(studentIdParam);
                List<HealthRequest> list = messService.getHealthRequestsForStudent(studentId);
                boolean roomDeliveryEnabled = messService.hasApprovedSickLeave(studentId, LocalDate.now());
                data.put("requests", list);
                data.put("roomDeliveryEnabled", roomDeliveryEnabled);
            } catch (NumberFormatException e) {
                data.put("success", false);
                data.put("message", "Invalid student ID.");
            }
        } else if (hostelBlockParam != null) {
            List<HealthRequest> blockRequests = messService.getHealthRequestsForHostel(hostelBlockParam);
            List<HealthRequest> pending = new ArrayList<>();
            List<HealthRequest> approved = new ArrayList<>();
            List<HealthRequest> rejected = new ArrayList<>();

            for (HealthRequest hr : blockRequests) {
                if ("APPROVED".equalsIgnoreCase(hr.getStatus())) {
                    approved.add(hr);
                } else if ("REJECTED".equalsIgnoreCase(hr.getStatus())) {
                    rejected.add(hr);
                } else {
                    pending.add(hr);
                }
            }

            data.put("hostelBlock", hostelBlockParam);
            data.put("pending", pending);
            data.put("approved", approved);
            data.put("rejected", rejected);
            data.put("total", blockRequests.size());
        } else {
            List<HealthRequest> list = messService.getPendingHealthRequests();
            data.put("requests", list);
        }

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
            if (json == null) throw new IllegalArgumentException("Payload cannot be empty.");

            String action = json.has("action") ? json.get("action").getAsString() : "submit";

            if ("review".equalsIgnoreCase(action)) {
                // Rule 3: Warden actions are Approve and Reject only
                int requestId = json.get("requestId").getAsInt();
                boolean approve = json.has("approve") ? json.get("approve").getAsBoolean()
                        : (json.has("decision") && json.get("decision").getAsString().toUpperCase().startsWith("APP"));
                String reason = json.has("rejectionReason") ? json.get("rejectionReason").getAsString().trim()
                        : (json.has("reason") ? json.get("reason").getAsString().trim() : "");
                String warden = json.has("wardenName") ? json.get("wardenName").getAsString()
                        : (json.has("reviewedBy") ? json.get("reviewedBy").getAsString() : "Hostel Warden");

                if (!approve && reason.isEmpty()) {
                    throw new IllegalArgumentException("A short rejection reason is required.");
                }

                HealthRequest updated = messService.reviewHealthRequest(requestId, approve, reason, warden);
                if (updated == null) {
                    throw new IllegalArgumentException("Health request #" + requestId + " not found.");
                }

                responseData.put("success", true);
                responseData.put("message", "Request #" + requestId + " marked " + updated.getStatus() + ". Student notified via live push & email.");
                responseData.put("request", updated);

            } else {
                // Rule 2: Student submitting sick leave request (hostel block, room, reason, date, meals)
                int studentId = json.has("studentId") ? json.get("studentId").getAsInt() : 22;
                String hostel = json.has("hostelName") ? json.get("hostelName").getAsString().trim() : "";
                String room = json.has("roomNumber") ? json.get("roomNumber").getAsString().trim() : "";
                String reason = json.has("reason") ? json.get("reason").getAsString().trim() : "";
                String dateStr = json.has("date") ? json.get("date").getAsString().trim() : null;
                String meals = json.has("mealsNeeded") ? json.get("mealsNeeded").getAsString().trim() : "All Meals (Breakfast, Lunch, Dinner)";

                if (hostel.isEmpty() || room.isEmpty() || reason.isEmpty()) {
                    throw new IllegalArgumentException("Hostel block, room number, and sick leave reason are all required.");
                }

                LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();

                HealthRequest hr = messService.submitHealthRequest(studentId, hostel, room, reason, date, meals);
                resp.setStatus(HttpServletResponse.SC_CREATED);
                responseData.put("success", true);
                responseData.put("message", "Sick leave room delivery request submitted to Warden. Status: Pending approval.");
                responseData.put("request", hr);
            }
        } catch (IllegalStateException e) {
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            responseData.put("success", false);
            responseData.put("message", e.getMessage());
        } catch (IllegalArgumentException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("message", e.getMessage());
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
