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
            JsonObject json = null;
            if (sb.length() > 0) {
                try {
                    json = gson.fromJson(sb.toString(), JsonObject.class);
                } catch (Exception ignored) {}
            }

            String action = "submit";
            if (json != null && json.has("action")) {
                action = json.get("action").getAsString();
            } else if (req.getParameter("action") != null && !req.getParameter("action").isEmpty()) {
                action = req.getParameter("action");
            } else if (req.getParameter("decision") != null || req.getParameter("requestId") != null) {
                action = "review";
            }

            if ("review".equalsIgnoreCase(action)) {
                // Rule 3: Warden actions are Approve and Reject only
                int requestId = 0;
                if (json != null && json.has("requestId")) requestId = json.get("requestId").getAsInt();
                else if (req.getParameter("requestId") != null) requestId = Integer.parseInt(req.getParameter("requestId"));

                boolean approve = true;
                if (json != null) {
                    if (json.has("approve")) approve = json.get("approve").getAsBoolean();
                    else if (json.has("decision")) approve = json.get("decision").getAsString().toUpperCase().startsWith("APP");
                } else if (req.getParameter("decision") != null) {
                    approve = req.getParameter("decision").toUpperCase().startsWith("APP");
                }

                String reason = "";
                if (json != null) {
                    if (json.has("rejectionReason")) reason = json.get("rejectionReason").getAsString().trim();
                    else if (json.has("reason")) reason = json.get("reason").getAsString().trim();
                } else if (req.getParameter("reason") != null) {
                    reason = req.getParameter("reason").trim();
                }

                String warden = "Hostel Warden";
                if (json != null) {
                    if (json.has("wardenName")) warden = json.get("wardenName").getAsString();
                    else if (json.has("reviewedBy")) warden = json.get("reviewedBy").getAsString();
                } else if (req.getParameter("wardenName") != null) {
                    warden = req.getParameter("wardenName");
                }

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
                int studentId = 22;
                String hostel = "";
                String room = "";
                String reason = "";
                String dateStr = null;
                String meals = "All Meals (Breakfast, Lunch, Dinner)";

                if (json != null) {
                    if (json.has("studentId")) studentId = json.get("studentId").getAsInt();
                    if (json.has("hostelName")) hostel = json.get("hostelName").getAsString().trim();
                    if (json.has("roomNumber")) room = json.get("roomNumber").getAsString().trim();
                    if (json.has("reason")) reason = json.get("reason").getAsString().trim();
                    if (json.has("date")) dateStr = json.get("date").getAsString().trim();
                    if (json.has("mealsNeeded")) meals = json.get("mealsNeeded").getAsString().trim();
                }

                if (req.getParameter("studentId") != null && !req.getParameter("studentId").isEmpty()) {
                    try { studentId = Integer.parseInt(req.getParameter("studentId")); } catch (Exception ignored) {}
                }
                if (req.getParameter("hostelBlock") != null) hostel = req.getParameter("hostelBlock").trim();
                else if (req.getParameter("hostelName") != null) hostel = req.getParameter("hostelName").trim();
                if (req.getParameter("roomNumber") != null) room = req.getParameter("roomNumber").trim();
                if (req.getParameter("reason") != null) reason = req.getParameter("reason").trim();
                if (req.getParameter("date") != null) dateStr = req.getParameter("date").trim();
                if (req.getParameter("mealsNeeded") != null) meals = req.getParameter("mealsNeeded").trim();

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
