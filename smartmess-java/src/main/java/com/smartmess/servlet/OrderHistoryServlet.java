package com.smartmess.servlet;

import com.google.gson.Gson;
import com.smartmess.model.BaseOrder;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles HTTP GET requests to fetch student order history or export as downloadable CSV.
 */
public class OrderHistoryServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson;

    public OrderHistoryServlet(IMessService messService) {
        this.messService = messService;
        this.gson = GsonHelper.getGson();
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String studentIdParam = req.getParameter("studentId");
        int studentId = (studentIdParam != null && !studentIdParam.isEmpty()) ? Integer.parseInt(studentIdParam) : 22;
        String format = req.getParameter("format");

        if ("csv".equalsIgnoreCase(format)) {
            // Stream CSV download
            String exportPath = "exports/student_" + studentId + "_orders.csv";
            File csvFile = messService.exportOrderHistory(studentId, exportPath);

            resp.setContentType("text/csv");
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + csvFile.getName() + "\"");
            resp.setStatus(HttpServletResponse.SC_OK);

            try (FileInputStream in = new FileInputStream(csvFile);
                 OutputStream out = resp.getOutputStream()) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                out.flush();
            }
        } else {
            // Return JSON response
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");
            resp.setStatus(HttpServletResponse.SC_OK);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("studentId", studentId);
            responseData.put("student", messService.getStudentProfile(studentId));

            try (PrintWriter out = resp.getWriter()) {
                out.print(gson.toJson(responseData));
                out.flush();
            }
        }
    }
}
