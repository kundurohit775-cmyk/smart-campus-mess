package com.smartmess.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.smartmess.auth.SecurityService;
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
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Handles Authentication requests (Login, Register, Mobile OTP, Forgot Password) in pure Java.
 * Enforces:
 * - Strict VIT student email validation (@vitstudent.ac.in)
 * - Rate limiting and failure cooldown messages
 * - Password hashing and secure session generation
 * - Role-specific authorization for Student, Chef, Warden, Admin
 */
public class AuthServlet extends HttpServlet {

    private final IMessService messService;
    private final SecurityService securityService = SecurityService.getInstance();
    private final Gson gson = GsonHelper.getGson();

    public AuthServlet() {
        this(null);
    }

    public AuthServlet(IMessService messService) {
        this.messService = messService;
    }

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
            JsonObject json = null;
            if (sb.length() > 0) {
                json = gson.fromJson(sb.toString(), JsonObject.class);
            }
            if (json == null) json = new JsonObject();

            String action = json.has("action") ? json.get("action").getAsString() : "login";

            if ("send_mobile_otp".equalsIgnoreCase(action)) {
                String phone = json.has("phone") ? json.get("phone").getAsString() : "";
                SecurityService.OtpResult res = securityService.sendMobileOtp(phone);
                responseData.put("success", res.success);
                responseData.put("message", res.message);
                responseData.put("countdown", res.countdownSeconds);
                resp.setStatus(res.success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);

            } else if ("login_mobile_otp".equalsIgnoreCase(action)) {
                String phone = json.has("phone") ? json.get("phone").getAsString() : "";
                String otp = json.has("otp") ? json.get("otp").getAsString() : "";
                SecurityService.AuthResult res = securityService.loginWithMobileOtp(phone, otp);
                if (res.success) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Sign in successful via Mobile OTP.");
                    responseData.put("sessionToken", res.session.sessionId);
                    responseData.put("role", res.session.role);
                    responseData.put("name", res.session.name);
                    responseData.put("email", res.session.email);
                    responseData.put("studentId", res.session.userId);
                } else {
                    resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    responseData.put("success", false);
                    responseData.put("message", res.message);
                }

            } else if ("register_student".equalsIgnoreCase(action)) {
                String name = json.has("name") ? json.get("name").getAsString() : "";
                String email = json.has("email") ? json.get("email").getAsString() : "";
                String phone = json.has("phone") ? json.get("phone").getAsString() : "";
                String room = json.has("room") ? json.get("room").getAsString() : "";
                String password = json.has("password") ? json.get("password").getAsString() : "";
                String confirmPassword = json.has("confirmPassword") ? json.get("confirmPassword").getAsString() : "";

                SecurityService.AuthResult res = securityService.registerStudent(name, email, phone, room, password, confirmPassword, messService);
                if (res.success) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Account registered successfully! 9,000 monthly credits granted.");
                    responseData.put("sessionToken", res.session.sessionId);
                    responseData.put("role", "student");
                    responseData.put("name", res.session.name);
                    responseData.put("email", res.session.email);
                    responseData.put("studentId", res.session.userId);
                    responseData.put("credits", 9000);
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    responseData.put("success", false);
                    responseData.put("message", res.message);
                }

            } else if ("send_forgot_otp".equalsIgnoreCase(action)) {
                String email = json.has("email") ? json.get("email").getAsString() : "";
                SecurityService.OtpResult res = securityService.sendPasswordResetOtp(email);
                responseData.put("success", res.success);
                responseData.put("message", res.message);
                resp.setStatus(res.success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);

            } else if ("reset_password".equalsIgnoreCase(action)) {
                String email = json.has("email") ? json.get("email").getAsString() : "";
                String otp = json.has("otp") ? json.get("otp").getAsString() : "";
                String newPassword = json.has("newPassword") ? json.get("newPassword").getAsString() : "";
                String confirmPassword = json.has("confirmPassword") ? json.get("confirmPassword").getAsString() : "";

                SecurityService.AuthResult res = securityService.resetPasswordWithOtp(email, otp, newPassword, confirmPassword);
                resp.setStatus(res.success ? HttpServletResponse.SC_OK : HttpServletResponse.SC_BAD_REQUEST);
                responseData.put("success", res.success);
                responseData.put("message", res.message);

            } else {
                // Default: login_password
                String email = json.has("email") ? json.get("email").getAsString() : "";
                String password = json.has("password") ? json.get("password").getAsString() : "";
                String role = json.has("role") ? json.get("role").getAsString() : "student";

                SecurityService.AuthResult res = securityService.loginWithPassword(email, password, role);
                if (res.success) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    responseData.put("success", true);
                    responseData.put("message", "Sign in successful.");
                    responseData.put("sessionToken", res.session.sessionId);
                    responseData.put("role", res.session.role);
                    responseData.put("name", res.session.name);
                    responseData.put("email", res.session.email);
                    responseData.put("userId", res.session.userId);
                    responseData.put("extra", res.session.extra);
                } else {
                    resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    responseData.put("success", false);
                    responseData.put("message", res.message);
                }
            }

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            responseData.put("success", false);
            responseData.put("message", "Server error during authentication: " + e.getMessage());
        }

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(responseData));
            out.flush();
        }
    }
}
