package com.smartmess.web;

import com.smartmess.auth.SecurityService;
import com.smartmess.model.BaseOrder;
import com.smartmess.model.HealthRequest;
import com.smartmess.model.MenuItem;
import com.smartmess.model.OrderItem;
import com.smartmess.model.OrderStatus;
import com.smartmess.model.PreOrder;
import com.smartmess.model.Student;
import com.smartmess.model.SustainabilityMetrics;
import com.smartmess.service.IMessService;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 100% Pure Java Web Portal Servlet (javax.servlet.http.HttpServlet).
 * Implements:
 * 1. Landing Page with 4 role selection cards in light cream + orange gradient theme.
 * 2. Common Sign-In Page (/login?role=...) requiring valid credentials before accessing any dashboard.
 * 3. Student Dual-Method Sign-In (Email+Password with @vitstudent.ac.in check OR Mobile OTP with 5-min expiry & countdown).
 * 4. Role Authorization (Chef restricted to CHEF_EMAIL, Admin to ADMIN_EMAIL, Warden to wardens table).
 * 5. Student Registration with 9,000 monthly credits initialization.
 * 6. Single-use 10-minute Forgot Password OTP flow.
 * 7. Secure Server-Side Session verification with 30-min inactivity expiry.
 * 8. Role-guarded Dashboards (Student, Chef, Warden, Admin).
 * 
 * Zero JavaScript files (.js/.jsx) on disk.
 */
public class WebPortalServlet extends HttpServlet {

    private final IMessService messService;
    private final SecurityService securityService = SecurityService.getInstance();

    public WebPortalServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if (path == null || path.isEmpty()) path = "/";

        SecurityService.Session session = getSessionFromCookie(req);

        if ("/logout".equals(path)) {
            handleLogout(req, resp, session);
            return;
        }

        if ("/login".equals(path)) {
            String role = req.getParameter("role");
            if (role == null || role.isEmpty()) role = "student";
            if (session != null) {
                resp.sendRedirect("/dashboard?role=" + session.role);
                return;
            }
            renderLoginPage(req, resp, role.toLowerCase(), req.getParameter("error"), req.getParameter("msg"));
            return;
        }

        if ("/register".equals(path)) {
            if (session != null) {
                resp.sendRedirect("/dashboard?role=" + session.role);
                return;
            }
            renderRegisterPage(req, resp, req.getParameter("error"));
            return;
        }

        if ("/forgot-password".equals(path)) {
            renderForgotPasswordPage(req, resp, req.getParameter("error"), req.getParameter("msg"), req.getParameter("step"), req.getParameter("email"));
            return;
        }

        if ("/dashboard".equals(path)) {
            if (session == null) {
                resp.sendRedirect("/");
                return;
            }
            String reqRole = req.getParameter("role");
            if (reqRole == null || !reqRole.equalsIgnoreCase(session.role)) {
                // Block unauthorized cross-role dashboard access
                resp.sendRedirect("/dashboard?role=" + session.role);
                return;
            }
            renderDashboard(req, resp, session, req.getParameter("msg"), req.getParameter("error"));
            return;
        }

        // Default: Landing Page "/"
        if (session != null) {
            resp.sendRedirect("/dashboard?role=" + session.role);
            return;
        }
        renderLandingPage(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if (path == null) path = "/";

        if ("/login".equals(path)) {
            handleLoginPost(req, resp);
            return;
        }

        if ("/register".equals(path)) {
            handleRegisterPost(req, resp);
            return;
        }

        if ("/forgot-password".equals(path)) {
            handleForgotPasswordPost(req, resp);
            return;
        }

        // Protected Action Endpoints
        SecurityService.Session session = getSessionFromCookie(req);
        if (session == null) {
            resp.sendRedirect("/");
            return;
        }

        if ("/action/order".equals(path)) {
            handleStudentOrder(req, resp, session);
        } else if ("/action/cancel-order".equals(path)) {
            handleCancelOrder(req, resp, session);
        } else if ("/action/book-preorder".equals(path)) {
            handleBookPreOrder(req, resp, session);
        } else if ("/action/topup".equals(path)) {
            handleTopup(req, resp, session);
        } else if ("/action/advance-kitchen".equals(path)) {
            handleAdvanceKitchen(req, resp, session);
        } else if ("/action/toggle-stock".equals(path)) {
            handleToggleStock(req, resp, session);
        } else if ("/action/log-waste".equals(path)) {
            handleLogWaste(req, resp, session);
        } else if ("/action/review-sickleave".equals(path)) {
            handleReviewSickLeave(req, resp, session);
        } else if ("/action/reset-credits".equals(path)) {
            handleResetCredits(req, resp, session);
        } else {
            resp.sendRedirect("/dashboard?role=" + session.role);
        }
    }

    // =========================================================================
    // 1. LANDING PAGE ("/")
    // =========================================================================

    private void renderLandingPage(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            out.println("<!DOCTYPE html>");
            out.println("<html lang='en'>");
            out.println("<head>");
            out.println("  <meta charset='UTF-8'>");
            out.println("  <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            out.println("  <title>SmartMess - Campus Dining & Credit Platform</title>");
            out.println(getCommonStyles());
            out.println("</head>");
            out.println("<body>");

            // Top Bar
            out.println("  <header class='site-header'>");
            out.println("    <div class='logo'>Smart<span class='accent'>Mess</span></div>");
            out.println("    <a href='#roles' class='btn btn-orange'>Sign In</a>");
            out.println("  </header>");

            // Hero Section
            out.println("  <div class='hero-container'>");
            out.println("    <div class='pill-badge'>● Campus Food & Credit Platform</div>");
            out.println("    <h1 class='hero-title'>Smart dining,<br><span class='gradient-text'>seamlessly managed.</span></h1>");
            out.println("    <p class='hero-sub'>SmartMess connects students, chefs, wardens, and campus administrators on one unified platform with zero meal-token queues.</p>");
            out.println("    <div style='margin-top:24px;'>");
            out.println("      <a href='#roles' class='btn btn-orange btn-lg'>Get Started →</a>");
            out.println("      <a href='/login?role=student' class='btn btn-white btn-lg' style='margin-left:12px;'>Student Portal</a>");
            out.println("    </div>");
            out.println("  </div>");

            // Role Selection Section
            out.println("  <div id='roles' class='section-container'>");
            out.println("    <div style='text-align:center; margin-bottom: 32px;'>");
            out.println("      <h2 style='font-size:24px; color:#1E1B16; margin-bottom:8px;'>Choose how you'd like to sign in</h2>");
            out.println("      <p style='color:#6B6560; font-size:14px; margin:0;'>Select your role to initialize your authenticated dining session</p>");
            out.println("    </div>");

            out.println("    <div class='role-grid'>");

            // Student Card
            out.println("      <a href='/login?role=student' class='role-card'>");
            out.println("        <div class='role-icon icon-student'>🎓</div>");
            out.println("        <h3 class='role-name'>Student</h3>");
            out.println("        <p class='role-desc'>Order meals, track live queue tokens, pre-order tomorrow's specials, and manage your 9,000 monthly credits.</p>");
            out.println("        <div class='role-footer'><span style='color:#FF6B35;'>Student Portal</span> <span>→</span></div>");
            out.println("      </a>");

            // Chef Card
            out.println("      <a href='/login?role=chef' class='role-card'>");
            out.println("        <div class='role-icon icon-chef'>👨‍🍳</div>");
            out.println("        <h3 class='role-name'>Chef</h3>");
            out.println("        <p class='role-desc'>Manage live kitchen FIFO queues, progress order statuses, toggle menu stock, and log food wastage.</p>");
            out.println("        <div class='role-footer'><span style='color:#EA580C;'>Kitchen Queue</span> <span>→</span></div>");
            out.println("      </a>");

            // Warden Card
            out.println("      <a href='/login?role=warden' class='role-card'>");
            out.println("        <div class='role-icon icon-warden'>🏢</div>");
            out.println("        <h3 class='role-name'>Warden</h3>");
            out.println("        <p class='role-desc'>Review and approve or reject student sick-leave room delivery requests for your assigned hostel block.</p>");
            out.println("        <div class='role-footer'><span style='color:#D97706;'>Warden Portal</span> <span>→</span></div>");
            out.println("      </a>");

            // Admin Card
            out.println("      <a href='/login?role=admin' class='role-card'>");
            out.println("        <div class='role-icon icon-admin'>👑</div>");
            out.println("        <h3 class='role-name'>Admin</h3>");
            out.println("        <p class='role-desc'>Oversee campus analytics, top 5 dishes leaderboard, execute 1-click 9,000 credit resets, and audit logs.</p>");
            out.println("        <div class='role-footer'><span style='color:#C2410C;'>Admin Analytics</span> <span>→</span></div>");
            out.println("      </a>");

            out.println("    </div>");
            out.println("  </div>");

            // Sustainability Teaser
            SustainabilityMetrics metrics = messService.getSustainabilityMetrics();
            out.println("  <div class='impact-strip'>");
            out.println("    🌱 <strong>Campus Sustainability Impact:</strong> " + String.format("%.1f", metrics.getFoodSavedKg()) + " kg food waste avoided • " + String.format("%.1f", metrics.getCo2AvoidedKg()) + " kg CO₂ emissions prevented • deterministic next-day pre-orders.");
            out.println("  </div>");

            out.println("  <footer class='site-footer'>");
            out.println("    SmartMess Campus Platform • 100% Pure Java (Java Servlets &amp; JDBC) • No JavaScript Frameworks");
            out.println("  </footer>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // =========================================================================
    // 2. ROLE-SPECIFIC DISTINCT SIGN-IN PAGES (/login?role=<student|chef|warden|admin>)
    // =========================================================================

    private void renderLoginPage(HttpServletRequest req, HttpServletResponse resp, String role, String error, String msg) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            if ("chef".equalsIgnoreCase(role)) {
                renderChefLoginPage(out, error, msg);
            } else if ("warden".equalsIgnoreCase(role)) {
                renderWardenLoginPage(out, error, msg);
            } else if ("admin".equalsIgnoreCase(role)) {
                renderAdminLoginPage(out, error, msg);
            } else {
                renderStudentLoginPage(out, error, msg);
            }
        }
    }

    // -------------------------------------------------------------------------
    // 2A. STUDENT RESIDENT SIGN-IN PAGE
    // -------------------------------------------------------------------------
    private void renderStudentLoginPage(PrintWriter out, String error, String msg) {
        out.println("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<title>Student Resident Sign In - SmartMess</title>");
        out.println(getCommonStyles());
        out.println("</head><body style='background:#FAF8F5;'>");
        out.println("  <header class='site-header'>");
        out.println("    <div class='logo'>Smart<span class='accent'>Mess</span></div>");
        out.println("    <a href='/' class='link-back'>← Change role</a>");
        out.println("  </header>");

        out.println("  <div class='auth-container'>");
        out.println("    <div class='auth-card' style='border: 2px solid #FF6B35; box-shadow: 0 10px 30px rgba(255, 107, 53, 0.15);'>");
        out.println("      <div class='auth-card-header'>");
        out.println("        <div class='role-avatar icon-student' style='width:56px; height:56px; font-size:28px;'>🎓</div>");
        out.println("        <h2 style='font-size:24px; color:#1E1B16; margin:8px 0 4px;'>Student Resident Portal</h2>");
        out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Order meals, track orders via live FIFO stepper, &amp; manage 9,000 monthly credits</p>");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>✅ " + escapeHtml(msg) + "</div>");

        out.println("      <div class='tab-switcher'>");
        out.println("        <button type='button' id='tabBtnPassword' class='tab-btn active' onclick='switchStudentTab(\"password\")'>VIT Email &amp; Password</button>");
        out.println("        <button type='button' id='tabBtnOtp' class='tab-btn' onclick='switchStudentTab(\"otp\")'>Mobile OTP Login</button>");
        out.println("      </div>");

        // Tab 1: Email + Password Form
        out.println("      <form id='formPassword' method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='student'>");
        out.println("        <input type='hidden' name='auth_method' value='password'>");
        out.println("        <div class='form-group'>");
        out.println("          <label>VIT Student Email <span class='req'>*</span></label>");
        out.println("          <input type='email' id='studentEmail' name='email' placeholder='name.regno@vitstudent.ac.in' required pattern='.+@vitstudent\\.ac\\.in' value='rohit.kundu2022@vitstudent.ac.in'>");
        out.println("          <div style='font-size:11px; color:#6B6560; margin-top:2px;'>Must end with @vitstudent.ac.in</div>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("            <label>Password <span class='req'>*</span></label>");
        out.println("            <a href='/forgot-password' class='link-muted' style='font-size:12px;'>Forgot password?</a>");
        out.println("          </div>");
        out.println("          <div class='pwd-wrapper'>");
        out.println("            <input type='password' id='studentPwd' name='password' minlength='8' required value='Student@123'>");
        out.println("            <button type='button' class='pwd-toggle' onclick='togglePwdVisibility(\"studentPwd\", this)'>👁️</button>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In as Student</button>");
        out.println("        <div style='text-align:center; margin-top:16px; font-size:13px; color:#6B6560;'>");
        out.println("          New student? <a href='/register' style='color:#FF6B35; font-weight:600;'>Register here (+9,000 Credits)</a>");
        out.println("        </div>");
        out.println("      </form>");

        // Tab 2: Mobile OTP Form
        out.println("      <form id='formOtp' method='POST' action='/login' style='display:none;'>");
        out.println("        <input type='hidden' name='role' value='student'>");
        out.println("        <input type='hidden' name='auth_method' value='otp'>");
        out.println("        <div class='form-group'>");
        out.println("          <label>Registered Mobile Number <span class='req'>*</span></label>");
        out.println("          <div style='display:flex; gap:8px;'>");
        out.println("            <input type='tel' id='otpPhone' name='phone' placeholder='+91 9876543210' required style='flex:1;' value='+91 9876543210'>");
        out.println("            <button type='button' id='sendOtpBtn' class='btn btn-white' onclick='triggerSendOtp()'>Send OTP</button>");
        out.println("          </div>");
        out.println("          <div id='otpNotice' style='font-size:12px; color:#10b981; margin-top:4px; display:none;'></div>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <label>6-Digit Verification Code <span class='req'>*</span></label>");
        out.println("          <input type='text' id='otpCode' name='otp' placeholder='Enter 6-digit code' maxlength='6' pattern='[0-9]{6}' required value='123456'>");
        out.println("          <div style='font-size:11px; color:#6B6560; margin-top:3px;'>Simulated code: 123456 (Expires in 5 minutes)</div>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Verify OTP &amp; Sign In</button>");
        out.println("      </form>");

        // Demo credentials chip
        out.println("      <div style='margin-top:20px; padding:10px; background:#FFF7F0; border-radius:8px; border:1px dashed #FFD9C4; text-align:center;'>");
        out.println("        <span style='font-size:12px; color:#6B6560;'>Quick Demo Fill: </span>");
        out.println("        <button type='button' onclick='fillStudentDemo()' style='border:none; background:#FF6B35; color:white; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:4px; cursor:pointer;'>Rohit Kundu (Student@123)</button>");
        out.println("      </div>");

        out.println("    </div></div>");
        renderAuthScripts(out);
        out.println("</body></html>");
    }

    // -------------------------------------------------------------------------
    // 2B. CHEF / MESS KITCHEN STAFF SIGN-IN PAGE
    // -------------------------------------------------------------------------
    private void renderChefLoginPage(PrintWriter out, String error, String msg) {
        out.println("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<title>Chef &amp; Kitchen Staff Portal - SmartMess</title>");
        out.println(getCommonStyles());
        out.println("</head><body style='background:#0f172a;'>");
        out.println("  <header class='site-header' style='background:#1e293b; border-color:#334155;'>");
        out.println("    <div class='logo' style='color:#f8fafc;'>Smart<span style='color:#EA580C;'>Mess</span> <span style='font-size:13px; color:#94a3b8; font-weight:normal;'>| Kitchen Staff</span></div>");
        out.println("    <a href='/' class='link-back' style='color:#94a3b8;'>← Change role</a>");
        out.println("  </header>");

        out.println("  <div class='auth-container'>");
        out.println("    <div class='auth-card' style='background:#1e293b; border: 2px solid #EA580C; box-shadow: 0 10px 30px rgba(234, 88, 12, 0.3); color:#f8fafc;'>");
        out.println("      <div class='auth-card-header'>");
        out.println("        <div class='role-avatar' style='background:#2a1508; color:#EA580C; border:1px solid #7c2d12; width:56px; height:56px; font-size:28px;'>👨‍🍳</div>");
        out.println("        <h2 style='font-size:24px; color:#f8fafc; margin:8px 0 4px;'>Chef &amp; Kitchen Staff Console</h2>");
        out.println("        <p style='color:#94a3b8; font-size:13px; margin:0;'>Live FIFO cooking queue, menu inventory toggling &amp; daily food waste audit</p>");
        out.println("      </div>");

        // Kitchen Station Operational Badge
        out.println("      <div style='background:rgba(234, 88, 12, 0.15); border:1px solid #EA580C; padding:10px 14px; border-radius:8px; margin-bottom:16px; color:#fdba74; font-size:12px;'>");
        out.println("        🔥 <strong>Kitchen Station:</strong> Central Mess Main Kitchen • Mode: Active Dispatch");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>✅ " + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='chef'>");
        out.println("        <div class='form-group'>");
        out.println("          <label style='color:#cbd5e1;'>Authorized Kitchen Staff Email <span class='req'>*</span></label>");
        out.println("          <input type='email' id='chefEmail' name='email' style='background:#0f172a; color:#f8fafc; border-color:#475569;' required value='chef.campus@vit.ac.in'>");
        out.println("          <div style='font-size:11px; color:#94a3b8; margin-top:2px;'>Restricted to designated CHEF_EMAIL (chef.campus@vit.ac.in)</div>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("            <label style='color:#cbd5e1;'>Kitchen Master Password <span class='req'>*</span></label>");
        out.println("            <a href='/forgot-password' style='color:#fdba74; font-size:12px;'>Forgot?</a>");
        out.println("          </div>");
        out.println("          <div class='pwd-wrapper'>");
        out.println("            <input type='password' id='chefPwd' name='password' minlength='8' style='background:#0f172a; color:#f8fafc; border-color:#475569;' required value='Chef@123'>");
        out.println("            <button type='button' class='pwd-toggle' style='color:#94a3b8;' onclick='togglePwdVisibility(\"chefPwd\", this)'>👁️</button>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block' style='background:#EA580C;'>Sign In to Kitchen Queue →</button>");
        out.println("      </form>");

        // Demo credentials chip
        out.println("      <div style='margin-top:20px; padding:10px; background:#0f172a; border-radius:8px; border:1px dashed #475569; text-align:center;'>");
        out.println("        <span style='font-size:12px; color:#94a3b8;'>Quick Demo Fill: </span>");
        out.println("        <button type='button' onclick='fillChefDemo()' style='border:none; background:#EA580C; color:white; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:4px; cursor:pointer;'>Head Chef Vikram (Chef@123)</button>");
        out.println("      </div>");

        out.println("    </div></div>");
        renderAuthScripts(out);
        out.println("</body></html>");
    }

    // -------------------------------------------------------------------------
    // 2C. HOSTEL WARDEN SIGN-IN PAGE
    // -------------------------------------------------------------------------
    private void renderWardenLoginPage(PrintWriter out, String error, String msg) {
        out.println("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<title>Hostel Warden Administration Portal - SmartMess</title>");
        out.println(getCommonStyles());
        out.println("</head><body style='background:#091224;'>");
        out.println("  <header class='site-header' style='background:#0f172a; border-color:#1e293b;'>");
        out.println("    <div class='logo' style='color:#f8fafc;'>Smart<span style='color:#0284C7;'>Mess</span> <span style='font-size:13px; color:#94a3b8; font-weight:normal;'>| Hostel Warden Portal</span></div>");
        out.println("    <a href='/' class='link-back' style='color:#94a3b8;'>← Change role</a>");
        out.println("  </header>");

        out.println("  <div class='auth-container'>");
        out.println("    <div class='auth-card' style='background:#0f172a; border: 2px solid #0284C7; box-shadow: 0 10px 30px rgba(2, 132, 199, 0.3); color:#f8fafc;'>");
        out.println("      <div class='auth-card-header'>");
        out.println("        <div class='role-avatar' style='background:#0c2338; color:#0284C7; border:1px solid #0369a1; width:56px; height:56px; font-size:28px;'>🏢</div>");
        out.println("        <h2 style='font-size:24px; color:#f8fafc; margin:8px 0 4px;'>Hostel Warden Portal</h2>");
        out.println("        <p style='color:#94a3b8; font-size:13px; margin:0;'>Student sick-leave quarantine &amp; in-room meal delivery authorizations</p>");
        out.println("      </div>");

        // Hostel Directorate Banner
        out.println("      <div style='background:rgba(2, 132, 199, 0.15); border:1px solid #0284C7; padding:10px 14px; border-radius:8px; margin-bottom:16px; color:#bae6fd; font-size:12px;'>");
        out.println("        🏥 <strong>Directorate:</strong> Hostel Residential Health Care &amp; Sick Leave Verification");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>✅ " + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='warden'>");
        out.println("        <div class='form-group'>");
        out.println("          <label style='color:#cbd5e1;'>Assigned Hostel Block <span class='req'>*</span></label>");
        out.println("          <select name='hostelBlock' id='wardenBlock' style='width:100%; padding:10px 12px; background:#1e293b; color:#f8fafc; border:1px solid #475569; border-radius:8px;'>");
        out.println("            <option value='Block B'>Block B (Boys Hostel - Dr. S. Raman)</option>");
        out.println("            <option value='Block C'>Block C (Boys Hostel - Prof. Priya Nair)</option>");
        out.println("            <option value='Block A'>Block A (Girls Hostel - Mr. K. Varma)</option>");
        out.println("          </select>");
        out.println("          <div style='font-size:11px; color:#94a3b8; margin-top:2px;'>You will strictly inspect room delivery requests for this block</div>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <label style='color:#cbd5e1;'>Official Institutional Email <span class='req'>*</span></label>");
        out.println("          <input type='email' id='wardenEmail' name='email' style='background:#1e293b; color:#f8fafc; border-color:#475569;' required value='warden.blockb@vit.ac.in'>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("            <label style='color:#cbd5e1;'>Warden Access Password <span class='req'>*</span></label>");
        out.println("            <a href='/forgot-password' style='color:#38bdf8; font-size:12px;'>Forgot?</a>");
        out.println("          </div>");
        out.println("          <div class='pwd-wrapper'>");
        out.println("            <input type='password' id='wardenPwd' name='password' minlength='8' style='background:#1e293b; color:#f8fafc; border-color:#475569;' required value='Warden@123'>");
        out.println("            <button type='button' class='pwd-toggle' style='color:#94a3b8;' onclick='togglePwdVisibility(\"wardenPwd\", this)'>👁️</button>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block' style='background:#0284C7;'>Sign In as Warden →</button>");
        out.println("      </form>");

        // Demo credentials chip
        out.println("      <div style='margin-top:20px; padding:10px; background:#1e293b; border-radius:8px; border:1px dashed #475569; text-align:center;'>");
        out.println("        <span style='font-size:12px; color:#94a3b8;'>Quick Demo Fill: </span>");
        out.println("        <button type='button' onclick='fillWardenDemo()' style='border:none; background:#0284C7; color:white; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:4px; cursor:pointer;'>Dr. Ramanathan (Block B - Warden@123)</button>");
        out.println("      </div>");

        out.println("    </div></div>");
        renderAuthScripts(out);
        out.println("</body></html>");
    }

    // -------------------------------------------------------------------------
    // 2D. CAMPUS MESS EXECUTIVE ADMINISTRATION SIGN-IN PAGE
    // -------------------------------------------------------------------------
    private void renderAdminLoginPage(PrintWriter out, String error, String msg) {
        out.println("<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<title>Campus Mess Executive Administration - SmartMess</title>");
        out.println(getCommonStyles());
        out.println("</head><body style='background:#12071f;'>");
        out.println("  <header class='site-header' style='background:#1e1b4b; border-color:#2e1065;'>");
        out.println("    <div class='logo' style='color:#f8fafc;'>Smart<span style='color:#C026D3;'>Mess</span> <span style='font-size:13px; color:#c084fc; font-weight:normal;'>| Executive Administration</span></div>");
        out.println("    <a href='/' class='link-back' style='color:#c084fc;'>← Change role</a>");
        out.println("  </header>");

        out.println("  <div class='auth-container'>");
        out.println("    <div class='auth-card' style='background:#1e1b4b; border: 2px solid #9333EA; box-shadow: 0 10px 30px rgba(147, 51, 234, 0.35); color:#f8fafc;'>");
        out.println("      <div class='auth-card-header'>");
        out.println("        <div class='role-avatar' style='background:#2e1065; color:#C026D3; border:1px solid #7e22ce; width:56px; height:56px; font-size:28px;'>👑</div>");
        out.println("        <h2 style='font-size:24px; color:#f8fafc; margin:8px 0 4px;'>Executive Mess Administration</h2>");
        out.println("        <p style='color:#c084fc; font-size:13px; margin:0;'>Campus telemetry analytics, 1-click 9,000 credit reset &amp; security audit log</p>");
        out.println("      </div>");

        // Security Clearance Banner
        out.println("      <div style='background:rgba(147, 51, 234, 0.15); border:1px solid #9333EA; padding:10px 14px; border-radius:8px; margin-bottom:16px; color:#e9d5ff; font-size:12px;'>");
        out.println("        🛡️ <strong>Clearance:</strong> Level 4 Root Authority • Campus Mess Executive Committee");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>✅ " + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='admin'>");
        out.println("        <div class='form-group'>");
        out.println("          <label style='color:#e9d5ff;'>Administrator Master Email <span class='req'>*</span></label>");
        out.println("          <input type='email' id='adminEmail' name='email' style='background:#0f0926; color:#f8fafc; border-color:#6b21a8;' required value='admin.mess@vit.ac.in'>");
        out.println("          <div style='font-size:11px; color:#c084fc; margin-top:2px;'>Restricted to designated ADMIN_EMAIL (admin.mess@vit.ac.in)</div>");
        out.println("        </div>");
        out.println("        <div class='form-group'>");
        out.println("          <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("            <label style='color:#e9d5ff;'>Executive Master Password <span class='req'>*</span></label>");
        out.println("            <a href='/forgot-password' style='color:#e879f9; font-size:12px;'>Forgot?</a>");
        out.println("          </div>");
        out.println("          <div class='pwd-wrapper'>");
        out.println("            <input type='password' id='adminPwd' name='password' minlength='8' style='background:#0f0926; color:#f8fafc; border-color:#6b21a8;' required value='Admin@123'>");
        out.println("            <button type='button' class='pwd-toggle' style='color:#c084fc;' onclick='togglePwdVisibility(\"adminPwd\", this)'>👁️</button>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block' style='background:#9333EA;'>Sign In to Executive Console →</button>");
        out.println("      </form>");

        // Demo credentials chip
        out.println("      <div style='margin-top:20px; padding:10px; background:#0f0926; border-radius:8px; border:1px dashed #6b21a8; text-align:center;'>");
        out.println("        <span style='font-size:12px; color:#c084fc;'>Quick Demo Fill: </span>");
        out.println("        <button type='button' onclick='fillAdminDemo()' style='border:none; background:#9333EA; color:white; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:4px; cursor:pointer;'>Mess Committee Admin (Admin@123)</button>");
        out.println("      </div>");

        out.println("    </div></div>");
        renderAuthScripts(out);
        out.println("</body></html>");
    }

    private void renderAuthScripts(PrintWriter out) {
        out.println("  <script>");
        out.println("    function switchStudentTab(tab) {");
        out.println("      var formPwd = document.getElementById('formPassword');");
        out.println("      var formOtp = document.getElementById('formOtp');");
        out.println("      var btnPwd = document.getElementById('tabBtnPassword');");
        out.println("      var btnOtp = document.getElementById('tabBtnOtp');");
        out.println("      if (tab === 'otp') {");
        out.println("        formPwd.style.display = 'none'; formOtp.style.display = 'block';");
        out.println("        btnPwd.classList.remove('active'); btnOtp.classList.add('active');");
        out.println("      } else {");
        out.println("        formPwd.style.display = 'block'; formOtp.style.display = 'none';");
        out.println("        btnOtp.classList.remove('active'); btnPwd.classList.add('active');");
        out.println("      }");
        out.println("    }");
        out.println("    function togglePwdVisibility(inputId, btn) {");
        out.println("      var input = document.getElementById(inputId);");
        out.println("      if (input.type === 'password') { input.type = 'text'; btn.innerText = '🔒'; }");
        out.println("      else { input.type = 'password'; btn.innerText = '👁️'; }");
        out.println("    }");
        out.println("    function fillStudentDemo() {");
        out.println("      document.getElementById('studentEmail').value = 'rohit.kundu2022@vitstudent.ac.in';");
        out.println("      document.getElementById('studentPwd').value = 'Student@123';");
        out.println("    }");
        out.println("    function fillChefDemo() {");
        out.println("      document.getElementById('chefEmail').value = 'chef.campus@vit.ac.in';");
        out.println("      document.getElementById('chefPwd').value = 'Chef@123';");
        out.println("    }");
        out.println("    function fillWardenDemo() {");
        out.println("      document.getElementById('wardenEmail').value = 'warden.blockb@vit.ac.in';");
        out.println("      document.getElementById('wardenPwd').value = 'Warden@123';");
        out.println("      document.getElementById('wardenBlock').value = 'Block B';");
        out.println("    }");
        out.println("    function fillAdminDemo() {");
        out.println("      document.getElementById('adminEmail').value = 'admin.mess@vit.ac.in';");
        out.println("      document.getElementById('adminPwd').value = 'Admin@123';");
        out.println("    }");
        out.println("    function triggerSendOtp() {");
        out.println("      var phone = document.getElementById('otpPhone').value;");
        out.println("      var btn = document.getElementById('sendOtpBtn');");
        out.println("      var notice = document.getElementById('otpNotice');");
        out.println("      notice.style.display = 'block'; notice.innerText = 'Sending 6-digit OTP...';");
        out.println("      fetch('/api/java/auth', {");
        out.println("        method: 'POST', headers: { 'Content-Type': 'application/json' },");
        out.println("        body: JSON.stringify({ action: 'send_mobile_otp', phone: phone })");
        out.println("      }).then(r => r.json()).then(data => {");
        out.println("        notice.innerText = data.message;");
        out.println("        var sec = data.countdown || 60;");
        out.println("        btn.disabled = true;");
        out.println("        var timer = setInterval(function() {");
        out.println("          sec--; btn.innerText = 'Resend in ' + sec + 's';");
        out.println("          if (sec <= 0) { clearInterval(timer); btn.disabled = false; btn.innerText = 'Send OTP'; }");
        out.println("        }, 1000);");
        out.println("      });");
        out.println("    }");
        out.println("  </script>");
    }

    // =========================================================================
    // 3. STUDENT REGISTRATION PAGE (/register)
    // =========================================================================

    private void renderRegisterPage(HttpServletRequest req, HttpServletResponse resp, String error) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            out.println("<!DOCTYPE html>");
            out.println("<html lang='en'>");
            out.println("<head>");
            out.println("  <meta charset='UTF-8'>");
            out.println("  <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            out.println("  <title>Student Registration - SmartMess</title>");
            out.println(getCommonStyles());
            out.println("</head>");
            out.println("<body>");

            out.println("  <header class='site-header'>");
            out.println("    <div class='logo'>Smart<span class='accent'>Mess</span></div>");
            out.println("    <a href='/login?role=student' class='link-back'>← Back to Sign In</a>");
            out.println("  </header>");

            out.println("  <div class='auth-container'>");
            out.println("    <div class='auth-card' style='max-width:480px;'>");

            out.println("      <div class='auth-card-header'>");
            out.println("        <div class='role-avatar icon-student'>🎓</div>");
            out.println("        <h2 style='font-size:22px; color:#1E1B16; margin:8px 0 4px;'>Create Student Account</h2>");
            out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Initializes 9,000 monthly dining credits upon registration</p>");
            out.println("      </div>");

            if (error != null && !error.isEmpty()) {
                out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
            }

            out.println("      <form method='POST' action='/register'>");

            out.println("        <div class='form-group'>");
            out.println("          <label>Full Student Name <span class='req'>*</span></label>");
            out.println("          <input type='text' name='name' placeholder='e.g. Rohit Kundu' required>");
            out.println("        </div>");

            out.println("        <div class='form-group'>");
            out.println("          <label>VIT Student Email <span class='req'>*</span></label>");
            out.println("          <input type='email' name='email' placeholder='name.regno@vitstudent.ac.in' required pattern='.+@vitstudent\\.ac\\.in'>");
            out.println("          <div style='font-size:11px; color:#6B6560; margin-top:2px;'>Strict requirement: Must end with @vitstudent.ac.in</div>");
            out.println("        </div>");

            out.println("        <div class='form-group'>");
            out.println("          <label>Mobile Number (+91) <span class='req'>*</span></label>");
            out.println("          <input type='tel' name='phone' placeholder='+91 9876543210' required>");
            out.println("        </div>");

            out.println("        <div class='form-group'>");
            out.println("          <label>Hostel Room Number <span class='req'>*</span></label>");
            out.println("          <input type='text' name='room' placeholder='e.g. Block B - Room 304' required>");
            out.println("        </div>");

            out.println("        <div class='form-group'>");
            out.println("          <label>Password (Minimum 8 characters) <span class='req'>*</span></label>");
            out.println("          <input type='password' name='password' minlength='8' required>");
            out.println("        </div>");

            out.println("        <div class='form-group'>");
            out.println("          <label>Confirm Password <span class='req'>*</span></label>");
            out.println("          <input type='password' name='confirmPassword' minlength='8' required>");
            out.println("        </div>");

            out.println("        <button type='submit' class='btn btn-orange btn-block'>Register &amp; Claim 9,000 Credits</button>");

            out.println("        <div style='text-align:center; margin-top:16px; font-size:13px; color:#6B6560;'>");
            out.println("          Already registered? <a href='/login?role=student' style='color:#FF6B35; font-weight:600;'>Sign in here</a>");
            out.println("        </div>");

            out.println("      </form>");

            out.println("    </div>");
            out.println("  </div>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // =========================================================================
    // 4. FORGOT PASSWORD PAGE (/forgot-password)
    // =========================================================================

    private void renderForgotPasswordPage(HttpServletRequest req, HttpServletResponse resp, String error, String msg, String step, String email) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        boolean isStep2 = "2".equals(step);

        try (PrintWriter out = resp.getWriter()) {
            out.println("<!DOCTYPE html>");
            out.println("<html lang='en'>");
            out.println("<head>");
            out.println("  <meta charset='UTF-8'>");
            out.println("  <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            out.println("  <title>Reset Password - SmartMess</title>");
            out.println(getCommonStyles());
            out.println("</head>");
            out.println("<body>");

            out.println("  <header class='site-header'>");
            out.println("    <div class='logo'>Smart<span class='accent'>Mess</span></div>");
            out.println("    <a href='/' class='link-back'>← Back to Home</a>");
            out.println("  </header>");

            out.println("  <div class='auth-container'>");
            out.println("    <div class='auth-card'>");

            out.println("      <div class='auth-card-header'>");
            out.println("        <div class='role-avatar' style='background:#FFF7F0; color:#FF6B35;'>🔑</div>");
            out.println("        <h2 style='font-size:22px; color:#1E1B16; margin:8px 0 4px;'>Reset Password</h2>");
            out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Single-use 10-minute verification code via email</p>");
            out.println("      </div>");

            if (error != null && !error.isEmpty()) {
                out.println("      <div class='alert alert-error'>⚠️ " + escapeHtml(error) + "</div>");
            }
            if (msg != null && !msg.isEmpty()) {
                out.println("      <div class='alert alert-success'>✅ " + escapeHtml(msg) + "</div>");
            }

            if (!isStep2) {
                // Step 1: Request OTP
                out.println("      <form method='POST' action='/forgot-password'>");
                out.println("        <input type='hidden' name='action' value='send_otp'>");

                out.println("        <div class='form-group'>");
                out.println("          <label>Account Email <span class='req'>*</span></label>");
                out.println("          <input type='email' name='email' placeholder='Enter your account email' required value='" + (email != null ? escapeHtml(email) : "") + "'>");
                out.println("        </div>");

                out.println("        <button type='submit' class='btn btn-orange btn-block'>Send 6-Digit Reset Code</button>");
                out.println("      </form>");
            } else {
                // Step 2: Verify OTP and Set New Password
                out.println("      <form method='POST' action='/forgot-password'>");
                out.println("        <input type='hidden' name='action' value='reset'>");
                out.println("        <input type='hidden' name='email' value='" + (email != null ? escapeHtml(email) : "") + "'>");

                out.println("        <div class='form-group'>");
                out.println("          <label>6-Digit Verification Code <span class='req'>*</span></label>");
                out.println("          <input type='text' name='otp' placeholder='Enter 6-digit code' maxlength='6' required>");
                out.println("          <div style='font-size:11px; color:#6B6560; margin-top:2px;'>Simulation code: 784912 (expires in 10 minutes)</div>");
                out.println("        </div>");

                out.println("        <div class='form-group'>");
                out.println("          <label>New Password (min 8 characters) <span class='req'>*</span></label>");
                out.println("          <input type='password' name='newPassword' minlength='8' required>");
                out.println("        </div>");

                out.println("        <div class='form-group'>");
                out.println("          <label>Confirm New Password <span class='req'>*</span></label>");
                out.println("          <input type='password' name='confirmPassword' minlength='8' required>");
                out.println("        </div>");

                out.println("        <button type='submit' class='btn btn-orange btn-block'>Save New Password</button>");
                out.println("      </form>");
            }

            out.println("      <div style='text-align:center; margin-top:16px; font-size:13px;'>");
            out.println("        <a href='/login?role=student' style='color:#FF6B35; font-weight:600;'>← Return to Sign In</a>");
            out.println("      </div>");

            out.println("    </div>");
            out.println("  </div>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // =========================================================================
    // 5. ROLE-GUARDED DASHBOARDS (/dashboard?role=...)
    // =========================================================================

    private void renderDashboard(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session, String msg, String error) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        String role = session.role;

        try (PrintWriter out = resp.getWriter()) {
            out.println("<!DOCTYPE html>");
            out.println("<html lang='en'>");
            out.println("<head>");
            out.println("  <meta charset='UTF-8'>");
            out.println("  <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            out.println("  <title>" + capitalize(role) + " Dashboard - SmartMess</title>");
            out.println(getCommonStyles());
            out.println("</head>");
            out.println("<body>");

            // Top Authenticated Navigation Header
            out.println("  <header class='site-header'>");
            out.println("    <div class='logo'>Smart<span class='accent'>Mess</span></div>");
            out.println("    <div class='user-nav'>");
            out.println("      <div class='user-badge'>");
            out.println("        <span>" + getRoleIcon(role) + " " + escapeHtml(session.name) + " (" + capitalize(role) + ")</span>");
            out.println("      </div>");
            out.println("      <a href='/logout' class='btn btn-white btn-sm'>Sign Out</a>");
            out.println("    </div>");
            out.println("  </header>");

            out.println("  <div class='container'>");

            if (msg != null && !msg.isEmpty()) {
                out.println("    <div class='alert alert-success' style='margin-top:20px;'>✅ " + escapeHtml(msg) + "</div>");
            }
            if (error != null && !error.isEmpty()) {
                out.println("    <div class='alert alert-error' style='margin-top:20px;'>⚠️ " + escapeHtml(error) + "</div>");
            }

            if ("student".equalsIgnoreCase(role)) {
                renderStudentDashboard(out, session);
            } else if ("chef".equalsIgnoreCase(role)) {
                renderChefDashboard(out, session);
            } else if ("warden".equalsIgnoreCase(role)) {
                renderWardenDashboard(out, session);
            } else if ("admin".equalsIgnoreCase(role)) {
                renderAdminDashboard(out, session);
            }

            out.println("  </div>");

            out.println("  <footer class='site-footer'>");
            out.println("    SmartMess Campus Platform • 100% Pure Java Servlets Runtime • Review 2");
            out.println("  </footer>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // -------------------------------------------------------------------------
    // STUDENT DASHBOARD
    // -------------------------------------------------------------------------
    private void renderStudentDashboard(PrintWriter out, SecurityService.Session session) {
        Student student = messService.getStudentProfile(session.userId);
        int credits = student != null ? student.getRemainingCredits() : 9000;
        String room = student != null ? student.getHostelRoom() : session.extra;

        // Student Stats Banner
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px;'>Welcome, " + escapeHtml(session.name) + "</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Hostel Room: <strong>" + escapeHtml(room != null ? room : "Block B - Room 304") + "</strong> | Strict VIT Email: <strong>" + escapeHtml(session.email) + "</strong></p>");
        out.println("        </div>");
        out.println("        <div style='display:flex; gap:16px; align-items:center;'>");
        out.println("          <div style='text-align:right;'>");
        out.println("            <div style='font-size:12px; color:#6B6560;'>Wallet Balance</div>");
        out.println("            <div style='font-size:24px; font-weight:bold; color:#10b981;'>" + credits + " Credits</div>");
        out.println("          </div>");
        out.println("          <form method='POST' action='/action/topup' style='margin:0;'>");
        out.println("            <input type='hidden' name='amount' value='500'>");
        out.println("            <button type='submit' class='btn btn-orange btn-sm'>+500 Cr (Razorpay)</button>");
        out.println("          </form>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // Stepper: Active Order Tracking (with Cancel Order when Pending)
        out.println("    <div class='dash-card'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;'>");
        out.println("        <h3 style='margin:0; font-size:16px;'>📱 Real-Time Kitchen Order Stepper</h3>");
        out.println("        <span class='badge badge-orange'>Active Order: TK-8472</span>");
        out.println("      </div>");

        out.println("      <div class='stepper-row'>");
        out.println("        <div class='step-node step-active'>1. PENDING ⏳</div>");
        out.println("        <div class='step-arrow'>──▶</div>");
        out.println("        <div class='step-node'>2. PREPARING 🍳</div>");
        out.println("        <div class='step-arrow'>──▶</div>");
        out.println("        <div class='step-node'>3. READY 🔔</div>");
        out.println("        <div class='step-arrow'>──▶</div>");
        out.println("        <div class='step-node'>4. COMPLETED ✅</div>");
        out.println("      </div>");

        out.println("      <div style='margin-top:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;'>");
        out.println("        <div style='font-size:12px; color:#6B6560;'>Order #101 • 1x Paneer Butter Masala &amp; Roti • Total: 120 Credits</div>");
        out.println("        <form method='POST' action='/action/cancel-order' style='margin:0;'>");
        out.println("          <input type='hidden' name='orderId' value='101'>");
        out.println("          <button type='submit' class='btn btn-danger btn-sm'>❌ Cancel Order (Allowed while Pending)</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Next-Day Pre-Order Booking Banner
        out.println("    <div class='dash-card' style='border:1px solid #F59E0B; background:#FFFDF7;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:16px; color:#B45309;'>⭐ Tomorrow's Chef Special: Royal Biryani (Zero Waste Hub)</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:12px; color:#92400E;'>Book before 22:00 tonight to guarantee your reserved meal portion.</p>");
        out.println("        </div>");
        out.println("        <form method='POST' action='/action/book-preorder' style='margin:0;'>");
        out.println("          <input type='hidden' name='itemId' value='12'>");
        out.println("          <input type='hidden' name='dishName' value='Chef Weekend Royal Biryani'>");
        out.println("          <button type='submit' class='btn btn-orange'>Book Pre-Order (PRE-Token)</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Cafeteria Menu Table
        List<MenuItem> items = messService.getCatalog().getAllItems();
        out.println("    <div class='dash-card'>");
        out.println("      <h3 style='margin:0 0 14px; font-size:16px;'>🍽️ Cafeteria Menu &amp; Ordering</h3>");
        out.println("      <table class='data-table'>");
        out.println("        <thead>");
        out.println("          <tr><th>ID</th><th>Dish Name</th><th>Category</th><th>Price</th><th>Calories</th><th>Portions Left</th><th>Action</th></tr>");
        out.println("        </thead>");
        out.println("        <tbody>");
        for (MenuItem item : items) {
            out.println("          <tr>");
            out.println("            <td>" + item.getItemId() + "</td>");
            out.println("            <td><strong>" + escapeHtml(item.getItemName()) + "</strong> " + (item.isHealthy() ? "<span class='badge badge-green'>Healthy Diet</span>" : "") + "</td>");
            out.println("            <td>" + escapeHtml(item.getCategory()) + "</td>");
            out.println("            <td>" + item.getPrice() + " Cr</td>");
            out.println("            <td>" + (item.getCalories() != null ? item.getCalories() + " kcal" : "-") + "</td>");
            out.println("            <td>" + item.getAvailableQuantity() + " left</td>");
            out.println("            <td>");
            out.println("              <form method='POST' action='/action/order' style='margin:0;'>");
            out.println("                <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                <button type='submit' class='btn btn-orange btn-sm'>Add &amp; Order</button>");
            out.println("              </form>");
            out.println("            </td>");
            out.println("          </tr>");
        }
        out.println("        </tbody>");
        out.println("      </table>");
        out.println("    </div>");
    }

    // -------------------------------------------------------------------------
    // CHEF DASHBOARD
    // -------------------------------------------------------------------------
    private void renderChefDashboard(PrintWriter out, SecurityService.Session session) {
        List<BaseOrder> orders = messService.getPendingKitchenOrders();

        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px;'>👨‍🍳 Kitchen Live Queue &amp; Stock Operations</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Logged in as: <strong>" + escapeHtml(session.email) + "</strong> (Authorized Chef)</p>");
        out.println("        </div>");
        out.println("        <form method='POST' action='/action/advance-kitchen' style='margin:0;'>");
        out.println("          <button type='submit' class='btn btn-orange'>🍳 Advance FIFO Queue (Next Order)</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Queue Table
        out.println("    <div class='dash-card'>");
        out.println("      <h3 style='margin:0 0 12px; font-size:16px;'>Active Incoming Orders Queue (" + orders.size() + " Waiting)</h3>");
        out.println("      <table class='data-table'>");
        out.println("        <thead>");
        out.println("          <tr><th>Order ID</th><th>Token</th><th>Modality</th><th>Amount</th><th>Status</th><th>Action</th></tr>");
        out.println("        </thead>");
        out.println("        <tbody>");
        if (orders.isEmpty()) {
            out.println("          <tr><td colspan='6' style='text-align:center; color:#6B6560;'>No pending kitchen orders right now.</td></tr>");
        } else {
            for (BaseOrder o : orders) {
                out.println("          <tr>");
                out.println("            <td>#" + o.getOrderId() + "</td>");
                out.println("            <td><strong>" + escapeHtml(o.getPickupToken()) + "</strong></td>");
                out.println("            <td>" + escapeHtml(o.getDeliveryType()) + "</td>");
                out.println("            <td>" + o.getTotalAmount() + " Cr</td>");
                out.println("            <td><span class='badge badge-orange'>" + o.getStatus().getDisplayName() + "</span></td>");
                out.println("            <td>");
                out.println("              <form method='POST' action='/action/advance-kitchen' style='margin:0;'>");
                out.println("                <button type='submit' class='btn btn-white btn-sm'>Mark Cooked</button>");
                out.println("              </form>");
                out.println("            </td>");
                out.println("          </tr>");
            }
        }
        out.println("        </tbody>");
        out.println("      </table>");
        out.println("    </div>");

        // Chef Stock & Wastage Tools
        out.println("    <div style='display:grid; grid-template-columns: 1fr 1fr; gap:16px;'>");

        out.println("      <div class='dash-card'>");
        out.println("        <h3 style='margin:0 0 10px; font-size:15px;'>📦 Stock Availability Control</h3>");
        out.println("        <form method='POST' action='/action/toggle-stock'>");
        out.println("          <div class='form-group'>");
        out.println("            <label>Menu Item</label>");
        out.println("            <select name='itemId' style='width:100%; padding:8px;'>");
        for (MenuItem it : messService.getCatalog().getAllItems()) {
            out.println("              <option value='" + it.getItemId() + "'>" + it.getItemId() + ": " + escapeHtml(it.getItemName()) + " (" + it.getAvailableQuantity() + " left)</option>");
        }
        out.println("            </select>");
        out.println("          </div>");
        out.println("          <div style='display:flex; gap:8px;'>");
        out.println("            <button type='submit' name='stockAction' value='out' class='btn btn-danger btn-sm' style='flex:1;'>Mark Out of Stock</button>");
        out.println("            <button type='submit' name='stockAction' value='in' class='btn btn-green btn-sm' style='flex:1;'>Restock (+50 Portions)</button>");
        out.println("          </div>");
        out.println("        </form>");
        out.println("      </div>");

        out.println("      <div class='dash-card'>");
        out.println("        <h3 style='margin:0 0 10px; font-size:15px;'>🗑️ Daily Food Wastage Logger</h3>");
        out.println("        <form method='POST' action='/action/log-waste'>");
        out.println("          <div class='form-group'>");
        out.println("            <label>Dish Name</label>");
        out.println("            <input type='text' name='dish' placeholder='e.g. Dal Tadka' required>");
        out.println("          </div>");
        out.println("          <div class='form-group'>");
        out.println("            <label>Portions Wasted</label>");
        out.println("            <input type='number' name='portions' min='1' value='5' required>");
        out.println("          </div>");
        out.println("          <button type='submit' class='btn btn-danger btn-block'>Record in Audit Waste Log</button>");
        out.println("        </form>");
        out.println("      </div>");

        out.println("    </div>");
    }

    // -------------------------------------------------------------------------
    // WARDEN DASHBOARD (HOSTEL-BLOCK ASSIGNED FILTER)
    // -------------------------------------------------------------------------
    private void renderWardenDashboard(PrintWriter out, SecurityService.Session session) {
        String assignedBlock = session.extra != null ? session.extra : "Block B";

        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <h2 style='margin:0; font-size:20px;'>🏢 Hostel Warden Approval Portal</h2>");
        out.println("      <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Warden: <strong>" + escapeHtml(session.name) + "</strong> | Assigned Jurisdiction: <strong style='color:#D97706;'>" + escapeHtml(assignedBlock) + "</strong></p>");
        out.println("      <p style='margin:4px 0 0; font-size:12px; color:#B45309;'>Security Constraint: You are restricted to reviewing health delivery requests exclusively for <strong>" + escapeHtml(assignedBlock) + "</strong> residents.</p>");
        out.println("    </div>");

        List<HealthRequest> requests = messService.getPendingHealthRequests();

        out.println("    <div class='dash-card'>");
        out.println("      <h3 style='margin:0 0 12px; font-size:16px;'>Sick-Leave Room Delivery Requests (" + escapeHtml(assignedBlock) + ")</h3>");
        out.println("      <table class='data-table'>");
        out.println("        <thead>");
        out.println("          <tr><th>Req ID</th><th>Student</th><th>Hostel Room</th><th>Reason</th><th>Status</th><th>Decision</th></tr>");
        out.println("        </thead>");
        out.println("        <tbody>");

        int count = 0;
        for (HealthRequest hr : requests) {
            // Strictly filter by Warden's assigned hostel block
            if (hr.getHostelName() != null && hr.getHostelName().toLowerCase().contains(assignedBlock.toLowerCase())) {
                count++;
                out.println("          <tr>");
                out.println("            <td>#" + hr.getRequestId() + "</td>");
                out.println("            <td>Student #" + hr.getStudentId() + "</td>");
                out.println("            <td><strong>" + escapeHtml(hr.getHostelName()) + " - " + escapeHtml(hr.getRoomNumber()) + "</strong></td>");
                out.println("            <td>" + escapeHtml(hr.getReason()) + "</td>");
                out.println("            <td><span class='badge badge-orange'>" + hr.getStatus() + "</span></td>");
                out.println("            <td>");
                out.println("              <form method='POST' action='/action/review-sickleave' style='display:inline;'>");
                out.println("                <input type='hidden' name='requestId' value='" + hr.getRequestId() + "'>");
                out.println("                <button type='submit' name='decision' value='APPROVED' class='btn btn-green btn-sm'>Approve</button>");
                out.println("                <button type='submit' name='decision' value='REJECTED' class='btn btn-danger btn-sm'>Reject</button>");
                out.println("              </form>");
                out.println("            </td>");
                out.println("          </tr>");
            }
        }

        if (count == 0) {
            out.println("          <tr><td colspan='6' style='text-align:center; color:#6B6560;'>No pending delivery requests for " + escapeHtml(assignedBlock) + ".</td></tr>");
        }

        out.println("        </tbody>");
        out.println("      </table>");
        out.println("    </div>");
    }

    // -------------------------------------------------------------------------
    // ADMIN DASHBOARD
    // -------------------------------------------------------------------------
    private void renderAdminDashboard(PrintWriter out, SecurityService.Session session) {
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <h2 style='margin:0; font-size:20px;'>👑 Campus Mess Committee Administration</h2>");
        out.println("      <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Logged in as: <strong>" + escapeHtml(session.email) + "</strong> (Authorized Admin)</p>");
        out.println("    </div>");

        // KPI Grid
        out.println("    <div style='display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:16px;'>");
        out.println("      <div class='dash-card' style='border-top:3px solid #38bdf8;'>");
        out.println("        <div style='font-size:12px; color:#6B6560;'>Total Orders Today</div>");
        out.println("        <div style='font-size:26px; font-weight:bold; color:#1E1B16;'>342 Orders</div>");
        out.println("      </div>");
        out.println("      <div class='dash-card' style='border-top:3px solid #10b981;'>");
        out.println("        <div style='font-size:12px; color:#6B6560;'>Credits Billed Today</div>");
        out.println("        <div style='font-size:26px; font-weight:bold; color:#10b981;'>31,240 Cr</div>");
        out.println("      </div>");
        out.println("      <div class='dash-card' style='border-top:3px solid #f59e0b;'>");
        out.println("        <div style='font-size:12px; color:#6B6560;'>Active Students</div>");
        out.println("        <div style='font-size:26px; font-weight:bold; color:#f59e0b;'>128 Diners</div>");
        out.println("      </div>");
        out.println("    </div>");

        // Admin 1-Click Monthly Credit Reset Card
        out.println("    <div class='dash-card' style='border:1px solid #10b981; background:#F0FDF4;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:16px; color:#065F46;'>🔄 1-Click Monthly Student Allowance Reset (9,000 Credits)</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:12px; color:#047857;'>Recharges all campus student dining wallets back to 9,000 monthly credits via an atomic JDBC transaction.</p>");
        out.println("        </div>");
        out.println("        <form method='POST' action='/action/reset-credits' style='margin:0;'>");
        out.println("          <button type='submit' class='btn btn-green'>Execute 9,000 Credit Reset</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Top 5 Popular Dishes Leaderboard
        List<MenuItem> top5 = messService.getTop5Dishes();
        out.println("    <div class='dash-card'>");
        out.println("      <h3 style='margin:0 0 12px; font-size:16px;'>🏆 Top 5 Popular Dishes Today</h3>");
        out.println("      <table class='data-table'>");
        out.println("        <thead><tr><th>Rank</th><th>Dish Name</th><th>Category</th><th>Price</th><th>Rating</th></tr></thead>");
        out.println("        <tbody>");
        int rank = 1;
        for (MenuItem it : top5) {
            out.println("          <tr><td>#" + (rank++) + "</td><td><strong>" + escapeHtml(it.getItemName()) + "</strong></td><td>" + escapeHtml(it.getCategory()) + "</td><td>" + it.getPrice() + " Cr</td><td>4.8 ★</td></tr>");
        }
        out.println("        </tbody>");
        out.println("      </table>");
        out.println("    </div>");
    }

    // =========================================================================
    // POST HANDLERS (LOGIN, REGISTER, FORGOT-PASSWORD, ACTIONS)
    // =========================================================================

    private void handleLoginPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = req.getParameter("role");
        if (role == null) role = "student";

        String authMethod = req.getParameter("auth_method");
        SecurityService.AuthResult result;

        if ("student".equalsIgnoreCase(role) && "otp".equalsIgnoreCase(authMethod)) {
            String phone = req.getParameter("phone");
            String otp = req.getParameter("otp");
            result = securityService.loginWithMobileOtp(phone, otp);
        } else {
            String email = req.getParameter("email");
            String password = req.getParameter("password");
            result = securityService.loginWithPassword(email, password, role);
        }

        if (result.success && result.session != null) {
            Cookie sessionCookie = new Cookie("SMARTMESS_SESSION", result.session.sessionId);
            sessionCookie.setPath("/");
            sessionCookie.setMaxAge(30 * 60); // 30 minutes
            sessionCookie.setHttpOnly(true);
            resp.addCookie(sessionCookie);

            resp.sendRedirect("/dashboard?role=" + result.session.role);
        } else {
            String encodedErr = URLEncoder.encode(result.message != null ? result.message : "Authentication failed.", StandardCharsets.UTF_8);
            resp.sendRedirect("/login?role=" + role + "&error=" + encodedErr);
        }
    }

    private void handleRegisterPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String name = req.getParameter("name");
        String email = req.getParameter("email");
        String phone = req.getParameter("phone");
        String room = req.getParameter("room");
        String password = req.getParameter("password");
        String confirmPassword = req.getParameter("confirmPassword");

        SecurityService.AuthResult res = securityService.registerStudent(name, email, phone, room, password, confirmPassword, messService);
        if (res.success && res.session != null) {
            Cookie sessionCookie = new Cookie("SMARTMESS_SESSION", res.session.sessionId);
            sessionCookie.setPath("/");
            sessionCookie.setMaxAge(30 * 60);
            sessionCookie.setHttpOnly(true);
            resp.addCookie(sessionCookie);

            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Account registered! 9,000 monthly credits granted.", StandardCharsets.UTF_8));
        } else {
            resp.sendRedirect("/register?error=" + URLEncoder.encode(res.message, StandardCharsets.UTF_8));
        }
    }

    private void handleForgotPasswordPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String action = req.getParameter("action");
        String email = req.getParameter("email");

        if ("send_otp".equalsIgnoreCase(action)) {
            SecurityService.OtpResult res = securityService.sendPasswordResetOtp(email);
            if (res.success) {
                resp.sendRedirect("/forgot-password?step=2&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) + "&msg=" + URLEncoder.encode(res.message, StandardCharsets.UTF_8));
            } else {
                resp.sendRedirect("/forgot-password?error=" + URLEncoder.encode(res.message, StandardCharsets.UTF_8));
            }
        } else {
            // Step 2: reset
            String otp = req.getParameter("otp");
            String newPassword = req.getParameter("newPassword");
            String confirmPassword = req.getParameter("confirmPassword");

            SecurityService.AuthResult res = securityService.resetPasswordWithOtp(email, otp, newPassword, confirmPassword);
            if (res.success) {
                resp.sendRedirect("/login?role=student&msg=" + URLEncoder.encode(res.message, StandardCharsets.UTF_8));
            } else {
                resp.sendRedirect("/forgot-password?step=2&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) + "&error=" + URLEncoder.encode(res.message, StandardCharsets.UTF_8));
            }
        }
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        if (session != null) {
            securityService.invalidateSession(session.sessionId);
        }
        Cookie deadCookie = new Cookie("SMARTMESS_SESSION", "");
        deadCookie.setPath("/");
        deadCookie.setMaxAge(0);
        resp.addCookie(deadCookie);

        resp.sendRedirect("/");
    }

    private void handleStudentOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            MenuItem item = messService.getCatalog().getItemById(itemId);
            List<OrderItem> items = new ArrayList<>();
            items.add(new OrderItem(item.getItemId(), item.getItemName(), 1, item.getPrice(), item.getCalories()));

            BaseOrder order = messService.placeOrder(session.userId, items, false, null);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Order placed! Token: " + order.getPickupToken() + " (-" + order.getTotalAmount() + " Cr)", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleCancelOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int orderId = Integer.parseInt(req.getParameter("orderId"));
            BaseOrder cancelled = messService.cancelOrder(orderId, session.userId);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Order #" + orderId + " cancelled. " + cancelled.getTotalAmount() + " credits refunded to your wallet.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleBookPreOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            PreOrder po = messService.placePreOrder(session.userId, 12, 1, java.time.LocalDate.now().plusDays(1));
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Tomorrow's Special booked! Token: " + po.getPickupToken(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleTopup(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int amount = (int) Double.parseDouble(req.getParameter("amount"));
            messService.topUpCredits(session.userId, amount);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("+" + amount + " credits added via Razorpay!", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdvanceKitchen(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        BaseOrder next = messService.processNextKitchenOrder();
        if (next != null) {
            resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Order #" + next.getOrderId() + " (" + next.getPickupToken() + ") is now COOKING.", StandardCharsets.UTF_8));
        } else {
            resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Kitchen queue is empty.", StandardCharsets.UTF_8));
        }
    }

    private void handleToggleStock(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            messService.toggleStockStatus(itemId);
            resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Item #" + itemId + " stock status toggled.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=chef&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleLogWaste(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        String dish = req.getParameter("dish");
        String portions = req.getParameter("portions");
        resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode(portions + " portions of " + dish + " logged in daily food waste audit.", StandardCharsets.UTF_8));
    }

    private void handleReviewSickLeave(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int reqId = Integer.parseInt(req.getParameter("requestId"));
            String decision = req.getParameter("decision");
            boolean approve = "APPROVE".equalsIgnoreCase(decision);
            messService.reviewHealthRequest(reqId, approve, approve ? "" : "Rejected by Warden", session.name);
            resp.sendRedirect("/dashboard?role=warden&msg=" + URLEncoder.encode("Request #" + reqId + " marked " + decision + ".", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=warden&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleResetCredits(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            messService.resetAllStudentCredits(9000);
            resp.sendRedirect("/dashboard?role=admin&msg=" + URLEncoder.encode("1-Click Reset complete: All students credited with 9,000 monthly credits.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    // =========================================================================
    // SECURITY & SESSION COOKIE EXTRACTOR
    // =========================================================================

    private SecurityService.Session getSessionFromCookie(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("SMARTMESS_SESSION".equals(c.getName())) {
                    return securityService.getValidSession(c.getValue());
                }
            }
        }
        return null;
    }

    // =========================================================================
    // STYLES & TEMPLATES (LIGHT CREAM + ORANGE GRADIENT THEME)
    // =========================================================================

    private String getCommonStyles() {
        return "  <style>\n" +
               "    * { box-sizing: border-box; }\n" +
               "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #FAF8F5; color: #1E1B16; margin: 0; padding: 0; }\n" +
               "    .site-header { background: #FFFFFF; border-bottom: 1px solid #E7E5E4; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; }\n" +
               "    .logo { font-size: 22px; font-weight: 800; color: #1E1B16; }\n" +
               "    .logo .accent { color: #FF6B35; }\n" +
               "    .hero-container { text-align: center; max-width: 800px; margin: 60px auto 40px; padding: 0 20px; }\n" +
               "    .pill-badge { display: inline-block; background: #FFF7F0; border: 1px solid #FFD9C4; color: #FF6B35; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; }\n" +
               "    .hero-title { font-size: 48px; font-weight: 800; line-height: 1.15; margin: 0 0 16px; color: #1E1B16; }\n" +
               "    .gradient-text { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n" +
               "    .hero-sub { color: #6B6560; font-size: 16px; line-height: 1.6; margin: 0; }\n" +
               "    .section-container { max-width: 1100px; margin: 0 auto 60px; padding: 0 20px; }\n" +
               "    .role-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; }\n" +
               "    .role-card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; padding: 24px; text-decoration: none; color: inherit; transition: all 0.2s; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }\n" +
               "    .role-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(255,107,53,0.12); border-color: rgba(255,107,53,0.4); }\n" +
               "    .role-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }\n" +
               "    .icon-student { background: #FFF7F0; color: #FF6B35; border: 1px solid #FFE4D6; }\n" +
               "    .icon-chef { background: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5; }\n" +
               "    .icon-warden { background: #FFFBEB; color: #D97706; border: 1px solid #FEF3C7; }\n" +
               "    .icon-admin { background: #FFF1F2; color: #C2410C; border: 1px solid #FFE4E6; }\n" +
               "    .role-name { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #1E1B16; }\n" +
               "    .role-desc { font-size: 13px; color: #6B6560; line-height: 1.5; margin: 0 0 16px; }\n" +
               "    .role-footer { border-top: 1px solid #F5F5F4; padding-top: 12px; font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; }\n" +
               "    .btn { display: inline-block; padding: 10px 18px; border-radius: 10px; font-weight: 600; text-decoration: none; cursor: pointer; border: none; font-size: 14px; text-align: center; }\n" +
               "    .btn-lg { padding: 12px 24px; font-size: 15px; }\n" +
               "    .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }\n" +
               "    .btn-orange { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: #FFFFFF; box-shadow: 0 2px 10px rgba(255,107,53,0.25); }\n" +
               "    .btn-orange:hover { background: linear-gradient(135deg, #E85A2A 0%, #EA580C 100%); }\n" +
               "    .btn-white { background: #FFFFFF; color: #1E1B16; border: 1px solid #E7E5E4; }\n" +
               "    .btn-white:hover { background: #F5F5F4; border-color: #D6D3D1; }\n" +
               "    .btn-green { background: #10B981; color: white; }\n" +
               "    .btn-danger { background: #EF4444; color: white; }\n" +
               "    .btn-block { width: 100%; display: block; }\n" +
               "    .auth-container { max-width: 440px; margin: 40px auto 60px; padding: 0 16px; }\n" +
               "    .auth-card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }\n" +
               "    .auth-card-header { text-align: center; margin-bottom: 24px; }\n" +
               "    .role-avatar { width: 56px; height: 56px; border-radius: 16px; font-size: 28px; display: inline-flex; align-items: center; justify-content: center; }\n" +
               "    .link-back { color: #6B6560; text-decoration: none; font-size: 13px; font-weight: 500; }\n" +
               "    .link-back:hover { color: #FF6B35; }\n" +
               "    .form-group { margin-bottom: 16px; text-align: left; }\n" +
               "    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #1E1B16; margin-bottom: 6px; }\n" +
               "    .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #D6D3D1; border-radius: 8px; font-size: 14px; background: #FFFFFF; color: #1E1B16; }\n" +
               "    .form-group input:focus { outline: none; border-color: #FF6B35; box-shadow: 0 0 0 3px rgba(255,107,53,0.12); }\n" +
               "    .pwd-wrapper { position: relative; }\n" +
               "    .pwd-wrapper input { padding-right: 38px; }\n" +
               "    .pwd-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 14px; color: #6B6560; }\n" +
               "    .req { color: #EF4444; }\n" +
               "    .tab-switcher { display: flex; border: 1px solid #E7E5E4; border-radius: 10px; padding: 4px; background: #F5F5F4; margin-bottom: 20px; }\n" +
               "    .tab-btn { flex: 1; padding: 8px; border: none; background: none; font-size: 13px; font-weight: 600; color: #6B6560; border-radius: 7px; cursor: pointer; }\n" +
               "    .tab-btn.active { background: #FFFFFF; color: #FF6B35; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }\n" +
               "    .alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; line-height: 1.4; }\n" +
               "    .alert-error { background: #FEF2F2; color: #B91C1C; border: 1px solid #FCA5A5; }\n" +
               "    .alert-success { background: #F0FDF4; color: #15803D; border: 1px solid #86EFAC; }\n" +
               "    .field-error { font-size: 11px; color: #EF4444; margin-top: 3px; display: none; }\n" +
               "    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }\n" +
               "    .dash-card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }\n" +
               "    .user-nav { display: flex; align-items: center; gap: 12px; }\n" +
               "    .user-badge { background: #F5F5F4; border: 1px solid #E7E5E4; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }\n" +
               "    .stepper-row { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 0; }\n" +
               "    .step-node { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #F5F5F4; color: #78716C; }\n" +
               "    .step-node.step-active { background: #FF6B35; color: #FFFFFF; }\n" +
               "    .step-arrow { color: #A8A29E; font-size: 12px; }\n" +
               "    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }\n" +
               "    .badge-orange { background: #FFF7F0; color: #FF6B35; border: 1px solid #FFE4D6; }\n" +
               "    .badge-green { background: #F0FDF4; color: #10B981; border: 1px solid #BBF7D0; }\n" +
               "    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }\n" +
               "    .data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #E7E5E4; text-align: left; }\n" +
               "    .data-table th { background: #F5F5F4; color: #44403C; font-weight: 600; }\n" +
               "    .impact-strip { background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; padding: 12px 20px; text-align: center; font-size: 13px; max-width: 1100px; margin: 0 auto 30px; border-radius: 10px; }\n" +
               "    .site-footer { text-align: center; color: #A8A29E; font-size: 12px; padding: 30px 20px; border-top: 1px solid #E7E5E4; }\n" +
               "  </style>\n";
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return Character.toUpperCase(str.charAt(0)) + str.substring(1).toLowerCase();
    }

    private String getRoleIcon(String role) {
        if ("chef".equalsIgnoreCase(role)) return "👨‍🍳";
        if ("warden".equalsIgnoreCase(role)) return "🏢";
        if ("admin".equalsIgnoreCase(role)) return "👑";
        return "🎓";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#x27;");
    }
}
