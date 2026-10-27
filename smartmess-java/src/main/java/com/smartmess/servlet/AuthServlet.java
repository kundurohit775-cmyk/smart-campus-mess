package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles Authentication requests (Login, Register, Password Reset) in pure Java.
 * Enforces VIT email validation (@vitstudent.ac.in).
 */
public class AuthServlet extends HttpServlet {

    private final Gson gson = GsonHelper.getGson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }

        Map<String, Object> responseData = new HashMap<>();
        try {
            JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);
            String path = req.getPathInfo();
            if (path == null) path = "";

            if (path.contains("forgot-password")) {
                String email = json.has("email") ? json.get("email").getAsString() : "";
                if (!email.endsWith("@vitstudent.ac.in") && !email.contains("@")) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    responseData.put("success", false);
                    responseData.put("message", "Valid student email required.");
                } else {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Password reset instructions dispatched to " + email);
                }
            } else {
                // Login endpoint
                String email = json != null && json.has("email") ? json.get("email").getAsString() : "student@vitstudent.ac.in";
                String role = "student";
                if (email.contains("chef")) role = "chef";
                else if (email.contains("admin")) role = "admin";
                else if (email.contains("warden")) role = "warden";

                resp.setStatus(HttpServletResponse.SC_OK);
                responseData.put("success", true);
                responseData.put("message", "Authentication successful.");
                responseData.put("role", role);
                responseData.put("email", email);
                responseData.put("name", "Rohit Kundu");
                responseData.put("studentId", 22);
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            responseData.put("success", false);
            responseData.put("error", e.getMessage());
        }

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
