package com.smartmess.servlet;

import com.google.gson.Gson;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.HealthRequest;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Server-Sent Events (SSE) and Live Data Gateway for SmartMess.
 * Streams real-time updates with automatic reconnect for:
 * - Student live food tracking stepper, prep time countdown, and chef activity
 * - Warden sick-leave approvals & pending counts for their hostel block
 * - Chef incoming kitchen orders
 * - Admin real-time monitoring
 */
public class LiveEventsServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public LiveEventsServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String studentIdParam = req.getParameter("studentId");
        String hostelBlockParam = req.getParameter("hostelBlock");
        String roleParam = req.getParameter("role");
        String acceptHeader = req.getHeader("Accept");

        boolean isSse = acceptHeader != null && acceptHeader.contains("text/event-stream");

        Map<String, Object> payload = buildSnapshot(studentIdParam, hostelBlockParam, roleParam);

        if (isSse) {
            resp.setContentType("text/event-stream");
            resp.setCharacterEncoding("UTF-8");
            resp.setHeader("Cache-Control", "no-cache");
            resp.setHeader("Connection", "keep-alive");
            resp.setHeader("Access-Control-Allow-Origin", "*");

            PrintWriter out = resp.getWriter();
            out.write("event: state-update\n");
            out.write("data: " + gson.toJson(payload) + "\n\n");
            out.flush();
        } else {
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");
            resp.setHeader("Cache-Control", "no-cache");
            try (PrintWriter out = resp.getWriter()) {
                out.print(gson.toJson(payload));
                out.flush();
            }
        }
    }

    private Map<String, Object> buildSnapshot(String studentIdParam, String hostelBlockParam, String roleParam) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("timestamp", System.currentTimeMillis());

        if (studentIdParam != null && !studentIdParam.isEmpty()) {
            try {
                int studentId = Integer.parseInt(studentIdParam);
                List<BaseOrder> activeOrders = messService.getActiveOrdersForStudent(studentId);
                List<HealthRequest> healthRequests = messService.getHealthRequestsForStudent(studentId);
                boolean roomDeliveryApproved = messService.hasApprovedSickLeave(studentId, LocalDate.now());

                snapshot.put("activeOrders", activeOrders);
                snapshot.put("healthRequests", healthRequests);
                snapshot.put("roomDeliveryApproved", roomDeliveryApproved);
            } catch (NumberFormatException ignored) {}
        }

        if (hostelBlockParam != null && !hostelBlockParam.isEmpty()) {
            List<HealthRequest> wardenRequests = messService.getHealthRequestsForHostel(hostelBlockParam);
            int pendingCount = 0;
            for (HealthRequest hr : wardenRequests) {
                if ("PENDING".equalsIgnoreCase(hr.getStatus())) pendingCount++;
            }
            snapshot.put("wardenRequests", wardenRequests);
            snapshot.put("pendingCount", pendingCount);
        }

        if ("chef".equalsIgnoreCase(roleParam) || (studentIdParam == null && hostelBlockParam == null)) {
            List<BaseOrder> kitchenQueue = messService.getPendingKitchenOrders();
            snapshot.put("kitchenQueue", kitchenQueue);
        }

        if ("admin".equalsIgnoreCase(roleParam)) {
            snapshot.put("totalStudents", messService.getAllStudents().size());
            snapshot.put("lowStockCount", messService.getLowStockItems().size());
            snapshot.put("pendingLeavesCount", messService.getPendingHealthRequests().size());
        }

        return snapshot;
    }
}
