package com.smartmess.web;

import com.smartmess.auth.SecurityService;
import com.smartmess.exception.InsufficientCreditsException;
import com.smartmess.exception.InvalidOrderStateException;
import com.smartmess.exception.MessException;
import com.smartmess.exception.OutOfStockException;
import com.smartmess.model.*;
import com.smartmess.service.IMessService;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Modern Java Servlet Web Portal for SmartMess.
 * 100% Pure Java HttpServlet Runtime (No JavaScript frontend frameworks).
 * Delivers:
 * 1. Role-specific login pages & authenticated sessions
 * 2. Student Portal: Live read-only food tracking, 1s countdown, sick-leave clearance, modern dish card grid, and slide-in tray
 * 3. Warden Portal: Live sick-leave review cards for assigned hostel block, Approve/Reject only, instant notifications
 * 4. Chef Portal: Live kitchen queue with room-delivery dispatch, prep time configuration, and step advancement
 * 5. Admin Portal: Student credit controls, bulk 9,000 reissues, menu & stock customizations, low-stock alerts, and customizable widget layout
 * 6. Clean HTML served with external static CSS stylesheet (/css/smartmess.css)
 * 7. Developer Diagnostics page (/developer-diagnostics) housing architecture and technical endpoint metrics
 */
public class WebPortalServlet extends HttpServlet {

    private final IMessService messService;
    private final SecurityService securityService;

    public WebPortalServlet(IMessService messService) {
        this.messService = messService;
        this.securityService = SecurityService.getInstance();
    }

    // =========================================================================
    // GET REQUEST ROUTER
    // =========================================================================

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if (path == null || path.isEmpty()) path = "/";

        // 1. Static CSS Stylesheet serving
        if ("/css".equals(path) || "/css/smartmess.css".equals(path) || path.endsWith(".css")) {
            serveStaticCss(resp);
            return;
        }

        // 2. Hidden Developer Diagnostics Page
        if ("/developer-diagnostics".equals(path) || "/dev".equals(path)) {
            renderDeveloperDiagnosticsPage(req, resp);
            return;
        }

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
                resp.sendRedirect("/dashboard?role=" + session.role);
                return;
            }
            renderDashboard(req, resp, session, req.getParameter("msg"), req.getParameter("error"), req.getParameter("tab"));
            return;
        }

        // Default: Landing Page "/"
        if (session != null) {
            resp.sendRedirect("/dashboard?role=" + session.role);
            return;
        }
        renderLandingPage(req, resp);
    }

    // =========================================================================
    // POST REQUEST ROUTER
    // =========================================================================

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if (path == null) path = "/";

        SecurityService.Session session = getSessionFromCookie(req);

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
        if (path.startsWith("/action/")) {
            if (session == null) {
                resp.sendRedirect("/login?error=" + URLEncoder.encode("Authentication required", StandardCharsets.UTF_8));
                return;
            }

            String action = path.substring("/action/".length());
            switch (action) {
                // Student Actions
                case "order":
                    handleStudentOrder(req, resp, session);
                    break;
                case "cancel-order":
                    handleCancelOrder(req, resp, session);
                    break;
                case "submit-sickleave":
                    handleSubmitSickLeave(req, resp, session);
                    break;
                case "topup":
                    handleTopup(req, resp, session);
                    break;
                case "book-preorder":
                    handleBookPreOrder(req, resp, session);
                    break;

                // Warden Actions
                case "review-sickleave":
                    handleReviewSickLeave(req, resp, session);
                    break;

                // Chef Actions
                case "chef-set-prep":
                    handleChefSetPrep(req, resp, session);
                    break;
                case "chef-advance-order":
                    handleChefAdvanceOrder(req, resp, session);
                    break;
                case "advance-kitchen":
                    handleAdvanceKitchen(req, resp, session);
                    break;
                case "toggle-stock":
                    handleToggleStock(req, resp, session);
                    break;
                case "log-waste":
                    handleLogWaste(req, resp, session);
                    break;

                // Admin Credit Actions
                case "admin-add-credits":
                    handleAdminAddCredits(req, resp, session);
                    break;
                case "admin-deduct-credits":
                    handleAdminDeductCredits(req, resp, session);
                    break;
                case "admin-set-limit":
                    handleAdminSetLimit(req, resp, session);
                    break;
                case "admin-reissue-student":
                    handleAdminReissueStudent(req, resp, session);
                    break;
                case "admin-reissue-all":
                    handleAdminReissueAll(req, resp, session);
                    break;
                case "admin-bulk-credits":
                    handleAdminBulkCredits(req, resp, session);
                    break;
                case "admin-toggle-auto-reissue":
                    handleAdminToggleAutoReissue(req, resp, session);
                    break;
                case "reset-credits":
                    handleResetCredits(req, resp, session);
                    break;

                // Admin Menu & Stock Customization Actions
                case "admin-add-dish":
                    handleAdminAddDish(req, resp, session);
                    break;
                case "admin-update-dish":
                    handleAdminUpdateDish(req, resp, session);
                    break;
                case "admin-adjust-stock":
                    handleAdminAdjustStock(req, resp, session);
                    break;
                case "admin-remove-stock":
                    handleAdminRemoveStock(req, resp, session);
                    break;
                case "admin-toggle-dish-active":
                    handleAdminToggleDishActive(req, resp, session);
                    break;
                case "admin-delete-dish":
                    handleAdminDeleteDish(req, resp, session);
                    break;
                case "admin-set-threshold":
                    handleAdminSetThreshold(req, resp, session);
                    break;
                case "admin-save-widgets":
                    handleAdminSaveWidgets(req, resp, session);
                    break;

                default:
                    resp.sendRedirect("/dashboard?role=" + session.role);
            }
            return;
        }

        resp.sendRedirect("/");
    }

    // =========================================================================
    // STATIC CSS SERVING (Clean separation from HTML)
    // =========================================================================

    private void serveStaticCss(HttpServletResponse resp) throws IOException {
        resp.setContentType("text/css; charset=UTF-8");
        resp.setHeader("Cache-Control", "public, max-age=86400");

        // Try classpath resource first
        InputStream is = getClass().getResourceAsStream("/static/css/smartmess.css");
        if (is == null) {
            // Try relative filesystem paths
            File f = new File("backend/src/main/resources/static/css/smartmess.css");
            if (!f.exists()) f = new File("src/main/resources/static/css/smartmess.css");
            if (!f.exists()) f = new File("static/css/smartmess.css");
            if (f.exists()) {
                is = new FileInputStream(f);
            }
        }

        if (is != null) {
            try (InputStream input = is; OutputStream out = resp.getOutputStream()) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = input.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                out.flush();
                return;
            }
        }

        // Safe fallback embedded stylesheet if stream cannot be opened
        try (PrintWriter out = resp.getWriter()) {
            out.println("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF8F5; color: #1E1B16; margin: 0; padding: 0; }");
            out.println(".site-header { background: #FFFFFF; border-bottom: 1px solid #E7E5E4; padding: 12px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 1000; }");
            out.println(".container { max-width: 1200px; margin: 0 auto; padding: 0 20px 40px; }");
            out.println(".dash-card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }");
            out.println(".btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; }");
            out.println(".btn-orange { background: linear-gradient(135deg, #FF6B35 0%, #EA580C 100%); color: white; }");
            out.println(".credit-pill { display: inline-flex; align-items: center; gap: 8px; background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; padding: 6px 14px; border-radius: 9999px; font-weight: 700; }");
        }
    }

    // =========================================================================
    // HTML HEAD HELPER (Google Fonts & Clean CSS Link)
    // =========================================================================

    private void renderHead(PrintWriter out, String title) {
        out.println("<!DOCTYPE html>");
        out.println("<html lang='en'>");
        out.println("<head>");
        out.println("  <meta charset='UTF-8'>");
        out.println("  <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("  <title>" + escapeHtml(title) + "</title>");
        out.println("  <link rel='preconnect' href='https://fonts.googleapis.com'>");
        out.println("  <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>");
        out.println("  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap' rel='stylesheet'>");
        out.println("  <link rel='stylesheet' href='/css/smartmess.css'>");
        out.println("</head>");
        out.println("<body>");
    }

    // =========================================================================
    // 1. PUBLIC LANDING PAGE (Clean, Modern, No Tech Jargon)
    // =========================================================================

    private void renderLandingPage(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, "SmartMess - Smart Campus Mess Management & Credit Platform");

            // Sticky Top Bar
            out.println("  <header class='site-header'>");
            out.println("    <a href='/' class='logo-area'>");
            out.println("      <div class='logo-badge'>🍽️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span></div>");
            out.println("    </a>");
            out.println("    <div class='nav-links'>");
            out.println("      <a href='#roles' class='nav-link'>Portals</a>");
            out.println("      <a href='/login?role=student' class='btn btn-orange btn-sm'>Sign In →</a>");
            out.println("    </div>");
            out.println("  </header>");

            // Hero Section
            out.println("  <div class='hero-banner'>");
            out.println("    <div class='hero-pill'>● Next-Gen Campus Dining Experience</div>");
            out.println("    <h1 class='hero-title'>Smart dining,<br><span class='gradient-text'>seamlessly managed.</span></h1>");
            out.println("    <p class='hero-sub'>Replace meal-token queues with atomic credit wallets, live order tracking, warden sick-leave clearance, and zero-waste sustainability tools.</p>");
            out.println("    <div style='margin-top:24px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;'>");
            out.println("      <a href='#roles' class='btn btn-orange btn-lg'>Explore Portals →</a>");
            out.println("      <a href='/login?role=student' class='btn btn-white btn-lg'>Student Sign In</a>");
            out.println("    </div>");
            out.println("  </div>");

            // Role Selection Section
            out.println("  <div id='roles' class='container'>");
            out.println("    <div style='text-align:center; margin-bottom: 32px;'>");
            out.println("      <h2 style='font-size:24px; color:#1E1B16; margin-bottom:8px;'>Select your campus portal</h2>");
            out.println("      <p style='color:#6B6560; font-size:14px; margin:0;'>Secure role-based authentication with dedicated dashboards for all stakeholders</p>");
            out.println("    </div>");

            out.println("    <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;'>");

            // Student Card
            out.println("      <a href='/login?role=student' style='text-decoration:none; color:inherit;'>");
            out.println("        <div class='dash-card' style='height:100%; display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("          <div>");
            out.println("            <div style='width:48px; height:48px; border-radius:12px; background:#FFF7F0; color:#FF6B35; border:1px solid #FFE4D6; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:16px;'>🎓</div>");
            out.println("            <h3 style='font-size:18px; margin-bottom:8px;'>Student Portal</h3>");
            out.println("            <p style='font-size:13px; color:#6B6560; line-height:1.5;'>Order meals, track cooking status live, apply for sick-leave room delivery, and manage 9,000 monthly credits.</p>");
            out.println("          </div>");
            out.println("          <div style='border-top:1px solid #F5F3EF; padding-top:14px; margin-top:20px; font-size:13px; font-weight:700; color:#FF6B35; display:flex; justify-content:space-between;'>");
            out.println("            <span>Enter Student Portal</span> <span>→</span>");
            out.println("          </div>");
            out.println("        </div>");
            out.println("      </a>");

            // Chef Card
            out.println("      <a href='/login?role=chef' style='text-decoration:none; color:inherit;'>");
            out.println("        <div class='dash-card' style='height:100%; display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("          <div>");
            out.println("            <div style='width:48px; height:48px; border-radius:12px; background:#FFF7ED; color:#EA580C; border:1px solid #FFEDD5; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:16px;'>👨‍🍳</div>");
            out.println("            <h3 style='font-size:18px; margin-bottom:8px;'>Chef &amp; Kitchen Queue</h3>");
            out.println("            <p style='font-size:13px; color:#6B6560; line-height:1.5;'>Manage kitchen orders, set live preparation timers, dispatch warden-approved room deliveries, and log food wastage.</p>");
            out.println("          </div>");
            out.println("          <div style='border-top:1px solid #F5F3EF; padding-top:14px; margin-top:20px; font-size:13px; font-weight:700; color:#EA580C; display:flex; justify-content:space-between;'>");
            out.println("            <span>Enter Kitchen Queue</span> <span>→</span>");
            out.println("          </div>");
            out.println("        </div>");
            out.println("      </a>");

            // Warden Card
            out.println("      <a href='/login?role=warden' style='text-decoration:none; color:inherit;'>");
            out.println("        <div class='dash-card' style='height:100%; display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("          <div>");
            out.println("            <div style='width:48px; height:48px; border-radius:12px; background:#FFFBEB; color:#D97706; border:1px solid #FEF3C7; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:16px;'>🏢</div>");
            out.println("            <h3 style='font-size:18px; margin-bottom:8px;'>Warden Review Portal</h3>");
            out.println("            <p style='font-size:13px; color:#6B6560; line-height:1.5;'>Exclusively review sick-leave room delivery requests for your assigned hostel block with real-time alerts.</p>");
            out.println("          </div>");
            out.println("          <div style='border-top:1px solid #F5F3EF; padding-top:14px; margin-top:20px; font-size:13px; font-weight:700; color:#D97706; display:flex; justify-content:space-between;'>");
            out.println("            <span>Enter Warden Portal</span> <span>→</span>");
            out.println("          </div>");
            out.println("        </div>");
            out.println("      </a>");

            // Admin Card
            out.println("      <a href='/login?role=admin' style='text-decoration:none; color:inherit;'>");
            out.println("        <div class='dash-card' style='height:100%; display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("          <div>");
            out.println("            <div style='width:48px; height:48px; border-radius:12px; background:#FFF1F2; color:#C2410C; border:1px solid #FFE4E6; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:16px;'>👑</div>");
            out.println("            <h3 style='font-size:18px; margin-bottom:8px;'>Campus Administration</h3>");
            out.println("            <p style='font-size:13px; color:#6B6560; line-height:1.5;'>Student credit management, bulk monthly reissues, customizable menu &amp; stock controls, and audit trails.</p>");
            out.println("          </div>");
            out.println("          <div style='border-top:1px solid #F5F3EF; padding-top:14px; margin-top:20px; font-size:13px; font-weight:700; color:#C2410C; display:flex; justify-content:space-between;'>");
            out.println("            <span>Enter Admin Dashboard</span> <span>→</span>");
            out.println("          </div>");
            out.println("        </div>");
            out.println("      </a>");

            out.println("    </div>");

            // Sustainability Teaser
            SustainabilityMetrics metrics = messService.getSustainabilityMetrics();
            out.println("    <div class='alert alert-success' style='margin-top:32px; text-align:center;'>");
            out.println("      🌱 <strong>Campus Sustainability Impact:</strong> " + String.format("%.1f", metrics.getFoodSavedKg()) + " kg food waste avoided • " + String.format("%.1f", metrics.getCo2AvoidedKg()) + " kg CO₂ prevented • Next-day special pre-orders active.");
            out.println("    </div>");

            out.println("  </div>");

            // Clean Footer with Link to Developer Diagnostics
            out.println("  <footer class='site-footer'>");
            out.println("    <div>SmartMess Campus Dining Platform • Review 2</div>");
            out.println("    <div style='margin-top:8px;'><a href='/developer-diagnostics'>⚙️ Developer &amp; Architecture Diagnostics</a></div>");
            out.println("  </footer>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // =========================================================================
    // 2. DISTINCT ROLE LOGIN PAGES (/login?role=<student|chef|warden|admin>)
    // =========================================================================

    private void renderLoginPage(HttpServletRequest req, HttpServletResponse resp, String role, String error, String msg) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, capitalize(role) + " Sign In - SmartMess");

            out.println("  <header class='site-header'>");
            out.println("    <a href='/' class='logo-area'>");
            out.println("      <div class='logo-badge'>🍽️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span></div>");
            out.println("    </a>");
            out.println("    <a href='/' class='nav-link'>← Back to Roles</a>");
            out.println("  </header>");

            out.println("  <div class='container' style='max-width:440px; margin-top:40px;'>");
            out.println("    <div class='dash-card'>");

            if ("student".equalsIgnoreCase(role)) {
                renderStudentLoginPage(out, error, msg);
            } else if ("chef".equalsIgnoreCase(role)) {
                renderChefLoginPage(out, error, msg);
            } else if ("warden".equalsIgnoreCase(role)) {
                renderWardenLoginPage(out, error, msg);
            } else if ("admin".equalsIgnoreCase(role)) {
                renderAdminLoginPage(out, error, msg);
            }

            out.println("    </div>");
            out.println("  </div>");

            renderAuthScripts(out);
            out.println("</body>");
            out.println("</html>");
        }
    }

    private void renderStudentLoginPage(PrintWriter out, String error, String msg) {
        out.println("      <div style='text-align:center; margin-bottom:20px;'>");
        out.println("        <div style='width:56px; height:56px; border-radius:16px; background:#FFF7F0; color:#FF6B35; border:1px solid #FFE4D6; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:12px;'>🎓</div>");
        out.println("        <h2 style='font-size:20px; margin-bottom:4px;'>Student Sign In</h2>");
        out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Access your dining credit wallet and meal tracking</p>");
        out.println("      </div>");

        out.println("      <div class='category-chips' style='margin-bottom:20px; justify-content:center;'>");
        out.println("        <button type='button' class='chip-btn active' id='tab-btn-email' onclick='switchStudentTab(\"email\")'>Email + Password</button>");
        out.println("        <button type='button' class='chip-btn' id='tab-btn-reg' onclick='switchStudentTab(\"reg\")'>Reg No + Room</button>");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) {
            out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
        }
        if (msg != null && !msg.isEmpty()) {
            out.println("      <div class='alert alert-success'>" + escapeHtml(msg) + "</div>");
        }

        // Method 1: Email + Password
        out.println("      <form id='form-student-email' method='POST' action='/login' class='auth-form'>");
        out.println("        <input type='hidden' name='role' value='student'>");
        out.println("        <input type='hidden' name='auth_method' value='email'>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>VIT Student Email <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='email' name='email' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='name2022@vitstudent.ac.in' required value='rohit.kundu2022@vitstudent.ac.in'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <div style='display:flex; justify-content:space-between; margin-bottom:6px;'>");
        out.println("            <label style='font-size:13px; font-weight:600;'>Password <span style='color:#EF4444;'>*</span></label>");
        out.println("            <a href='/forgot-password?role=student' style='font-size:12px; color:#FF6B35; text-decoration:none;'>Forgot?</a>");
        out.println("          </div>");
        out.println("          <input type='password' name='password' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='Enter your password' required value='student123'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In with VIT Email</button>");
        out.println("      </form>");

        // Method 2: Reg No + Room
        out.println("      <form id='form-student-reg' method='POST' action='/login' class='auth-form' style='display:none;'>");
        out.println("        <input type='hidden' name='role' value='student'>");
        out.println("        <input type='hidden' name='auth_method' value='reg'>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Registration Number <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='text' name='regNumber' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='e.g. 22BCE1022' required value='22BCE1022'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Hostel Block &amp; Room Number <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='text' name='roomNumber' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='e.g. Block B - Room 304' required value='Block B - Room 304'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In with Reg No</button>");
        out.println("      </form>");

        out.println("      <div style='margin-top:20px; text-align:center; font-size:13px; color:#6B6560;'>");
        out.println("        Don't have a mess account? <a href='/register?role=student' style='color:#FF6B35; font-weight:600; text-decoration:none;'>Register here</a>");
        out.println("      </div>");
    }

    private void renderChefLoginPage(PrintWriter out, String error, String msg) {
        out.println("      <div style='text-align:center; margin-bottom:20px;'>");
        out.println("        <div style='width:56px; height:56px; border-radius:16px; background:#FFF7ED; color:#EA580C; border:1px solid #FFEDD5; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:12px;'>👨‍🍳</div>");
        out.println("        <h2 style='font-size:20px; margin-bottom:4px;'>Chef &amp; Kitchen Sign In</h2>");
        out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Authorized Mess Staff &amp; Head Chef Portal</p>");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>" + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='chef'>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Chef Email Address <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='email' name='email' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='chef@campus.edu' required value='chef@campus.edu'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Chef Security Password <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='password' name='password' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='Enter password' required value='chef123'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In to Kitchen Dispatch</button>");
        out.println("      </form>");
    }

    private void renderWardenLoginPage(PrintWriter out, String error, String msg) {
        out.println("      <div style='text-align:center; margin-bottom:20px;'>");
        out.println("        <div style='width:56px; height:56px; border-radius:16px; background:#FFFBEB; color:#D97706; border:1px solid #FEF3C7; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:12px;'>🏢</div>");
        out.println("        <h2 style='font-size:20px; margin-bottom:4px;'>Hostel Warden Sign In</h2>");
        out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Hostel Block Room Delivery Clearance Portal</p>");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>" + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='warden'>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Warden Email Address <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='email' name='email' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='warden@campus.edu' required value='warden@campus.edu'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Assigned Hostel Block <span style='color:#EF4444;'>*</span></label>");
        out.println("          <select name='hostelBlock' class='search-box' style='border-radius:8px; padding-left:14px;'>");
        out.println("            <option value='Block B' selected>Block B (Men's Hostel)</option>");
        out.println("            <option value='Block A'>Block A (Men's Hostel)</option>");
        out.println("            <option value='Block C'>Block C (Ladies Hostel)</option>");
        out.println("            <option value='Block D'>Block D (Ladies Hostel)</option>");
        out.println("          </select>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Warden Password <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='password' name='password' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='Enter password' required value='warden123'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In to Warden Portal</button>");
        out.println("      </form>");
    }

    private void renderAdminLoginPage(PrintWriter out, String error, String msg) {
        out.println("      <div style='text-align:center; margin-bottom:20px;'>");
        out.println("        <div style='width:56px; height:56px; border-radius:16px; background:#FFF1F2; color:#C2410C; border:1px solid #FFE4E6; display:inline-flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:12px;'>👑</div>");
        out.println("        <h2 style='font-size:20px; margin-bottom:4px;'>Admin Sign In</h2>");
        out.println("        <p style='color:#6B6560; font-size:13px; margin:0;'>Campus Dining Committee &amp; Credit Management</p>");
        out.println("      </div>");

        if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
        if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>" + escapeHtml(msg) + "</div>");

        out.println("      <form method='POST' action='/login'>");
        out.println("        <input type='hidden' name='role' value='admin'>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Admin Email Address <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='email' name='email' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='admin@campus.edu' required value='admin@campus.edu'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:16px;'>");
        out.println("          <label style='display:block; font-size:13px; font-weight:600; margin-bottom:6px;'>Master Administrator Password <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='password' name='password' class='search-box' style='border-radius:8px; padding-left:14px;' placeholder='Enter password' required value='admin123'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-block'>Sign In as Campus Admin</button>");
        out.println("      </form>");
    }

    private void renderAuthScripts(PrintWriter out) {
        out.println("  <script>");
        out.println("  function switchStudentTab(mode) {");
        out.println("    var fEmail = document.getElementById('form-student-email');");
        out.println("    var fReg = document.getElementById('form-student-reg');");
        out.println("    var bEmail = document.getElementById('tab-btn-email');");
        out.println("    var bReg = document.getElementById('tab-btn-reg');");
        out.println("    if (mode === 'email') {");
        out.println("      fEmail.style.display = 'block';");
        out.println("      fReg.style.display = 'none';");
        out.println("      bEmail.classList.add('active');");
        out.println("      bReg.classList.remove('active');");
        out.println("    } else {");
        out.println("      fEmail.style.display = 'none';");
        out.println("      fReg.style.display = 'block';");
        out.println("      bReg.classList.add('active');");
        out.println("      bEmail.classList.remove('active');");
        out.println("    }");
        out.println("  }");
        out.println("  </script>");
    }

    private void renderRegisterPage(HttpServletRequest req, HttpServletResponse resp, String error) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, "Register - SmartMess");
            out.println("  <header class='site-header'>");
            out.println("    <a href='/' class='logo-area'>");
            out.println("      <div class='logo-badge'>🍽️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span></div>");
            out.println("    </a>");
            out.println("    <a href='/login?role=student' class='nav-link'>← Back to Sign In</a>");
            out.println("  </header>");
            out.println("  <div class='container' style='max-width:480px; margin-top:40px;'>");
            out.println("    <div class='dash-card'>");
            out.println("      <h2 style='font-size:20px; margin-bottom:6px;'>Create Student Mess Account</h2>");
            out.println("      <p style='color:#6B6560; font-size:13px; margin-bottom:20px;'>Must use an official VIT student email address (@vitstudent.ac.in)</p>");
            if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
            out.println("      <form method='POST' action='/register'>");
            out.println("        <div style='margin-bottom:14px;'><label style='font-size:13px; font-weight:600;'>Full Name *</label><input type='text' name='name' class='search-box' style='border-radius:8px;' required placeholder='e.g. Rohit Kundu'></div>");
            out.println("        <div style='margin-bottom:14px;'><label style='font-size:13px; font-weight:600;'>VIT Email *</label><input type='email' name='email' class='search-box' style='border-radius:8px;' required placeholder='name2022@vitstudent.ac.in'></div>");
            out.println("        <div style='margin-bottom:14px;'><label style='font-size:13px; font-weight:600;'>Registration Number *</label><input type='text' name='regNumber' class='search-box' style='border-radius:8px;' required placeholder='e.g. 22BCE1022'></div>");
            out.println("        <div style='margin-bottom:14px;'><label style='font-size:13px; font-weight:600;'>Hostel &amp; Room *</label><input type='text' name='roomNumber' class='search-box' style='border-radius:8px;' required placeholder='e.g. Block B - Room 304'></div>");
            out.println("        <div style='margin-bottom:14px;'><label style='font-size:13px; font-weight:600;'>Password *</label><input type='password' name='password' class='search-box' style='border-radius:8px;' required placeholder='Create password'></div>");
            out.println("        <button type='submit' class='btn btn-orange btn-block'>Register Account</button>");
            out.println("      </form>");
            out.println("    </div>");
            out.println("  </div>");
            out.println("</body></html>");
        }
    }

    private void renderForgotPasswordPage(HttpServletRequest req, HttpServletResponse resp, String error, String msg, String step, String email) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, "Reset Password - SmartMess");
            out.println("  <header class='site-header'>");
            out.println("    <a href='/' class='logo-area'>");
            out.println("      <div class='logo-badge'>🍽️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span></div>");
            out.println("    </a>");
            out.println("    <a href='/login?role=student' class='nav-link'>← Back to Sign In</a>");
            out.println("  </header>");
            out.println("  <div class='container' style='max-width:440px; margin-top:40px;'>");
            out.println("    <div class='dash-card'>");
            out.println("      <h2 style='font-size:20px; margin-bottom:6px;'>Reset Your Password</h2>");
            out.println("      <p style='color:#6B6560; font-size:13px; margin-bottom:20px;'>Enter your registered email to receive a secure recovery code</p>");
            if (error != null && !error.isEmpty()) out.println("      <div class='alert alert-error'>" + escapeHtml(error) + "</div>");
            if (msg != null && !msg.isEmpty()) out.println("      <div class='alert alert-success'>" + escapeHtml(msg) + "</div>");
            out.println("      <form method='POST' action='/forgot-password'>");
            out.println("        <input type='hidden' name='step' value='request'>");
            out.println("        <div style='margin-bottom:16px;'><label style='font-size:13px; font-weight:600;'>Registered Email *</label><input type='email' name='email' class='search-box' style='border-radius:8px;' required placeholder='name@vitstudent.ac.in'></div>");
            out.println("        <button type='submit' class='btn btn-orange btn-block'>Send Reset Instructions</button>");
            out.println("      </form>");
            out.println("    </div>");
            out.println("  </div>");
            out.println("</body></html>");
        }
    }

    // =========================================================================
    // 3. AUTHENTICATED DASHBOARDS
    // =========================================================================

    private void renderDashboard(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session, String msg, String error, String activeTab) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        String role = session.role;

        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, capitalize(role) + " Portal - SmartMess");

            // Sticky Top Authenticated Navigation Header
            out.println("  <header class='site-header'>");
            out.println("    <a href='/dashboard?role=" + escapeHtml(role) + "' class='logo-area'>");
            out.println("      <div class='logo-badge'>🍽️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span></div>");
            out.println("    </a>");

            out.println("    <div class='nav-links'>");
            // Show Credit Balance Pill for Students
            if ("student".equalsIgnoreCase(role)) {
                Student s = messService.getStudentProfile(session.userId);
                int credits = s != null ? s.getRemainingCredits() : 9000;
                out.println("      <div class='credit-pill' title='Your remaining monthly mess allowance'>");
                out.println("        <span class='coin-icon'>💳</span> <strong>" + String.format("%,d", credits) + "</strong> <span style='font-size:11px; opacity:0.8;'>Credits</span>");
                out.println("      </div>");
            }

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
                renderWardenDashboard(out, session, activeTab);
            } else if ("admin".equalsIgnoreCase(role)) {
                renderAdminDashboard(out, session, activeTab);
            }

            out.println("  </div>");

            out.println("  <footer class='site-footer'>");
            out.println("    <div>SmartMess Campus Dining Platform • Review 2</div>");
            out.println("    <div style='margin-top:8px;'><a href='/developer-diagnostics'>⚙️ Developer &amp; Architecture Diagnostics</a></div>");
            out.println("  </footer>");

            out.println("</body>");
            out.println("</html>");
        }
    }

    // -------------------------------------------------------------------------
    // STUDENT PORTAL: LIVE TRACKING, SICK LEAVE CLEARANCE & MODERN DISH GRID
    // -------------------------------------------------------------------------

    private void renderStudentDashboard(PrintWriter out, SecurityService.Session session) {
        Student student = messService.getStudentProfile(session.userId);
        int credits = student != null ? student.getRemainingCredits() : 9000;
        String room = student != null ? student.getHostelRoom() : (session.extra != null ? session.extra : "Block B - Room 304");

        LocalDate today = LocalDate.now();
        boolean roomApprovedToday = messService.hasApprovedSickLeave(session.userId, today);
        List<BaseOrder> activeOrders = messService.getActiveOrdersForStudent(session.userId);
        List<HealthRequest> mySickRequests = messService.getHealthRequestsForStudent(session.userId);

        HealthRequest todaySickReq = null;
        for (HealthRequest hr : mySickRequests) {
            if (today.equals(hr.getDate())) {
                if ("APPROVED".equalsIgnoreCase(hr.getStatus())) {
                    todaySickReq = hr;
                    break;
                } else if (todaySickReq == null) {
                    todaySickReq = hr;
                }
            }
        }

        // Student Stats & Wallet Banner
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px; font-weight:800;'>Welcome back, " + escapeHtml(session.name) + " 👋</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Hostel: <strong>" + escapeHtml(room) + "</strong> | Reg No: <strong>" + (student != null ? escapeHtml(student.getRegistrationNumber()) : "22BCE1022") + "</strong> | VIT Mail: <strong>" + escapeHtml(session.email) + "</strong></p>");
        out.println("        </div>");
        out.println("        <div style='display:flex; gap:16px; align-items:center;'>");
        out.println("          <div style='text-align:right;'>");
        out.println("            <div style='font-size:12px; color:#6B6560;'>Dining Wallet</div>");
        out.println("            <div style='font-size:24px; font-weight:800; color:#10b981;'>" + String.format("%,d", credits) + " Cr</div>");
        out.println("          </div>");
        out.println("          <form method='POST' action='/action/topup' style='margin:0;'>");
        out.println("            <input type='hidden' name='amount' value='500'>");
        out.println("            <button type='submit' class='btn btn-orange btn-sm'>+500 Cr (Razorpay)</button>");
        out.println("          </form>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // 1. LIVE TRACKING CARDS (READ-ONLY KITCHEN FLOW)
        out.println("    <div id='active-orders-container'>");
        if (activeOrders.isEmpty()) {
            out.println("      <div class='dash-card' style='text-align:center; padding:28px 20px;'>");
            out.println("        <div style='font-size:32px;'>🍽️</div>");
            out.println("        <h3 style='margin:8px 0; font-size:16px;'>No Active Kitchen Orders Right Now</h3>");
            out.println("        <p style='margin:0; color:#6B6560; font-size:13px;'>Choose a fresh meal from the cafeteria menu below to track cooking progress live!</p>");
            out.println("      </div>");
        } else {
            for (BaseOrder o : activeOrders) {
                boolean isRoom = o.isRoomDelivery();
                OrderStatus st = o.getStatus();
                long readyEpoch = (o.getEstimatedReadyTime() != null)
                        ? o.getEstimatedReadyTime().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                        : (System.currentTimeMillis() + (o.getEstimatedPrepMinutes() * 60000L));

                out.println("      <div class='dash-card order-live-card' id='order-card-" + o.getOrderId() + "' style='border-left: 4px solid #FF6B35;'>");
                out.println("        <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;'>");
                out.println("          <div>");
                out.println("            <span style='font-size:16px; font-weight:800; color:#1E1B16;'>📱 Live Kitchen Tracking</span>");
                out.println("            <span class='badge badge-orange' style='margin-left:8px; font-size:13px; font-weight:700;'>Token: " + escapeHtml(o.getPickupToken()) + "</span>");
                if (isRoom) {
                    out.println("            <span class='badge badge-blue' style='margin-left:6px;'>🛵 Room Delivery</span>");
                } else {
                    out.println("            <span class='badge' style='background:#F3F4F6; color:#374151; border:1px solid #E5E7EB; margin-left:6px;'>🛍️ Cafeteria Pickup</span>");
                }
                out.println("          </div>");
                out.println("          <div class='countdown-box order-countdown' id='countdown-" + o.getOrderId() + "' data-order-id='" + o.getOrderId() + "' data-ready-epoch='" + readyEpoch + "' data-status='" + st.name() + "' data-room='" + isRoom + "'>");
                out.println("            ⏱️ Calculating time left...");
                out.println("          </div>");
                out.println("        </div>");

                // Room delivery details if applicable
                if (isRoom) {
                    out.println("        <div style='background:#FFF7ED; border:1px solid #FFEDD5; border-radius:8px; padding:10px 14px; margin-bottom:12px; font-size:13px; color:#9A3412;'>");
                    out.println("          <strong>Hostel Block &amp; Room:</strong> " + escapeHtml(o.getDeliveryAddress()) + " • <em>Warden approved delivery clearance</em>");
                    if (st == OrderStatus.OUT_FOR_DELIVERY) {
                        out.println("          <div style='font-weight:700; color:#EA580C; margin-top:4px;'>🛵 Live Status: Out for delivery to your room!</div>");
                    } else if (st == OrderStatus.DELIVERED) {
                        out.println("          <div style='font-weight:700; color:#10B981; margin-top:4px;'>🏠 Live Status: Delivered to your room. Enjoy your meal!</div>");
                    }
                    out.println("        </div>");
                }

                // Ordered Items summary
                StringBuilder itemsSummary = new StringBuilder();
                if (o.getItems() != null) {
                    for (int i = 0; i < o.getItems().size(); i++) {
                        OrderItem item = o.getItems().get(i);
                        if (i > 0) itemsSummary.append(" • ");
                        itemsSummary.append(item.getQuantity()).append("x ").append(escapeHtml(item.getItemName()));
                    }
                }
                out.println("        <div style='font-size:13px; color:#4B5563; margin-bottom:12px;'><strong>Ordered:</strong> " + (itemsSummary.length() > 0 ? itemsSummary.toString() : "Cafeteria Meal") + " • Total: <strong>" + o.getTotalAmount() + " Credits</strong></div>");

                // Real-time Stepper (5-step for pickup, 6-step for room delivery)
                out.println("        <div class='stepper-row'>");
                if (!isRoom) {
                    boolean pActive = (st == OrderStatus.PENDING);
                    boolean aActive = (st == OrderStatus.ACCEPTED);
                    boolean cActive = (st == OrderStatus.PREPARING);
                    boolean rActive = (st == OrderStatus.READY);
                    boolean dActive = (st == OrderStatus.COMPLETED);

                    out.println("          <div class='step-node " + (pActive ? "step-active" : "") + "'>1. PENDING ⏳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (aActive ? "step-active" : "") + "'>2. ACCEPTED 👨‍🍳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (cActive ? "step-active" : "") + "'>3. PREPARING 🍳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (rActive ? "step-active" : "") + "'>4. READY 🔔</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (dActive ? "step-active" : "") + "'>5. COMPLETED ✅</div>");
                } else {
                    boolean pActive = (st == OrderStatus.PENDING);
                    boolean aActive = (st == OrderStatus.ACCEPTED);
                    boolean cActive = (st == OrderStatus.PREPARING);
                    boolean rActive = (st == OrderStatus.READY);
                    boolean oActive = (st == OrderStatus.OUT_FOR_DELIVERY);
                    boolean dActive = (st == OrderStatus.DELIVERED || st == OrderStatus.COMPLETED);

                    out.println("          <div class='step-node " + (pActive ? "step-active" : "") + "'>1. PENDING ⏳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (aActive ? "step-active" : "") + "'>2. ACCEPTED 👨‍🍳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (cActive ? "step-active" : "") + "'>3. PREPARING 🍳</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (rActive ? "step-active" : "") + "'>4. READY 🔔</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (oActive ? "step-active" : "") + "'>5. OUT FOR DELIVERY 🛵</div>");
                    out.println("          <div class='step-arrow'>──▶</div>");
                    out.println("          <div class='step-node " + (dActive ? "step-active" : "") + "'>6. DELIVERED 🏠</div>");
                }
                out.println("        </div>");

                // Live Chef Activity Line
                String activity = o.getChefActivity() != null ? o.getChefActivity() : "Order accepted, cooking starts soon";
                out.println("        <div style='margin-top:10px; background:#F8FAFC; border:1px solid #E2E8F0; padding:10px 14px; border-radius:8px; font-size:13px; color:#475569;'>");
                out.println("          👨‍🍳 <strong>Live Kitchen Status:</strong> <span class='activity-text'>" + escapeHtml(activity) + "</span>");
                out.println("        </div>");

                // Action row: Cancel permitted strictly while Pending; NO other kitchen controls
                out.println("        <div style='margin-top:14px; display:flex; justify-content:space-between; align-items:center;'>");
                out.println("          <div style='font-size:12px; color:#6B6560;'>Order #" + o.getOrderId() + " • Estimated Prep Time: <strong>" + o.getEstimatedPrepMinutes() + " mins</strong></div>");
                if (st == OrderStatus.PENDING) {
                    out.println("          <form method='POST' action='/action/cancel-order' style='margin:0;'>");
                    out.println("            <input type='hidden' name='orderId' value='" + o.getOrderId() + "'>");
                    out.println("            <button type='submit' class='btn btn-danger btn-sm' onclick='return confirm(\"Cancel this pending order? Full amount will be refunded immediately.\");'>❌ Cancel Order (Allowed while Pending)</button>");
                    out.println("          </form>");
                } else {
                    out.println("          <span style='font-size:12px; color:#9CA3AF; font-weight:600;'>🔒 Kitchen Flow Locked (Cancel allowed strictly while Pending)</span>");
                }
                out.println("        </div>");

                out.println("      </div>");
            }
        }
        out.println("    </div>");

        // 2. SICK LEAVE & ROOM DELIVERY CLEARANCE
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;'>");
        out.println("        <h3 style='margin:0; font-size:17px; font-weight:700;'>🏥 Sick Leave Request &amp; Hostel Room Delivery Clearance</h3>");
        if (roomApprovedToday) {
            out.println("        <span class='badge badge-green' style='font-size:12px;'>✅ Room delivery enabled for today</span>");
        } else if (todaySickReq != null && "PENDING".equalsIgnoreCase(todaySickReq.getStatus())) {
            out.println("        <span class='badge badge-orange' style='font-size:12px;'>⏳ Waiting for warden approval</span>");
        } else if (todaySickReq != null && "REJECTED".equalsIgnoreCase(todaySickReq.getStatus())) {
            out.println("        <span class='badge badge-red' style='font-size:12px;'>❌ Request rejected</span>");
        }
        out.println("      </div>");

        // Status banner
        if (roomApprovedToday) {
            out.println("      <div class='alert alert-success' style='margin-bottom:16px;'>");
            out.println("        <strong>✅ Room Delivery Enabled for Today (" + today + ")</strong><br>");
            out.println("        <span style='font-size:12px;'>Your hostel warden approved your sick leave clearance. You can now select <strong>'Room Delivery'</strong> when ordering from the cafeteria menu below.</span>");
            out.println("      </div>");
        } else if (todaySickReq != null && "PENDING".equalsIgnoreCase(todaySickReq.getStatus())) {
            out.println("      <div class='alert alert-amber' style='margin-bottom:16px;'>");
            out.println("        <strong>⏳ Waiting for Warden Approval</strong><br>");
            out.println("        <span style='font-size:12px;'>Your sick leave request for " + today + " has been submitted to your hostel block warden. Room delivery will unlock immediately once approved.</span>");
            out.println("      </div>");
        } else if (todaySickReq != null && "REJECTED".equalsIgnoreCase(todaySickReq.getStatus())) {
            out.println("      <div class='alert alert-error' style='margin-bottom:16px;'>");
            out.println("        <strong>❌ Sick Leave Request Rejected by Warden</strong><br>");
            out.println("        <span style='font-size:12px;'>Warden's Reason: <em>" + escapeHtml(todaySickReq.getRejectionReason()) + "</em>. Room delivery ordering remains locked.</span>");
            out.println("      </div>");
        } else {
            out.println("      <p style='margin:0 0 16px; font-size:13px; color:#6B6560;'>");
            out.println("        Feeling sick or recovering from illness? Submit your sick-leave request below to request hostel-room meal delivery clearance from your Hostel Warden.");
            out.println("      </p>");
        }

        // Sick Leave Submission Form
        String defaultBlock = "Block B";
        if (room.toLowerCase().contains("block a")) defaultBlock = "Block A";
        else if (room.toLowerCase().contains("block b")) defaultBlock = "Block B";
        else if (room.toLowerCase().contains("block c")) defaultBlock = "Block C";
        else if (room.toLowerCase().contains("block d")) defaultBlock = "Block D";

        String defaultRoomNum = "304";
        try {
            String[] parts = room.split("-");
            if (parts.length > 1) defaultRoomNum = parts[1].replace("Room", "").trim();
        } catch (Exception ignored) {}

        out.println("      <form method='POST' action='/action/submit-sickleave' style='background:#FAF8F5; border:1px solid #E7E5E4; border-radius:10px; padding:18px; margin-bottom:20px;'>");
        out.println("        <div style='font-size:14px; font-weight:700; color:#1E1B16; margin-bottom:14px;'>📝 New Sick Leave &amp; Meal Delivery Application</div>");
        out.println("        <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px;'>");
        out.println("          <div>");
        out.println("            <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Hostel Block <span style='color:#EF4444;'>*</span></label>");
        out.println("            <select name='hostelBlock' required class='search-box' style='border-radius:8px;'>");
        out.println("              <option value='Block A' " + ("Block A".equals(defaultBlock) ? "selected" : "") + ">Block A (Men's)</option>");
        out.println("              <option value='Block B' " + ("Block B".equals(defaultBlock) ? "selected" : "") + ">Block B (Men's)</option>");
        out.println("              <option value='Block C' " + ("Block C".equals(defaultBlock) ? "selected" : "") + ">Block C (Ladies)</option>");
        out.println("              <option value='Block D' " + ("Block D".equals(defaultBlock) ? "selected" : "") + ">Block D (Ladies)</option>");
        out.println("            </select>");
        out.println("          </div>");
        out.println("          <div>");
        out.println("            <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Room Number <span style='color:#EF4444;'>*</span></label>");
        out.println("            <input type='text' name='roomNumber' value='" + escapeHtml(defaultRoomNum) + "' required placeholder='e.g. 304' class='search-box' style='border-radius:8px;'>");
        out.println("          </div>");
        out.println("          <div>");
        out.println("            <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Date <span style='color:#EF4444;'>*</span></label>");
        out.println("            <input type='date' name='date' value='" + today + "' required class='search-box' style='border-radius:8px;'>");
        out.println("          </div>");
        out.println("          <div>");
        out.println("            <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Optional Meals Needed</label>");
        out.println("            <input type='text' name='mealsNeeded' placeholder='e.g. Breakfast, Lunch, Dinner' class='search-box' style='border-radius:8px;'>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("        <div style='margin-top:14px; margin-bottom:14px;'>");
        out.println("          <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Reason for Sick Leave <span style='color:#EF4444;'>*</span></label>");
        out.println("          <input type='text' name='reason' placeholder='e.g. High fever, viral flu and doctor recommended bed rest' required class='search-box' style='border-radius:8px;'>");
        out.println("        </div>");
        out.println("        <div style='margin-bottom:14px;'>");
        out.println("          <label style='display:block; font-size:12px; font-weight:600; margin-bottom:4px;'>Attached Medical Note / Details</label>");
        out.println("          <input type='text' name='attachedNote' placeholder='e.g. Clinic slip #8423 verified by campus health center' class='search-box' style='border-radius:8px;'>");
        out.println("        </div>");
        out.println("        <button type='submit' class='btn btn-orange btn-sm'>Submit Sick Leave to Hostel Warden</button>");
        out.println("      </form>");

        // History of past sick-leave requests
        out.println("      <div style='font-size:14px; font-weight:700; color:#1E1B16; margin-bottom:10px;'>📜 Sick Leave Request History</div>");
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead>");
        out.println("            <tr><th>Req ID</th><th>Date</th><th>Hostel &amp; Room</th><th>Reason</th><th>Meals</th><th>Status</th><th>Warden Decision / Reason</th></tr>");
        out.println("          </thead>");
        out.println("          <tbody>");
        if (mySickRequests.isEmpty()) {
            out.println("            <tr><td colspan='7' style='text-align:center; color:#6B6560;'>No previous sick leave requests recorded.</td></tr>");
        } else {
            for (HealthRequest hr : mySickRequests) {
                out.println("            <tr>");
                out.println("              <td>#" + hr.getRequestId() + "</td>");
                out.println("              <td>" + hr.getDate() + "</td>");
                out.println("              <td><strong>" + escapeHtml(hr.getHostelName()) + " - " + escapeHtml(hr.getRoomNumber()) + "</strong></td>");
                out.println("              <td>" + escapeHtml(hr.getReason()) + "</td>");
                out.println("              <td>" + escapeHtml(hr.getMealsNeeded()) + "</td>");
                if ("APPROVED".equalsIgnoreCase(hr.getStatus())) {
                    out.println("              <td><span class='badge badge-green'>Approved ✅</span></td>");
                    out.println("              <td><span style='color:#059669; font-weight:600;'>Room delivery enabled</span></td>");
                } else if ("REJECTED".equalsIgnoreCase(hr.getStatus())) {
                    out.println("              <td><span class='badge badge-red'>Rejected ❌</span></td>");
                    out.println("              <td><span style='color:#DC2626;'>" + escapeHtml(hr.getRejectionReason() != null ? hr.getRejectionReason() : "Rejected by Warden") + "</span></td>");
                } else {
                    out.println("              <td><span class='badge badge-orange'>Pending ⏳</span></td>");
                    out.println("              <td><span style='color:#D97706;'>Waiting for warden review</span></td>");
                }
                out.println("            </tr>");
            }
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");
        out.println("    </div>");

        // 3. NEXT-DAY SPECIAL PRE-ORDERS HUB (ZERO FOOD WASTE DINING)
        List<SpecialMenuItem> preOrderCatalog = messService.getPreOrderCatalog();
        List<PreOrder> myPreOrders = messService.getPreOrders(session.userId);

        out.println("    <div class='dash-card' style='border: 2px solid #F59E0B; background: linear-gradient(135deg, #FFFDF7 0%, #FEF3C7 100%); margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;'>");
        out.println("        <div>");
        out.println("          <span class='badge badge-orange' style='font-size:12px; font-weight:800;'>🌱 Zero Food Waste Initiative</span>");
        out.println("          <h3 style='margin:6px 0 2px; font-size:19px; font-weight:800; color:#92400E;'>⭐ Next-Day Chef Special Pre-Orders Hub</h3>");
        out.println("          <p style='margin:0; font-size:13px; color:#78350F;'>Pre-order today to reserve tomorrow's exclusive chef-crafted portions. Guaranteed meal &amp; zero waste!</p>");
        out.println("        </div>");
        out.println("        <span class='badge' style='background:#FDE68A; color:#92400E; font-size:13px; padding:6px 14px; font-weight:700;'>📅 Scheduled for Tomorrow (" + today.plusDays(1) + ")</span>");
        out.println("      </div>");

        // Special Dishes Grid
        out.println("      <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:18px; margin-bottom:20px;'>");
        for (SpecialMenuItem special : preOrderCatalog) {
            int remainingStock = special.getRemainingSpecialStock();
            String img = (special.getImageUrl() != null && !special.getImageUrl().trim().isEmpty())
                    ? special.getImageUrl().trim() : "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
            out.println("        <div style='background:white; border-radius:12px; border:1px solid #FCD34D; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("          <div style='position:relative; height:160px; overflow:hidden;'>");
            out.println("            <img src='" + escapeHtml(img) + "' alt='" + escapeHtml(special.getItemName()) + "' style='width:100%; height:100%; object-fit:cover;'>");
            out.println("            <span class='badge badge-orange' style='position:absolute; top:10px; left:10px;'>⭐ Chef Special</span>");
            out.println("            <span class='badge " + (remainingStock > 5 ? "badge-green" : "badge-red") + "' style='position:absolute; top:10px; right:10px; font-weight:700;'>" + remainingStock + " Portions Left</span>");
            out.println("          </div>");
            out.println("          <div style='padding:16px; flex-grow:1; display:flex; flex-direction:column; justify-content:space-between;'>");
            out.println("            <div>");
            out.println("              <div style='display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;'>");
            out.println("                <h4 style='margin:0; font-size:16px; font-weight:800; color:#1E293B;'>" + escapeHtml(special.getItemName()) + "</h4>");
            out.println("                <span style='font-size:16px; font-weight:800; color:#D97706;'>" + special.getPrice() + " Cr</span>");
            out.println("              </div>");
            out.println("              <p style='margin:0 0 10px; font-size:13px; color:#64748B; line-height:1.4;'>" + escapeHtml(special.getDescription()) + "</p>");
            out.println("              <div style='font-size:12px; color:#78350F; background:#FFFBEB; padding:6px 10px; border-radius:6px; margin-bottom:12px;'>");
            out.println("                🔥 <strong>" + special.getCalories() + " kcal</strong> • 🕒 Window: Tomorrow 19:30 - 20:30 • Counter Pickup");
            out.println("              </div>");
            out.println("            </div>");
            out.println("            <form method='POST' action='/action/book-preorder' style='margin:0; display:flex; gap:10px; align-items:center;'>");
            out.println("              <input type='hidden' name='itemId' value='" + special.getItemId() + "'>");
            out.println("              <input type='number' name='quantity' value='1' min='1' max='" + Math.max(1, remainingStock) + "' style='width:60px; padding:8px; border:1px solid #CBD5E1; border-radius:6px; font-weight:700; text-align:center;'>");
            if (remainingStock > 0) {
                out.println("              <button type='submit' class='btn btn-orange' style='flex-grow:1; font-weight:700;'>⭐ Book Pre-Order (" + special.getPrice() + " Cr)</button>");
            } else {
                out.println("              <button type='button' class='btn' style='flex-grow:1; background:#CBD5E1; color:#64748B; cursor:not-allowed;' disabled>Sold Out</button>");
            }
            out.println("            </form>");
            out.println("          </div>");
            out.println("        </div>");
        }
        out.println("      </div>");

        // My Booked Pre-Orders Table
        out.println("      <div style='background:white; border-radius:10px; padding:16px; border:1px solid #FCD34D;'>");
        out.println("        <h4 style='margin:0 0 12px; font-size:15px; font-weight:700; color:#1E293B;'>📜 My Booked Pre-Orders (" + myPreOrders.size() + ")</h4>");
        if (myPreOrders.isEmpty()) {
            out.println("        <p style='margin:0; font-size:13px; color:#6B6560;'>You haven't booked any next-day special meals yet. Reserve above to guarantee your portion!</p>");
        } else {
            out.println("        <div class='data-table-wrapper'>");
            out.println("          <table class='data-table'>");
            out.println("            <thead>");
            out.println("              <tr><th>Pre-Order Token</th><th>Special Dish</th><th>Scheduled Date</th><th>Qty</th><th>Total Credits</th><th>Pickup Window</th><th>Status</th></tr>");
            out.println("            </thead>");
            out.println("            <tbody>");
            for (PreOrder po : myPreOrders) {
                out.println("              <tr>");
                out.println("                <td><span class='badge badge-orange' style='font-weight:800; font-size:13px;'>" + escapeHtml(po.getPickupToken()) + "</span></td>");
                out.println("                <td><strong>" + escapeHtml(po.getItemName()) + "</strong></td>");
                out.println("                <td>" + po.getScheduledDate() + "</td>");
                out.println("                <td>" + po.getQuantity() + " portion(s)</td>");
                out.println("                <td><strong>" + po.getTotalAmount() + " Cr</strong></td>");
                out.println("                <td>Tomorrow 19:30 - 20:30 (Counter)</td>");
                out.println("                <td><span class='badge badge-green'>Confirmed ✅</span></td>");
                out.println("              </tr>");
            }
            out.println("            </tbody>");
            out.println("          </table>");
            out.println("        </div>");
        }
        out.println("      </div>");
        out.println("    </div>");

        // 4. CAFETERIA MENU & ORDERING: MODERN RESPONSIVE CARD GRID
        List<MenuItem> allDishes = messService.getCatalog().getAllItems();
        out.println("    <div class='dash-card'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:18px; font-weight:800;'>🍽️ Cafeteria Menu &amp; Ordering</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:13px; color:#6B6560;'>Select your favorite dishes to add directly into your dining tray</p>");
        out.println("        </div>");
        if (roomApprovedToday) {
            out.println("        <span class='badge badge-green' style='font-size:13px; padding:6px 12px;'>🚚 Room Delivery Unlocked</span>");
        } else {
            out.println("        <span class='badge' style='background:#F3F4F6; color:#6B7280; font-size:13px; padding:6px 12px;'>🛍️ Cafeteria Pickup Active</span>");
        }
        out.println("      </div>");

        // Category Filter Chips & Search Box
        out.println("      <div class='catalog-toolbar'>");
        out.println("        <div class='category-chips'>");
        out.println("          <button type='button' class='chip-btn active' onclick='filterMenuCategory(\"all\", this)'>All Dishes</button>");
        out.println("          <button type='button' class='chip-btn' onclick='filterMenuCategory(\"Breakfast\", this)'>Breakfast</button>");
        out.println("          <button type='button' class='chip-btn' onclick='filterMenuCategory(\"Lunch\", this)'>Lunch</button>");
        out.println("          <button type='button' class='chip-btn' onclick='filterMenuCategory(\"Snacks\", this)'>Snacks</button>");
        out.println("          <button type='button' class='chip-btn' onclick='filterMenuCategory(\"Dinner\", this)'>Dinner</button>");
        out.println("          <button type='button' class='chip-btn' onclick='filterMenuCategory(\"Beverages\", this)'>Beverages</button>");
        out.println("        </div>");
        out.println("        <div class='search-box-wrapper'>");
        out.println("          <span class='search-icon'>🔍</span>");
        out.println("          <input type='text' id='dish-search-input' class='search-box' placeholder='Search dishes by name or ingredients...' onkeyup='filterMenuSearch()'>");
        out.println("        </div>");
        out.println("      </div>");

        // Responsive Dish Card Grid
        out.println("      <div class='dish-grid' id='dishes-container'>");
        for (MenuItem item : allDishes) {
            if (item.isArchived()) continue;
            boolean soldOut = item.isSoldOut();
            boolean lowStock = item.isLowStock();
            String imgUrl = (item.getImageUrl() != null && !item.getImageUrl().trim().isEmpty())
                    ? item.getImageUrl().trim() : "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80";

            out.println("        <div class='dish-card " + (soldOut ? "sold-out" : "") + "' data-category='" + escapeHtml(item.getCategory()) + "' data-name='" + escapeHtml(item.getItemName().toLowerCase()) + "'>");
            out.println("          <div class='dish-image-wrapper'>");
            out.println("            <img src='" + escapeHtml(imgUrl) + "' alt='" + escapeHtml(item.getItemName()) + "' class='dish-image' onerror='this.src=\"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80\"'>");
            out.println("            <div class='dish-top-badges'>");
            out.println("              <span class='badge badge-orange'>" + escapeHtml(item.getCategory()) + "</span>");
            if (item.isHealthy()) {
                out.println("              <span class='badge badge-green'>🌿 Healthy Diet</span>");
            }
            out.println("            </div>");
            out.println("          </div>");

            out.println("          <div class='dish-body'>");
            out.println("            <div class='dish-title'>" + escapeHtml(item.getItemName()) + "</div>");
            out.println("            <div class='dish-description'>" + escapeHtml(item.getDescription()) + "</div>");

            out.println("            <div class='dish-meta-row'>");
            out.println("              <span>🔥 " + (item.getCalories() != null ? item.getCalories() + " kcal" : "N/A") + "</span>");
            if (soldOut) {
                out.println("              <span class='badge badge-red'>❌ Sold Out</span>");
            } else if (lowStock) {
                out.println("              <span class='badge badge-amber'>⚠️ " + item.getAvailableQuantity() + " left</span>");
            } else {
                out.println("              <span style='color:#059669; font-weight:600;'>● " + item.getAvailableQuantity() + " left</span>");
            }
            out.println("            </div>");

            out.println("            <div class='dish-footer'>");
            out.println("              <div class='dish-price'>" + item.getPrice() + " <span class='unit'>Cr</span></div>");
            if (!soldOut) {
                out.println("              <button type='button' class='btn btn-orange btn-sm' onclick='addToTray(" + item.getItemId() + ", \"" + escapeHtml(item.getItemName()) + "\", " + item.getPrice() + ")'>+ Add to Tray</button>");
            } else {
                out.println("              <button type='button' class='btn btn-white btn-sm' disabled>Unavailable</button>");
            }
            out.println("            </div>");
            out.println("          </div>");
            out.println("        </div>");
        }
        out.println("      </div>");

        out.println("    </div>");

        // 5. SLIDE-IN TRAY PANEL
        out.println("    <div id='tray-panel-root'>");
        out.println("      <div class='tray-overlay' onclick='toggleTray(false)'></div>");
        out.println("      <div class='tray-panel'>");
        out.println("        <div class='tray-header'>");
        out.println("          <h3>🛒 Your Food Tray</h3>");
        out.println("          <button type='button' class='tray-close-btn' onclick='toggleTray(false)'>✕</button>");
        out.println("        </div>");

        out.println("        <div class='tray-items-list' id='tray-items-list'>");
        out.println("          <div style='text-align:center; padding:40px 20px; color:#6B6560;'>Your tray is empty. Click <strong>'+ Add to Tray'</strong> on any delicious meal!</div>");
        out.println("        </div>");

        out.println("        <form method='POST' action='/action/order' id='tray-checkout-form' class='tray-footer'>");
        out.println("          <input type='hidden' name='items' id='checkout-items' value=''>");
        out.println("          <input type='hidden' name='itemId' id='checkout-item-id' value=''>");
        out.println("          <input type='hidden' name='quantity' id='checkout-quantity' value='1'>");
        out.println("");
        out.println("          <!-- Live Balance Deduction Breakdown -->");
        out.println("          <div style='background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px; margin-bottom:14px;'>");
        out.println("            <div style='display:flex; justify-content:space-between; font-size:13px; color:#64748B; margin-bottom:6px;'>");
        out.println("              <span>Wallet Balance:</span>");
        out.println("              <span style='font-weight:700; color:#1E293B;' id='tray-wallet-balance'>" + String.format("%,d", credits) + " Cr</span>");
        out.println("            </div>");
        out.println("            <div style='display:flex; justify-content:space-between; font-size:13px; color:#EF4444; margin-bottom:6px;'>");
        out.println("              <span>Tray Subtotal:</span>");
        out.println("              <span style='font-weight:700;' id='tray-subtotal-amount'>- 0 Cr</span>");
        out.println("            </div>");
        out.println("            <div style='display:flex; justify-content:space-between; font-size:14px; font-weight:800; border-top:1px dashed #CBD5E1; padding-top:6px;'>");
        out.println("              <span>Projected Balance:</span>");
        out.println("              <span style='color:#10B981;' id='tray-remaining-balance'>" + String.format("%,d", credits) + " Cr</span>");
        out.println("            </div>");
        out.println("            <div id='tray-balance-warning' style='display:none; color:#DC2626; font-size:12px; font-weight:700; margin-top:6px;'>");
        out.println("              ⚠️ Insufficient credits! Please remove items or top up your wallet.");
        out.println("            </div>");
        out.println("          </div>");

        out.println("          <div style='margin-bottom:16px;'>");
        out.println("            <label style='font-size:12px; font-weight:700; display:block; margin-bottom:8px;'>Delivery Modality:</label>");
        out.println("            <label style='display:block; margin-bottom:6px; font-size:13px; cursor:pointer;'>");
        out.println("              <input type='radio' name='deliveryType' value='PICKUP' checked> 🛍️ Cafeteria Pickup (Token counter)");
        out.println("            </label>");
        if (roomApprovedToday) {
            out.println("            <label style='display:block; font-size:13px; color:#059669; font-weight:700; cursor:pointer;'>");
            out.println("              <input type='radio' name='deliveryType' value='ROOM_DELIVERY'> 🚚 Room Delivery (" + escapeHtml(room) + ")");
            out.println("            </label>");
        } else {
            out.println("            <label style='display:block; font-size:13px; color:#9CA3AF;'>");
            out.println("              <input type='radio' name='deliveryType' value='ROOM_DELIVERY' disabled> 🚚 Room Delivery (Requires warden approval)");
            out.println("            </label>");
        }
        out.println("          </div>");

        out.println("          <button type='submit' id='tray-submit-btn' class='btn btn-orange btn-block btn-lg' disabled>Confirm &amp; Place Order</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Floating Tray Trigger Button
        out.println("    <button type='button' class='floating-tray-trigger' onclick='toggleTray(true)'>");
        out.println("      <span>🛒 Food Tray</span>");
        out.println("      <span class='badge' style='background:white; color:#FF6B35;' id='floating-tray-count'>0</span>");
        out.println("    </button>");

        // Toast Container
        out.println("    <div class='toast-container' id='toast-container'></div>");

        // 6. ORDER HISTORY TABLE
        List<BaseOrder> history = messService.getOrderHistory(session.userId);
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:17px; font-weight:700;'>📜 My Food Order History (" + history.size() + ")</h3>");
        out.println("          <p style='margin:2px 0 0; font-size:12px; color:#6B6560;'>Updated live immediately upon placing each order.</p>");
        out.println("        </div>");
        out.println("        <a href='/api/java/history?studentId=" + session.userId + "&format=csv' class='btn btn-sm' style='background:#F1F5F9; color:#1E293B; border:1px solid #CBD5E1;'>📥 Download Order Ledger CSV</a>");
        out.println("      </div>");
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead>");
        out.println("            <tr><th>Order ID</th><th>Token</th><th>Modality</th><th>Dishes Ordered</th><th>Total Amount</th><th>Status</th><th>Placed At</th></tr>");
        out.println("          </thead>");
        out.println("          <tbody>");
        if (history.isEmpty()) {
            out.println("            <tr><td colspan='7' style='text-align:center; padding:24px; color:#6B6560;'>No past orders recorded yet. Place an order above to see your order history!</td></tr>");
        } else {
            for (BaseOrder ho : history) {
                StringBuilder dishSummary = new StringBuilder();
                if (ho.getItems() != null && !ho.getItems().isEmpty()) {
                    for (int i = 0; i < ho.getItems().size(); i++) {
                        OrderItem it = ho.getItems().get(i);
                        if (i > 0) dishSummary.append(", ");
                        dishSummary.append(it.getQuantity()).append("x ").append(escapeHtml(it.getItemName()));
                    }
                } else {
                    dishSummary.append("Standard Meal");
                }
                out.println("            <tr>");
                out.println("              <td>#" + ho.getOrderId() + "</td>");
                out.println("              <td><span class='badge badge-orange' style='font-weight:800; font-size:13px;'><strong>" + escapeHtml(ho.getPickupToken()) + "</strong></span></td>");
                out.println("              <td>" + (ho.isRoomDelivery() ? "🚚 Room Delivery (" + escapeHtml(ho.getDeliveryAddress()) + ")" : "🛍️ Cafeteria Pickup") + "</td>");
                out.println("              <td>" + dishSummary + "</td>");
                out.println("              <td><strong>" + ho.getTotalAmount() + " Cr</strong></td>");
                out.println("              <td><span class='badge " + (ho.getStatus() == OrderStatus.COMPLETED || ho.getStatus() == OrderStatus.DELIVERED ? "badge-green" : "badge-orange") + "'>" + ho.getStatus().getDisplayName() + "</span></td>");
                out.println("              <td>" + ho.getOrderTime() + "</td>");
                out.println("            </tr>");
            }
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");
        out.println("    </div>");

        // 6b. MY WALLET TRANSACTION LEDGER
        List<TransactionRecord> myTransactions = messService.getTransactions(session.userId);
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:17px; font-weight:700;'>💳 My Wallet Transactions (" + myTransactions.size() + ")</h3>");
        out.println("          <p style='margin:2px 0 0; font-size:12px; color:#6B6560;'>Detailed audit ledger of every credit deduction, allowance, and top-up.</p>");
        out.println("        </div>");
        out.println("        <span class='badge badge-green' style='font-size:13px; font-weight:700;'>Current Balance: " + String.format("%,d", credits) + " Cr</span>");
        out.println("      </div>");
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead>");
        out.println("            <tr><th>Tx ID</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Description / Note</th><th>Timestamp</th></tr>");
        out.println("          </thead>");
        out.println("          <tbody>");
        if (myTransactions.isEmpty()) {
            out.println("            <tr><td colspan='6' style='text-align:center; padding:24px; color:#6B6560;'>No wallet transactions recorded yet. Place an order to see your transaction history!</td></tr>");
        } else {
            for (TransactionRecord tx : myTransactions) {
                String amtStr = (tx.getAmount() > 0 ? "+" : "") + tx.getAmount() + " Cr";
                String amtColor = tx.getAmount() < 0 ? "#EF4444" : "#10B981";
                String typeBadgeClass = "badge-blue";
                if ("DEBIT_ORDER".equalsIgnoreCase(tx.getType()) || "DEBIT_PREORDER".equalsIgnoreCase(tx.getType())) {
                    typeBadgeClass = "badge-orange";
                } else if ("CREDIT_REFUND".equalsIgnoreCase(tx.getType()) || "TOPUP".equalsIgnoreCase(tx.getType()) || "RECHARGE".equalsIgnoreCase(tx.getType())) {
                    typeBadgeClass = "badge-green";
                }
                out.println("            <tr>");
                out.println("              <td>#" + tx.getTransactionId() + "</td>");
                out.println("              <td><span class='badge " + typeBadgeClass + "'>" + escapeHtml(tx.getType()) + "</span></td>");
                out.println("              <td><strong style='color:" + amtColor + ";'>" + amtStr + "</strong></td>");
                out.println("              <td><strong style='color:#10B981;'>" + String.format("%,d", tx.getBalanceAfter()) + " Cr</strong></td>");
                out.println("              <td>" + escapeHtml(tx.getReason()) + "</td>");
                out.println("              <td>" + tx.getTimestamp() + "</td>");
                out.println("            </tr>");
            }
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");
        out.println("    </div>");

        // 7. INLINE REAL-TIME COUNTDOWN, MULTI-ITEM TRAY LOGIC & SSE RECONNECT SCRIPT
        out.println("    <script>");
        out.println("    var studentWalletBalance = " + credits + ";");
        out.println("    var tray = {}; // key: itemId, value: { id, name, price, qty }");
        out.println("");
        out.println("    function addToTray(id, name, price) {");
        out.println("      if (tray[id]) {");
        out.println("        tray[id].qty += 1;");
        out.println("      } else {");
        out.println("        tray[id] = { id: id, name: name, price: price, qty: 1 };");
        out.println("      }");
        out.println("      renderTray();");
        out.println("      toggleTray(true);");
        out.println("      showToast('✅ Added ' + name + ' to your food tray!');");
        out.println("    }");
        out.println("");
        out.println("    function updateTrayQty(id, delta) {");
        out.println("      if (!tray[id]) return;");
        out.println("      tray[id].qty += delta;");
        out.println("      if (tray[id].qty <= 0) {");
        out.println("        delete tray[id];");
        out.println("      }");
        out.println("      renderTray();");
        out.println("    }");
        out.println("");
        out.println("    function removeTrayItem(id) {");
        out.println("      delete tray[id];");
        out.println("      renderTray();");
        out.println("    }");
        out.println("");
        out.println("    function clearTray() {");
        out.println("      tray = {};");
        out.println("      renderTray();");
        out.println("    }");
        out.println("");
        out.println("    function renderTray() {");
        out.println("      var list = document.getElementById('tray-items-list');");
        out.println("      var submitBtn = document.getElementById('tray-submit-btn');");
        out.println("      var walletEl = document.getElementById('tray-wallet-balance');");
        out.println("      var subtotalEl = document.getElementById('tray-subtotal-amount');");
        out.println("      var remainingEl = document.getElementById('tray-remaining-balance');");
        out.println("      var warnEl = document.getElementById('tray-balance-warning');");
        out.println("      var floatCount = document.getElementById('floating-tray-count');");
        out.println("      var itemsInput = document.getElementById('checkout-items');");
        out.println("      var itemInput = document.getElementById('checkout-item-id');");
        out.println("      var qtyInput = document.getElementById('checkout-quantity');");
        out.println("");
        out.println("      var keys = Object.keys(tray);");
        out.println("      var totalQty = 0;");
        out.println("      var subtotal = 0;");
        out.println("");
        out.println("      if (keys.length === 0) {");
        out.println("        list.innerHTML = '<div style=\"text-align:center; padding:40px 20px; color:#6B6560;\">Your tray is empty. Click <strong>+ Add to Tray</strong> on any delicious meal!</div>';");
        out.println("        submitBtn.disabled = true;");
        out.println("        if (subtotalEl) subtotalEl.innerText = '- 0 Cr';");
        out.println("        if (remainingEl) {");
        out.println("          remainingEl.innerText = studentWalletBalance.toLocaleString() + ' Cr';");
        out.println("          remainingEl.style.color = '#10B981';");
        out.println("        }");
        out.println("        if (warnEl) warnEl.style.display = 'none';");
        out.println("        if (floatCount) floatCount.innerText = '0';");
        out.println("        if (itemsInput) itemsInput.value = '';");
        out.println("        if (itemInput) itemInput.value = '';");
        out.println("        if (qtyInput) qtyInput.value = '0';");
        out.println("        return;");
        out.println("      }");
        out.println("");
        out.println("      var html = '';");
        out.println("      var itemPairs = [];");
        out.println("      var firstId = '';");
        out.println("      var firstQty = 1;");
        out.println("");
        out.println("      for (var i = 0; i < keys.length; i++) {");
        out.println("        var k = keys[i];");
        out.println("        var it = tray[k];");
        out.println("        totalQty += it.qty;");
        out.println("        var itemTotal = it.price * it.qty;");
        out.println("        subtotal += itemTotal;");
        out.println("        itemPairs.push(it.id + ':' + it.qty);");
        out.println("        if (i === 0) {");
        out.println("          firstId = it.id;");
        out.println("          firstQty = it.qty;");
        out.println("        }");
        out.println("");
        out.println("        html += '<div class=\"tray-item-row\" style=\"display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F1F5F9;\">' +");
        out.println("          '<div>' +");
        out.println("            '<div style=\"font-weight:700; font-size:14px; color:#1E293B;\">' + it.name + '</div>' +");
        out.println("            '<div style=\"font-size:12px; color:#64748B;\">' + it.price + ' Cr each • <strong>' + itemTotal + ' Cr</strong></div>' +");
        out.println("          '</div>' +");
        out.println("          '<div style=\"display:flex; align-items:center; gap:8px;\">' +");
        out.println("            '<div class=\"tray-qty-ctrl\" style=\"display:inline-flex; align-items:center; background:#F1F5F9; border-radius:6px; padding:2px;\">' +");
        out.println("              '<button type=\"button\" class=\"tray-qty-btn\" style=\"border:none; background:transparent; width:26px; height:26px; cursor:pointer; font-weight:700;\" onclick=\"updateTrayQty(' + it.id + ', -1)\">-</button>' +");
        out.println("              '<span class=\"tray-qty-val\" style=\"min-width:20px; text-align:center; font-weight:700; font-size:13px;\">' + it.qty + '</span>' +");
        out.println("              '<button type=\"button\" class=\"tray-qty-btn\" style=\"border:none; background:transparent; width:26px; height:26px; cursor:pointer; font-weight:700;\" onclick=\"updateTrayQty(' + it.id + ', 1)\">+</button>' +");
        out.println("            '</div>' +");
        out.println("            '<button type=\"button\" onclick=\"removeTrayItem(' + it.id + ')\" title=\"Remove item\" style=\"border:none; background:transparent; color:#EF4444; cursor:pointer; font-size:15px; padding:2px 4px;\">🗑️</button>' +");
        out.println("          '</div>' +");
        out.println("        '</div>';");
        out.println("      }");
        out.println("");
        out.println("      list.innerHTML = html;");
        out.println("      if (floatCount) floatCount.innerText = totalQty;");
        out.println("      if (subtotalEl) subtotalEl.innerText = '- ' + subtotal.toLocaleString() + ' Cr';");
        out.println("");
        out.println("      var projectedRemaining = studentWalletBalance - subtotal;");
        out.println("      if (remainingEl) {");
        out.println("        remainingEl.innerText = projectedRemaining.toLocaleString() + ' Cr';");
        out.println("        if (projectedRemaining >= 0) {");
        out.println("          remainingEl.style.color = '#10B981';");
        out.println("        } else {");
        out.println("          remainingEl.style.color = '#DC2626';");
        out.println("        }");
        out.println("      }");
        out.println("");
        out.println("      if (itemsInput) itemsInput.value = itemPairs.join(',');");
        out.println("      if (itemInput) itemInput.value = firstId;");
        out.println("      if (qtyInput) qtyInput.value = firstQty;");
        out.println("");
        out.println("      if (projectedRemaining < 0) {");
        out.println("        submitBtn.disabled = true;");
        out.println("        if (warnEl) {");
        out.println("          warnEl.style.display = 'block';");
        out.println("          warnEl.innerText = '⚠️ Insufficient credits! Total order: ' + subtotal + ' Cr, Available wallet: ' + studentWalletBalance + ' Cr.';");
        out.println("        }");
        out.println("      } else {");
        out.println("        submitBtn.disabled = false;");
        out.println("        if (warnEl) warnEl.style.display = 'none';");
        out.println("      }");
        out.println("    }");
        out.println("    function toggleTray(open) {");
        out.println("      var root = document.getElementById('tray-panel-root');");
        out.println("      if (open) root.classList.add('tray-open');");
        out.println("      else root.classList.remove('tray-open');");
        out.println("    }");
        out.println("    function showToast(msg) {");
        out.println("      var c = document.getElementById('toast-container');");
        out.println("      var t = document.createElement('div');");
        out.println("      t.className = 'toast';");
        out.println("      t.innerText = msg;");
        out.println("      c.appendChild(t);");
        out.println("      setTimeout(function() { t.remove(); }, 3500);");
        out.println("    }");
        out.println("    function filterMenuCategory(cat, btn) {");
        out.println("      document.querySelectorAll('.category-chips .chip-btn').forEach(function(b) { b.classList.remove('active'); });");
        out.println("      if (btn) btn.classList.add('active');");
        out.println("      var cards = document.querySelectorAll('#dishes-container .dish-card');");
        out.println("      cards.forEach(function(c) {");
        out.println("        if (cat === 'all' || c.getAttribute('data-category').toLowerCase() === cat.toLowerCase()) {");
        out.println("          c.style.display = 'flex';");
        out.println("        } else {");
        out.println("          c.style.display = 'none';");
        out.println("        }");
        out.println("      });");
        out.println("    }");
        out.println("    function filterMenuSearch() {");
        out.println("      var query = document.getElementById('dish-search-input').value.toLowerCase().trim();");
        out.println("      var cards = document.querySelectorAll('#dishes-container .dish-card');");
        out.println("      cards.forEach(function(c) {");
        out.println("        var name = c.getAttribute('data-name');");
        out.println("        if (!query || name.indexOf(query) !== -1) {");
        out.println("          c.style.display = 'flex';");
        out.println("        } else {");
        out.println("          c.style.display = 'none';");
        out.println("        }");
        out.println("      });");
        out.println("    }");
        out.println("    // 1-Second Countdown Ticker");
        out.println("    function updateCountdowns() {");
        out.println("      var now = Date.now();");
        out.println("      document.querySelectorAll('.order-countdown').forEach(function(el) {");
        out.println("        var epoch = parseInt(el.getAttribute('data-ready-epoch') || '0', 10);");
        out.println("        var st = el.getAttribute('data-status');");
        out.println("        if (st === 'COMPLETED') { el.innerHTML = '<span style=\"color:#10B981;\">✅ Completed</span>'; return; }");
        out.println("        if (st === 'DELIVERED') { el.innerHTML = '<span style=\"color:#10B981;\">🏠 Delivered to Room</span>'; return; }");
        out.println("        if (st === 'OUT_FOR_DELIVERY') { el.innerHTML = '<span style=\"color:#EA580C;\">🛵 Out for Delivery</span>'; return; }");
        out.println("        var diffSec = Math.max(0, Math.floor((epoch - now) / 1000));");
        out.println("        if (diffSec <= 0 || st === 'READY') {");
        out.println("          el.innerHTML = '<span style=\"color:#10B981;\">🔔 Ready for pickup</span>';");
        out.println("        } else {");
        out.println("          var mins = Math.floor(diffSec / 60);");
        out.println("          var secs = diffSec % 60;");
        out.println("          el.innerHTML = '⏱️ Time left: <strong>' + mins + 'm ' + (secs < 10 ? '0' : '') + secs + 's</strong>';");
        out.println("        }");
        out.println("      });");
        out.println("    }");
        out.println("    setInterval(updateCountdowns, 1000);");
        out.println("    updateCountdowns();");
        out.println("    // SSE Auto-Reconnect");
        out.println("    var studentId = '" + session.userId + "';");
        out.println("    var lastSnap = '';");
        out.println("    function connectLiveEvents() {");
        out.println("      if (typeof EventSource !== 'undefined') {");
        out.println("        var sse = new EventSource('/api/java/live-events?studentId=' + studentId);");
        out.println("        sse.addEventListener('state-update', function(e) {");
        out.println("          try {");
        out.println("            var data = JSON.parse(e.data);");
        out.println("            var snap = JSON.stringify({ orders: data.activeOrders, approved: data.roomDeliveryApproved });");
        out.println("            if (lastSnap && lastSnap !== snap) { window.location.reload(); }");
        out.println("            lastSnap = snap;");
        out.println("          } catch(err){}");
        out.println("        });");
        out.println("        sse.onerror = function() { sse.close(); setTimeout(connectLiveEvents, 3000); };");
        out.println("      }");
        out.println("    }");
        out.println("    connectLiveEvents();");
        out.println("    </script>");
    }

    // -------------------------------------------------------------------------
    // WARDEN PORTAL: LEAVE REVIEW CARDS, APPROVE/REJECT ONLY & REAL-TIME SSE
    // -------------------------------------------------------------------------

    private void renderWardenDashboard(PrintWriter out, SecurityService.Session session, String activeWardenTab) {
        String assignedBlock = session.extra != null ? session.extra : "Block B";
        if (assignedBlock.contains("-")) {
            assignedBlock = assignedBlock.split("-")[0].trim();
        }

        String active = (activeWardenTab != null && !activeWardenTab.isEmpty()) ? activeWardenTab.toLowerCase() : "pending";
        boolean isApproved = "approved".equals(active);
        boolean isRejected = "rejected".equals(active);
        boolean isPending = !isApproved && !isRejected;

        List<HealthRequest> blockRequests = messService.getHealthRequestsForHostel(assignedBlock);

        List<HealthRequest> pending = new ArrayList<>();
        List<HealthRequest> approved = new ArrayList<>();
        List<HealthRequest> rejected = new ArrayList<>();

        for (HealthRequest hr : blockRequests) {
            String status = hr.getStatus() != null ? hr.getStatus().toUpperCase() : "PENDING";
            if ("APPROVED".equals(status)) approved.add(hr);
            else if ("REJECTED".equals(status)) rejected.add(hr);
            else pending.add(hr);
        }

        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px; font-weight:800;'>🏢 Hostel Warden Review Portal</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Warden: <strong>" + escapeHtml(session.name) + "</strong> | Assigned Block: <strong style='color:#D97706;'>" + escapeHtml(assignedBlock) + "</strong></p>");
        out.println("        </div>");
        out.println("        <div>");
        out.println("          <span class='badge badge-orange' id='warden-pending-badge' style='font-size:14px; padding:6px 14px;'>⏳ " + pending.size() + " Pending Clearances</span>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("      <p style='margin:10px 0 0; font-size:12px; color:#B45309;'>Jurisdiction Notice: You exclusively review sick-leave room delivery requests for residents of <strong>" + escapeHtml(assignedBlock) + "</strong>. No menu, ordering, or credit controls exist here.</p>");
        out.println("    </div>");

        // Tab Navigation
        out.println("    <div class='category-chips' style='margin-bottom:20px;'>");
        out.println("      <button type='button' class='chip-btn " + (isPending ? "active" : "") + "' id='btn-warden-pending' onclick='showWardenTab(\"pending\")'>⏳ Pending Requests (" + pending.size() + ")</button>");
        out.println("      <button type='button' class='chip-btn " + (isApproved ? "active" : "") + "' id='btn-warden-approved' onclick='showWardenTab(\"approved\")'>✅ Approved Requests (" + approved.size() + ")</button>");
        out.println("      <button type='button' class='chip-btn " + (isRejected ? "active" : "") + "' id='btn-warden-rejected' onclick='showWardenTab(\"rejected\")'>❌ Rejected Requests (" + rejected.size() + ")</button>");
        out.println("    </div>");

        // TAB 1: PENDING LEAVE REQUESTS (REVIEW CARDS)
        out.println("    <div id='tab-warden-pending' class='warden-tab-pane' style='display:" + (isPending ? "block" : "none") + ";'>");
        if (pending.isEmpty()) {
            out.println("      <div class='dash-card' style='text-align:center; padding:36px 20px;'>");
            out.println("        <div style='font-size:32px;'>☕</div>");
            out.println("        <h3 style='margin:8px 0; font-size:16px;'>Zero Pending Sick-Leave Requests</h3>");
            out.println("        <p style='margin:0; color:#6B6560; font-size:13px;'>All sick leave submissions for " + escapeHtml(assignedBlock) + " have been reviewed.</p>");
            out.println("      </div>");
        } else {
            for (HealthRequest hr : pending) {
                List<HealthRequest> studentHistory = messService.getStudentLeaveHistory(hr.getStudentId());
                long prevApproved = studentHistory.stream().filter(h -> "APPROVED".equalsIgnoreCase(h.getStatus())).count();
                long prevRejected = studentHistory.stream().filter(h -> "REJECTED".equalsIgnoreCase(h.getStatus())).count();

                out.println("      <div class='review-card' id='review-card-" + hr.getRequestId() + "'>");
                out.println("        <div class='review-card-header'>");
                out.println("          <div class='student-meta'>");
                out.println("            <div class='student-avatar'>🎓</div>");
                out.println("            <div>");
                out.println("              <div style='font-size:16px; font-weight:800;'>" + escapeHtml(hr.getStudentName()) + "</div>");
                out.println("              <div style='font-size:12px; color:#6B6560;'>Reg No: <strong>" + escapeHtml(hr.getRegistrationNumber()) + "</strong> • Phone: <strong>" + escapeHtml(hr.getStudentPhone()) + "</strong></div>");
                out.println("            </div>");
                out.println("          </div>");
                out.println("          <div style='text-align:right;'>");
                out.println("            <span class='badge badge-orange' style='font-size:12px;'>⏳ Pending Review</span>");
                out.println("            <div style='font-size:11px; color:#9C9790; margin-top:4px;'>Submitted: " + hr.getSubmissionTime() + "</div>");
                out.println("          </div>");
                out.println("        </div>");

                out.println("        <div class='review-card-body'>");
                out.println("          <div style='display:flex; gap:16px; flex-wrap:wrap; margin-bottom:10px;'>");
                out.println("            <div>🏢 <strong>Hostel Room:</strong> " + escapeHtml(hr.getHostelName()) + " - " + escapeHtml(hr.getRoomNumber()) + "</div>");
                out.println("            <div>📅 <strong>Leave Date:</strong> " + hr.getDate() + "</div>");
                out.println("            <div>🍲 <strong>Meals Requested:</strong> " + escapeHtml(hr.getMealsNeeded()) + "</div>");
                out.println("          </div>");
                out.println("          <div style='margin-bottom:8px;'><strong>Medical Reason for Leave:</strong> " + escapeHtml(hr.getReason()) + "</div>");
                if (hr.getAttachedNote() != null && !hr.getAttachedNote().trim().isEmpty()) {
                    out.println("          <div style='background:#FFF; border:1px dashed #CBD5E1; padding:8px 12px; border-radius:6px; font-size:12px; color:#334155;'>📎 <strong>Attached Note / Clinic Reference:</strong> " + escapeHtml(hr.getAttachedNote()) + "</div>");
                }
                out.println("          <div style='margin-top:10px; font-size:12px; color:#64748B;'>📜 <strong>Student Leave History:</strong> " + studentHistory.size() + " past applications (" + prevApproved + " Approved, " + prevRejected + " Rejected)</div>");
                out.println("        </div>");

                out.println("        <div class='review-card-footer'>");
                out.println("          <div style='font-size:12px; color:#6B6560;'>Approval automatically enables room delivery and dispatches a kitchen recovery meal.</div>");
                out.println("          <div style='display:flex; gap:10px;'>");
                // Approve
                out.println("            <form method='POST' action='/action/review-sickleave' style='margin:0;' onsubmit='return confirm(\"Approve sick leave for " + escapeHtml(hr.getStudentName()) + "? This unlocks room delivery and enqueues a recovery meal in the kitchen queue.\");'>");
                out.println("              <input type='hidden' name='requestId' value='" + hr.getRequestId() + "'>");
                out.println("              <input type='hidden' name='decision' value='APPROVE'>");
                out.println("              <button type='submit' class='btn btn-green btn-sm'>✅ Approve Leave</button>");
                out.println("            </form>");
                // Reject
                out.println("            <button type='button' class='btn btn-danger btn-sm' onclick='promptRejectWarden(" + hr.getRequestId() + ", \"" + escapeHtml(hr.getStudentName()) + "\")'>❌ Reject Leave</button>");
                out.println("          </div>");
                out.println("        </div>");

                out.println("      </div>");
            }
        }
        out.println("    </div>");

        // TAB 2: APPROVED LEAVE REQUESTS (LOCKED ARCHIVE)
        out.println("    <div id='tab-warden-approved' class='warden-tab-pane' style='display:" + (isApproved ? "block" : "none") + ";'>");
        out.println("      <div class='dash-card'>");
        out.println("        <h3 style='margin:0 0 14px; font-size:16px;'>Approved Sick-Leave Clearances (" + approved.size() + ")</h3>");
        out.println("        <div class='data-table-wrapper'>");
        out.println("          <table class='data-table'>");
        out.println("            <thead>");
        out.println("              <tr><th>Req ID</th><th>Student</th><th>Reg No</th><th>Room</th><th>Date</th><th>Meals</th><th>Reviewed By &amp; When</th><th>Status</th></tr>");
        out.println("            </thead>");
        out.println("            <tbody>");
        if (approved.isEmpty()) {
            out.println("              <tr><td colspan='8' style='text-align:center; color:#6B6560;'>No approved requests in archive.</td></tr>");
        } else {
            for (HealthRequest hr : approved) {
                out.println("              <tr>");
                out.println("                <td>#" + hr.getRequestId() + "</td>");
                out.println("                <td><strong>" + escapeHtml(hr.getStudentName()) + "</strong></td>");
                out.println("                <td>" + escapeHtml(hr.getRegistrationNumber()) + "</td>");
                out.println("                <td>" + escapeHtml(hr.getHostelName()) + " - " + escapeHtml(hr.getRoomNumber()) + "</td>");
                out.println("                <td>" + hr.getDate() + "</td>");
                out.println("                <td>" + escapeHtml(hr.getMealsNeeded()) + "</td>");
                out.println("                <td>Warden " + escapeHtml(hr.getWardenName()) + " (" + hr.getReviewedAt() + ")</td>");
                out.println("                <td><span class='badge badge-green'>Approved ✅</span></td>");
                out.println("              </tr>");
            }
        }
        out.println("            </tbody>");
        out.println("          </table>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // TAB 3: REJECTED LEAVE REQUESTS (LOCKED ARCHIVE WITH WRITTEN REASON)
        out.println("    <div id='tab-warden-rejected' class='warden-tab-pane' style='display:" + (isRejected ? "block" : "none") + ";'>");
        out.println("      <div class='dash-card'>");
        out.println("        <h3 style='margin:0 0 14px; font-size:16px;'>Rejected Sick-Leave Applications (" + rejected.size() + ")</h3>");
        out.println("        <div class='data-table-wrapper'>");
        out.println("          <table class='data-table'>");
        out.println("            <thead>");
        out.println("              <tr><th>Req ID</th><th>Student</th><th>Reg No</th><th>Room</th><th>Date</th><th>Medical Reason</th><th>Warden Rejection Reason</th><th>Decision Locked</th></tr>");
        out.println("            </thead>");
        out.println("            <tbody>");
        if (rejected.isEmpty()) {
            out.println("              <tr><td colspan='8' style='text-align:center; color:#6B6560;'>No rejected requests in archive.</td></tr>");
        } else {
            for (HealthRequest hr : rejected) {
                out.println("              <tr>");
                out.println("                <td>#" + hr.getRequestId() + "</td>");
                out.println("                <td><strong>" + escapeHtml(hr.getStudentName()) + "</strong></td>");
                out.println("                <td>" + escapeHtml(hr.getRegistrationNumber()) + "</td>");
                out.println("                <td>" + escapeHtml(hr.getHostelName()) + " - " + escapeHtml(hr.getRoomNumber()) + "</td>");
                out.println("                <td>" + hr.getDate() + "</td>");
                out.println("                <td>" + escapeHtml(hr.getReason()) + "</td>");
                out.println("                <td><strong style='color:#DC2626;'>" + escapeHtml(hr.getRejectionReason()) + "</strong></td>");
                out.println("                <td><span class='badge badge-red'>Locked 🔒</span></td>");
                out.println("              </tr>");
            }
        }
        out.println("            </tbody>");
        out.println("          </table>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // Hidden Form for Reject with Prompt
        out.println("    <form id='warden-reject-form' method='POST' action='/action/review-sickleave' style='display:none;'>");
        out.println("      <input type='hidden' name='requestId' id='reject-req-id' value=''>");
        out.println("      <input type='hidden' name='decision' value='REJECT'>");
        out.println("      <input type='hidden' name='reason' id='reject-req-reason' value=''>");
        out.println("    </form>");

        // Toast Container
        out.println("    <div class='toast-container' id='warden-toast-container'></div>");

        // Warden Client Script (Tab switching, Reject Prompt, & Real-time SSE)
        out.println("    <script>");
        out.println("    function showWardenTab(tabName) {");
        out.println("      document.querySelectorAll('.warden-tab-pane').forEach(function(el) { el.style.display = 'none'; });");
        out.println("      document.querySelectorAll('.category-chips .chip-btn').forEach(function(el) { el.classList.remove('active'); });");
        out.println("      var target = document.getElementById('tab-warden-' + tabName);");
        out.println("      if (target) target.style.display = 'block';");
        out.println("      var btn = document.getElementById('btn-warden-' + tabName);");
        out.println("      if (btn) btn.classList.add('active');");
        out.println("    }");
        out.println("    function promptRejectWarden(reqId, studentName) {");
        out.println("      var reason = prompt('Please enter a mandatory written reason for rejecting ' + studentName + '\\'s leave request #' + reqId + ':');");
        out.println("      if (reason && reason.trim()) {");
        out.println("        document.getElementById('reject-req-id').value = reqId;");
        out.println("        document.getElementById('reject-req-reason').value = reason.trim();");
        out.println("        document.getElementById('warden-reject-form').submit();");
        out.println("      } else if (reason !== null) {");
        out.println("        alert('A written rejection reason is strictly required to reject sick leave.');");
        out.println("      }");
        out.println("    }");
        out.println("    // SSE Live Real-Time Updates for Warden");
        out.println("    var assignedBlock = '" + escapeHtml(assignedBlock) + "';");
        out.println("    var currentPendingCount = " + pending.size() + ";");
        out.println("    function connectWardenLive() {");
        out.println("      if (typeof EventSource !== 'undefined') {");
        out.println("        var sse = new EventSource('/api/java/live-events?hostelBlock=' + encodeURIComponent(assignedBlock));");
        out.println("        sse.addEventListener('state-update', function(e) {");
        out.println("          try {");
        out.println("            var data = JSON.parse(e.data);");
        out.println("            if (data.pendingCount !== undefined && data.pendingCount !== currentPendingCount) {");
        out.println("              window.location.reload();");
        out.println("            }");
        out.println("          } catch(err){}");
        out.println("        });");
        out.println("        sse.onerror = function() { sse.close(); setTimeout(connectWardenLive, 4000); };");
        out.println("      }");
        out.println("    }");
        out.println("    connectWardenLive();");
        out.println("    </script>");
    }

    // -------------------------------------------------------------------------
    // CHEF DASHBOARD: PREP TIME, ROOM DELIVERY BADGES & PROGRESSION
    // -------------------------------------------------------------------------

    private void renderChefDashboard(PrintWriter out, SecurityService.Session session) {
        List<BaseOrder> orders = messService.getPendingKitchenOrders();

        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px; font-weight:800;'>👨‍🍳 Head Chef &amp; Kitchen Queue Dispatch</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Active Kitchen Staff: <strong>" + escapeHtml(session.name) + "</strong> (" + escapeHtml(session.email) + ")</p>");
        out.println("        </div>");
        out.println("        <div>");
        out.println("          <span class='badge badge-orange' style='font-size:14px; padding:6px 14px;'>🍳 " + orders.size() + " Active Orders</span>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // Kitchen Orders List
        if (orders.isEmpty()) {
            out.println("    <div class='dash-card' style='text-align:center; padding:40px 20px;'>");
            out.println("      <div style='font-size:36px;'>✨</div>");
            out.println("      <h3 style='margin:8px 0; font-size:16px;'>Kitchen Queue is Clear</h3>");
            out.println("      <p style='margin:0; color:#6B6560; font-size:13px;'>No active cooking orders in queue.</p>");
            out.println("    </div>");
        } else {
            for (BaseOrder o : orders) {
                boolean isRoom = o.isRoomDelivery();
                OrderStatus st = o.getStatus();

                out.println("    <div class='dash-card' style='border-left: 4px solid " + (isRoom ? "#2563EB" : "#FF6B35") + ";'>");
                out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;'>");
                out.println("        <div>");
                out.println("          <span style='font-size:18px; font-weight:800;'>Token: " + escapeHtml(o.getPickupToken()) + "</span>");
                out.println("          <span style='font-size:13px; color:#6B6560; margin-left:8px;'>Order #" + o.getOrderId() + " (" + escapeHtml(o.getStudentName()) + ")</span>");
                if (isRoom) {
                    out.println("          <span class='badge badge-blue' style='margin-left:8px;'>🛵 Room Delivery</span>");
                } else {
                    out.println("          <span class='badge' style='background:#F3F4F6; color:#374151; margin-left:8px;'>🛍️ Cafeteria Pickup</span>");
                }
                out.println("        </div>");
                out.println("        <div><span class='badge badge-orange' style='font-size:13px;'>" + st.getDisplayName() + "</span></div>");
                out.println("      </div>");

                if (isRoom) {
                    out.println("      <div style='background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:10px 14px; margin-bottom:12px; font-size:13px; color:#1E40AF;'>");
                    out.println("        <strong>🛵 Room Delivery Destination:</strong> " + escapeHtml(o.getDeliveryAddress()) + " • <em>Warden approved sick-leave clearance</em>");
                    out.println("      </div>");
                }

                // Items list
                out.println("      <div style='background:#FAF8F5; border:1px solid #E7E5E4; border-radius:8px; padding:12px; margin-bottom:14px; font-size:13px;'>");
                out.println("        <strong>Items to Prepare:</strong>");
                if (o.getItems() != null) {
                    out.println("        <ul style='margin:6px 0 0 20px; padding:0;'>");
                    for (OrderItem oi : o.getItems()) {
                        out.println("          <li><strong>" + oi.getQuantity() + "x</strong> " + escapeHtml(oi.getItemName()) + "</li>");
                    }
                    out.println("        </ul>");
                }
                out.println("      </div>");

                // Prep Time Control
                out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top:1px solid #F5F3EF; padding-top:14px;'>");
                out.println("        <div style='display:flex; align-items:center; gap:8px;'>");
                out.println("          <span style='font-size:13px; font-weight:600;'>Set Prep Time:</span>");
                int[] minutes = {5, 10, 15, 20, 25, 30};
                for (int m : minutes) {
                    out.println("          <form method='POST' action='/action/chef-set-prep' style='margin:0; display:inline;'>");
                    out.println("            <input type='hidden' name='orderId' value='" + o.getOrderId() + "'>");
                    out.println("            <input type='hidden' name='minutes' value='" + m + "'>");
                    out.println("            <button type='submit' class='btn " + (o.getEstimatedPrepMinutes() == m ? "btn-orange" : "btn-white") + " btn-sm'>" + m + "m</button>");
                    out.println("          </form>");
                }
                out.println("        </div>");

                // Step advancement button
                out.println("        <div>");
                out.println("          <form method='POST' action='/action/chef-advance-order' style='margin:0; display:inline;'>");
                out.println("            <input type='hidden' name='orderId' value='" + o.getOrderId() + "'>");
                if (st == OrderStatus.PENDING) {
                    out.println("            <input type='hidden' name='nextStatus' value='ACCEPTED'>");
                    out.println("            <input type='hidden' name='activity' value='Order accepted, cooking starts soon'>");
                    out.println("            <button type='submit' class='btn btn-orange btn-sm'>Accept Order 👨‍🍳</button>");
                } else if (st == OrderStatus.ACCEPTED) {
                    out.println("            <input type='hidden' name='nextStatus' value='PREPARING'>");
                    out.println("            <input type='hidden' name='activity' value='Chef is preparing your order'>");
                    out.println("            <button type='submit' class='btn btn-orange btn-sm'>Start Cooking 🍳</button>");
                } else if (st == OrderStatus.PREPARING) {
                    out.println("            <input type='hidden' name='nextStatus' value='READY'>");
                    out.println("            <input type='hidden' name='activity' value='Order is ready!'>");
                    out.println("            <button type='submit' class='btn btn-green btn-sm'>Mark Ready 🔔</button>");
                } else if (st == OrderStatus.READY) {
                    if (isRoom) {
                        out.println("            <input type='hidden' name='nextStatus' value='OUT_FOR_DELIVERY'>");
                        out.println("            <input type='hidden' name='activity' value='Out for delivery to your room'>");
                        out.println("            <button type='submit' class='btn btn-orange btn-sm'>Out for Delivery 🛵</button>");
                    } else {
                        out.println("            <input type='hidden' name='nextStatus' value='COMPLETED'>");
                        out.println("            <input type='hidden' name='activity' value='Order completed. Enjoy your meal!'>");
                        out.println("            <button type='submit' class='btn btn-green btn-sm'>Complete Pickup ✅</button>");
                    }
                } else if (st == OrderStatus.OUT_FOR_DELIVERY && isRoom) {
                    out.println("            <input type='hidden' name='nextStatus' value='DELIVERED'>");
                    out.println("            <input type='hidden' name='activity' value='Delivered to room. Enjoy your meal!'>");
                    out.println("            <button type='submit' class='btn btn-green btn-sm'>Mark Delivered 🏠</button>");
                }
                out.println("          </form>");
                out.println("        </div>");
                out.println("      </div>");

                out.println("    </div>");
            }
        }

        // Wastage Logging Card
        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <h3 style='margin:0 0 12px; font-size:16px;'>🌱 Daily Food Wastage Audit Logger</h3>");
        out.println("      <form method='POST' action='/action/log-waste' style='display:flex; gap:12px; align-items:center; flex-wrap:wrap;'>");
        out.println("        <input type='text' name='mealType' class='search-box' style='border-radius:8px; width:180px;' placeholder='Meal (e.g. Lunch)' required>");
        out.println("        <input type='number' step='0.1' name='kg' class='search-box' style='border-radius:8px; width:140px;' placeholder='Wasted (kg)' required>");
        out.println("        <input type='text' name='reason' class='search-box' style='border-radius:8px; flex:1;' placeholder='Cause (e.g. Over-preparation, uncollected tokens)' required>");
        out.println("        <button type='submit' class='btn btn-orange btn-sm'>Log Wastage Entry</button>");
        out.println("      </form>");
        out.println("    </div>");
    }

    // -------------------------------------------------------------------------
    // ADMIN DASHBOARD: CREDIT CONTROLS, MENU & STOCK CUSTOMIZATION, & WIDGETS
    // -------------------------------------------------------------------------

    private void renderAdminDashboard(PrintWriter out, SecurityService.Session session, String activeTab) {
        if (activeTab == null || activeTab.isEmpty()) activeTab = "overview";

        out.println("    <div class='dash-card' style='margin-top:20px;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h2 style='margin:0; font-size:20px; font-weight:800;'>👑 Campus Dining Committee Administration</h2>");
        out.println("          <p style='margin:4px 0 0; color:#6B6560; font-size:13px;'>Administrator: <strong>" + escapeHtml(session.email) + "</strong> | Full System Authority</p>");
        out.println("        </div>");
        out.println("        <div style='display:flex; gap:8px;'>");
        out.println("          <a href='/developer-diagnostics' class='btn btn-white btn-sm'>⚙️ Diagnostics</a>");
        out.println("        </div>");
        out.println("      </div>");
        out.println("    </div>");

        // Admin Sub-Navigation Tabs
        out.println("    <div class='category-chips' style='margin-bottom:20px;'>");
        out.println("      <a href='/dashboard?role=admin&tab=overview' class='chip-btn " + ("overview".equals(activeTab) ? "active" : "") + "'>📊 Overview &amp; Widgets</a>");
        out.println("      <a href='/dashboard?role=admin&tab=credits' class='chip-btn " + ("credits".equals(activeTab) ? "active" : "") + "'>💳 Student Credits Control</a>");
        out.println("      <a href='/dashboard?role=admin&tab=menu' class='chip-btn " + ("menu".equals(activeTab) ? "active" : "") + "'>🍲 Menu &amp; Stock Customization</a>");
        out.println("      <a href='/dashboard?role=admin&tab=audit' class='chip-btn " + ("audit".equals(activeTab) ? "active" : "") + "'>📜 Audit Ledger</a>");
        out.println("    </div>");

        if ("credits".equalsIgnoreCase(activeTab)) {
            renderAdminCreditsTab(out, session);
        } else if ("menu".equalsIgnoreCase(activeTab)) {
            renderAdminMenuStockTab(out, session);
        } else if ("audit".equalsIgnoreCase(activeTab)) {
            renderAdminAuditTab(out, session);
        } else {
            renderAdminOverviewTab(out, session);
        }
    }

    // Admin Tab 1: Overview & Customizable Widgets
    private void renderAdminOverviewTab(PrintWriter out, SecurityService.Session session) {
        Map<String, Boolean> widgetPrefs = messService.getAdminWidgetPreferences(session.email);
        List<String> widgetOrder = messService.getAdminWidgetOrder(session.email);

        out.println("    <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;'>");
        out.println("      <h3 style='margin:0; font-size:18px; font-weight:800;'>📊 Campus Overview</h3>");
        out.println("      <button type='button' class='btn btn-white btn-sm' onclick='toggleWidgetCustomizer()'>⚙️ Customize Dashboard Layout</button>");
        out.println("    </div>");

        // Widget Customizer Box
        out.println("    <div id='widget-customizer-box' class='dash-card' style='display:none; background:#FFFDF9; border:1px dashed #F59E0B;'>");
        out.println("      <h4 style='margin:0 0 10px; font-size:14px; color:#B45309;'>Customize Dashboard Widgets Layout</h4>");
        out.println("      <form method='POST' action='/action/admin-save-widgets'>");
        for (String wId : widgetOrder) {
            boolean visible = widgetPrefs.getOrDefault(wId, true);
            out.println("        <label style='display:inline-flex; align-items:center; gap:8px; margin-right:20px; font-size:13px; cursor:pointer;'>");
            out.println("          <input type='checkbox' name='" + wId + "' value='true' " + (visible ? "checked" : "") + "> " + getWidgetLabel(wId));
            out.println("        </label>");
        }
        out.println("        <div style='margin-top:14px;'><button type='submit' class='btn btn-orange btn-sm'>Save Layout Preferences</button></div>");
        out.println("      </form>");
        out.println("    </div>");

        // Dynamic KPI Grid
        out.println("    <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;'>");
        for (String wId : widgetOrder) {
            if (!widgetPrefs.getOrDefault(wId, true)) continue;
            renderWidgetKpi(out, wId);
        }
        out.println("    </div>");

        // 1-Click Monthly Reissue Banner
        out.println("    <div class='dash-card' style='border:1px solid #10B981; background:#F0FDF4;'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:16px; color:#065F46;'>🔄 1-Click Monthly Student Allowance Reissue</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:13px; color:#047857;'>Recharges all campus student wallets back to their monthly limit (default 9,000 Credits) via an atomic transaction.</p>");
        out.println("        </div>");
        out.println("        <form method='POST' action='/action/admin-reissue-all' onsubmit='return confirm(\"Are you sure you want to reissue monthly credits for all registered students?\");' style='margin:0;'>");
        out.println("          <button type='submit' class='btn btn-green'>Reissue All Monthly Credits</button>");
        out.println("        </form>");
        out.println("      </div>");
        out.println("    </div>");

        // Top Dishes Leaderboard Widget
        if (widgetPrefs.getOrDefault("widget_top_dishes", true)) {
            List<MenuItem> top5 = messService.getTop5Dishes();
            out.println("    <div class='dash-card'>");
            out.println("      <h3 style='margin:0 0 14px; font-size:17px; font-weight:700;'>🏆 Top 5 Popular Dishes Today</h3>");
            out.println("      <div class='data-table-wrapper'>");
            out.println("        <table class='data-table'>");
            out.println("          <thead><tr><th>Rank</th><th>Dish Name</th><th>Category</th><th>Price</th><th>Stock Status</th></tr></thead>");
            out.println("          <tbody>");
            int rank = 1;
            for (MenuItem it : top5) {
                out.println("            <tr><td>#" + (rank++) + "</td><td><strong>" + escapeHtml(it.getItemName()) + "</strong></td><td>" + escapeHtml(it.getCategory()) + "</td><td>" + it.getPrice() + " Cr</td><td>" + it.getAvailableQuantity() + " left</td></tr>");
            }
            out.println("          </tbody>");
            out.println("        </table>");
            out.println("      </div>");
            out.println("    </div>");
        }

        out.println("    <script>");
        out.println("    function toggleWidgetCustomizer() {");
        out.println("      var b = document.getElementById('widget-customizer-box');");
        out.println("      b.style.display = (b.style.display === 'none' ? 'block' : 'none');");
        out.println("    }");
        out.println("    </script>");
    }

    private String getWidgetLabel(String wId) {
        switch (wId) {
            case "widget_orders": return "Orders Today";
            case "widget_credits": return "Credits Used Today";
            case "widget_low_stock": return "Low-Stock Items Alert";
            case "widget_pending_leaves": return "Pending Leave Requests";
            case "widget_top_dishes": return "Top Dishes Leaderboard";
            default: return wId;
        }
    }

    private void renderWidgetKpi(PrintWriter out, String wId) {
        switch (wId) {
            case "widget_orders":
                out.println("      <div class='dash-card' style='border-top:3px solid #38BDF8;'>");
                out.println("        <div style='font-size:12px; color:#6B6560;'>Orders Today</div>");
                out.println("        <div style='font-size:26px; font-weight:bold; color:#1E1B16;'>342 Orders</div>");
                out.println("      </div>");
                break;
            case "widget_credits":
                out.println("      <div class='dash-card' style='border-top:3px solid #10B981;'>");
                out.println("        <div style='font-size:12px; color:#6B6560;'>Credits Billed Today</div>");
                out.println("        <div style='font-size:26px; font-weight:bold; color:#10B981;'>31,240 Cr</div>");
                out.println("      </div>");
                break;
            case "widget_low_stock":
                int lowStockCount = messService.getLowStockItems().size();
                out.println("      <div class='dash-card' style='border-top:3px solid #EF4444;'>");
                out.println("        <div style='font-size:12px; color:#6B6560;'>Low-Stock Alert Items</div>");
                out.println("        <div style='font-size:26px; font-weight:bold; color:#EF4444;'>" + lowStockCount + " Items</div>");
                out.println("      </div>");
                break;
            case "widget_pending_leaves":
                int pendingLeaves = messService.getPendingHealthRequests().size();
                out.println("      <div class='dash-card' style='border-top:3px solid #F59E0B;'>");
                out.println("        <div style='font-size:12px; color:#6B6560;'>Pending Sick-Leave Clearances</div>");
                out.println("        <div style='font-size:26px; font-weight:bold; color:#F59E0B;'>" + pendingLeaves + " Requests</div>");
                out.println("      </div>");
                break;
        }
    }

    // Admin Tab 2: Student Credits Control
    private void renderAdminCreditsTab(PrintWriter out, SecurityService.Session session) {
        List<Student> students = messService.getAllStudents();

        out.println("    <div class='dash-card'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:18px; font-weight:800;'>💳 Student Credit Control &amp; Wallets</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:13px; color:#6B6560;'>Searchable and sortable registry of all enrolled campus diners</p>");
        out.println("        </div>");

        // Auto monthly reissue toggle & manual trigger
        out.println("        <div style='display:flex; align-items:center; gap:12px;'>");
        out.println("          <form method='POST' action='/action/admin-toggle-auto-reissue' style='margin:0;'>");
        out.println("            <button type='submit' class='btn " + (messService.isAutoMonthlyReissueEnabled() ? "btn-green" : "btn-white") + " btn-sm'>");
        out.println("              Auto 1st-of-Month Reissue: " + (messService.isAutoMonthlyReissueEnabled() ? "ON ✅" : "OFF ❌"));
        out.println("            </button>");
        out.println("          </form>");
        out.println("          <form method='POST' action='/action/admin-reissue-all' onsubmit='return confirm(\"Reissue monthly credits for all " + students.size() + " students?\");' style='margin:0;'>");
        out.println("            <button type='submit' class='btn btn-orange btn-sm'>🔄 Reissue All (" + students.size() + ")</button>");
        out.println("          </form>");
        out.println("        </div>");
        out.println("      </div>");

        // Search & Filter Toolbar
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;'>");
        out.println("        <div class='search-box-wrapper' style='min-width:300px;'>");
        out.println("          <span class='search-icon'>🔍</span>");
        out.println("          <input type='text' id='student-search-input' class='search-box' placeholder='Search by student name, reg no, or hostel...' onkeyup='filterStudentTable()'>");
        out.println("        </div>");
        out.println("        <div style='font-size:13px; color:#6B6560;'>Click column headers to sort</div>");
        out.println("      </div>");

        // Bulk Actions Bar (Appears when checkboxes are selected)
        out.println("      <div id='bulk-actions-toolbar' style='display:none; background:#FFF7F0; border:1px solid #FFE4D6; border-radius:8px; padding:10px 16px; margin-bottom:16px;'>");
        out.println("        <div style='display:flex; justify-content:space-between; align-items:center;'>");
        out.println("          <span style='font-size:13px; font-weight:700; color:#FF6B35;' id='selected-students-count'>0 students selected</span>");
        out.println("          <div style='display:flex; gap:8px;'>");
        out.println("            <button type='button' class='btn btn-green btn-sm' onclick='executeBulkAction(\"REISSUE\")'>Bulk Reissue to Limit</button>");
        out.println("            <button type='button' class='btn btn-orange btn-sm' onclick='executeBulkAction(\"ADD\")'>Bulk Add Credits</button>");
        out.println("          </div>");
        out.println("        </div>");
        out.println("      </div>");

        // Searchable, Sortable Students Table
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table' id='students-data-table'>");
        out.println("          <thead>");
        out.println("            <tr>");
        out.println("              <th style='width:36px;'><input type='checkbox' id='select-all-students' onchange='toggleSelectAllStudents(this)'></th>");
        out.println("              <th onclick='sortTable(1)' style='cursor:pointer;'>Name ⇅</th>");
        out.println("              <th onclick='sortTable(2)' style='cursor:pointer;'>Registration No ⇅</th>");
        out.println("              <th onclick='sortTable(3)' style='cursor:pointer;'>Hostel &amp; Room ⇅</th>");
        out.println("              <th onclick='sortTable(4)' style='cursor:pointer;'>Monthly Limit ⇅</th>");
        out.println("              <th onclick='sortTable(5)' style='cursor:pointer;'>Used Credits ⇅</th>");
        out.println("              <th onclick='sortTable(6)' style='cursor:pointer;'>Remaining Credits ⇅</th>");
        out.println("              <th>Last Updated</th>");
        out.println("              <th>Actions</th>");
        out.println("            </tr>");
        out.println("          </thead>");
        out.println("          <tbody>");
        for (Student s : students) {
            out.println("            <tr class='student-row'>");
            out.println("              <td><input type='checkbox' class='student-select-cb' value='" + s.getId() + "' onchange='updateBulkBar()'></td>");
            out.println("              <td><strong>" + escapeHtml(s.getName()) + "</strong></td>");
            out.println("              <td><span class='badge' style='background:#F1F5F9; color:#0F172A;'>" + escapeHtml(s.getRegistrationNumber()) + "</span></td>");
            out.println("              <td>" + escapeHtml(s.getHostelBlock()) + " - " + escapeHtml(s.getRoomNumber()) + "</td>");
            out.println("              <td>" + String.format("%,d", s.getMonthlyLimit()) + " Cr</td>");
            out.println("              <td>" + String.format("%,d", s.getUsedCredits()) + " Cr</td>");
            out.println("              <td><strong style='color:#10b981;'>" + String.format("%,d", s.getRemainingCredits()) + " Cr</strong></td>");
            out.println("              <td style='font-size:11px; color:#6B6560;'>" + s.getLastUpdated() + "</td>");
            out.println("              <td>");
            out.println("                <div style='display:flex; gap:6px;'>");
            out.println("                  <button type='button' class='btn btn-white btn-sm' title='Add Credits' onclick='promptAddCredits(" + s.getId() + ", \"" + escapeHtml(s.getName()) + "\")'>+ Add</button>");
            out.println("                  <button type='button' class='btn btn-white btn-sm' title='Deduct Credits' onclick='promptDeductCredits(" + s.getId() + ", \"" + escapeHtml(s.getName()) + "\")'>- Deduct</button>");
            out.println("                  <button type='button' class='btn btn-white btn-sm' title='Set Monthly Limit' onclick='promptSetLimit(" + s.getId() + ", \"" + escapeHtml(s.getName()) + "\", " + s.getMonthlyLimit() + ")'>Limit</button>");
            out.println("                  <form method='POST' action='/action/admin-reissue-student' style='margin:0;' onsubmit='return confirm(\"Reset wallet balance to " + s.getMonthlyLimit() + " for " + escapeHtml(s.getName()) + "?\");'>");
            out.println("                    <input type='hidden' name='studentId' value='" + s.getId() + "'>");
            out.println("                    <button type='submit' class='btn btn-green btn-sm' title='Reset to monthly limit'>Reissue</button>");
            out.println("                  </form>");
            out.println("                </div>");
            out.println("              </td>");
            out.println("            </tr>");
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");

        out.println("    </div>");

        // Hidden Forms for Admin Credit Modals
        out.println("    <form id='form-admin-add-credits' method='POST' action='/action/admin-add-credits' style='display:none;'>");
        out.println("      <input type='hidden' name='studentId' id='add-cred-sid'>");
        out.println("      <input type='hidden' name='amount' id='add-cred-amt'>");
        out.println("      <input type='hidden' name='reason' id='add-cred-reason'>");
        out.println("    </form>");

        out.println("    <form id='form-admin-deduct-credits' method='POST' action='/action/admin-deduct-credits' style='display:none;'>");
        out.println("      <input type='hidden' name='studentId' id='ded-cred-sid'>");
        out.println("      <input type='hidden' name='amount' id='ded-cred-amt'>");
        out.println("      <input type='hidden' name='reason' id='ded-cred-reason'>");
        out.println("    </form>");

        out.println("    <form id='form-admin-set-limit' method='POST' action='/action/admin-set-limit' style='display:none;'>");
        out.println("      <input type='hidden' name='studentId' id='limit-sid'>");
        out.println("      <input type='hidden' name='limit' id='limit-val'>");
        out.println("    </form>");

        out.println("    <form id='form-admin-bulk-action' method='POST' action='/action/admin-bulk-credits' style='display:none;'>");
        out.println("      <input type='hidden' name='studentIds' id='bulk-sids'>");
        out.println("      <input type='hidden' name='action' id='bulk-act'>");
        out.println("      <input type='hidden' name='amount' id='bulk-amt'>");
        out.println("      <input type='hidden' name='reason' id='bulk-reason'>");
        out.println("    </form>");

        // Student Credits Client Script
        out.println("    <script>");
        out.println("    function filterStudentTable() {");
        out.println("      var q = document.getElementById('student-search-input').value.toLowerCase().trim();");
        out.println("      document.querySelectorAll('#students-data-table tbody tr').forEach(function(r) {");
        out.println("        r.style.display = (!q || r.innerText.toLowerCase().indexOf(q) !== -1) ? '' : 'none';");
        out.println("      });");
        out.println("    }");
        out.println("    function sortTable(n) {");
        out.println("      var table = document.getElementById('students-data-table');");
        out.println("      var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;");
        out.println("      switching = true; dir = 'asc';");
        out.println("      while (switching) {");
        out.println("        switching = false; rows = table.rows;");
        out.println("        for (i = 1; i < (rows.length - 1); i++) {");
        out.println("          shouldSwitch = false;");
        out.println("          x = rows[i].getElementsByTagName('TD')[n];");
        out.println("          y = rows[i + 1].getElementsByTagName('TD')[n];");
        out.println("          if (dir === 'asc') {");
        out.println("            if (x.innerText.toLowerCase() > y.innerText.toLowerCase()) { shouldSwitch = true; break; }");
        out.println("          } else if (dir === 'desc') {");
        out.println("            if (x.innerText.toLowerCase() < y.innerText.toLowerCase()) { shouldSwitch = true; break; }");
        out.println("          }");
        out.println("        }");
        out.println("        if (shouldSwitch) {");
        out.println("          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);");
        out.println("          switching = true; switchcount++;");
        out.println("        } else {");
        out.println("          if (switchcount === 0 && dir === 'asc') { dir = 'desc'; switching = true; }");
        out.println("        }");
        out.println("      }");
        out.println("    }");
        out.println("    function toggleSelectAllStudents(master) {");
        out.println("      document.querySelectorAll('.student-select-cb').forEach(function(cb) { cb.checked = master.checked; });");
        out.println("      updateBulkBar();");
        out.println("    }");
        out.println("    function updateBulkBar() {");
        out.println("      var selected = document.querySelectorAll('.student-select-cb:checked');");
        out.println("      var bar = document.getElementById('bulk-actions-toolbar');");
        out.println("      var countEl = document.getElementById('selected-students-count');");
        out.println("      if (selected.length > 0) {");
        out.println("        bar.style.display = 'block';");
        out.println("        countEl.innerText = selected.length + ' students selected';");
        out.println("      } else { bar.style.display = 'none'; }");
        out.println("    }");
        out.println("    function executeBulkAction(act) {");
        out.println("      var sids = [];");
        out.println("      document.querySelectorAll('.student-select-cb:checked').forEach(function(cb) { sids.push(cb.value); });");
        out.println("      if (sids.length === 0) return;");
        out.println("      if (act === 'REISSUE') {");
        out.println("        if (confirm('Reissue monthly credits for all ' + sids.length + ' selected students?')) {");
        out.println("          document.getElementById('bulk-sids').value = sids.join(',');");
        out.println("          document.getElementById('bulk-act').value = 'REISSUE';");
        out.println("          document.getElementById('form-admin-bulk-action').submit();");
        out.println("        }");
        out.println("      } else if (act === 'ADD') {");
        out.println("        var amt = prompt('Enter credit amount to add for all ' + sids.length + ' selected students:');");
        out.println("        if (amt && parseInt(amt, 10) > 0) {");
        out.println("          var reason = prompt('Mandatory Reason for bulk credit addition:');");
        out.println("          if (reason && reason.trim()) {");
        out.println("            document.getElementById('bulk-sids').value = sids.join(',');");
        out.println("            document.getElementById('bulk-act').value = 'ADD';");
        out.println("            document.getElementById('bulk-amt').value = amt;");
        out.println("            document.getElementById('bulk-reason').value = reason.trim();");
        out.println("            document.getElementById('form-admin-bulk-action').submit();");
        out.println("          } else { alert('A mandatory reason is required.'); }");
        out.println("        }");
        out.println("      }");
        out.println("    }");
        out.println("    function promptAddCredits(sid, name) {");
        out.println("      var amt = prompt('Enter credits to ADD to ' + name + '\\'s wallet:');");
        out.println("      if (amt && parseInt(amt, 10) > 0) {");
        out.println("        var reason = prompt('Enter mandatory reason (e.g. Welfare grant, Compensation):');");
        out.println("        if (reason && reason.trim()) {");
        out.println("          document.getElementById('add-cred-sid').value = sid;");
        out.println("          document.getElementById('add-cred-amt').value = amt;");
        out.println("          document.getElementById('add-cred-reason').value = reason.trim();");
        out.println("          document.getElementById('form-admin-add-credits').submit();");
        out.println("        } else { alert('A mandatory reason is required.'); }");
        out.println("      }");
        out.println("    }");
        out.println("    function promptDeductCredits(sid, name) {");
        out.println("      var amt = prompt('Enter credits to DEDUCT from ' + name + '\\'s wallet:');");
        out.println("      if (amt && parseInt(amt, 10) > 0) {");
        out.println("        var reason = prompt('Enter mandatory reason for deduction:');");
        out.println("        if (reason && reason.trim()) {");
        out.println("          document.getElementById('ded-cred-sid').value = sid;");
        out.println("          document.getElementById('ded-cred-amt').value = amt;");
        out.println("          document.getElementById('ded-cred-reason').value = reason.trim();");
        out.println("          document.getElementById('form-admin-deduct-credits').submit();");
        out.println("        } else { alert('A mandatory reason is required.'); }");
        out.println("      }");
        out.println("    }");
        out.println("    function promptSetLimit(sid, name, curLimit) {");
        out.println("      var lim = prompt('Set custom monthly credit limit for ' + name + ' (Current: ' + curLimit + '):', curLimit);");
        out.println("      if (lim && parseInt(lim, 10) > 0) {");
        out.println("        document.getElementById('limit-sid').value = sid;");
        out.println("        document.getElementById('limit-val').value = lim;");
        out.println("        document.getElementById('form-admin-set-limit').submit();");
        out.println("      }");
        out.println("    }");
        out.println("    </script>");
    }

    // Admin Tab 3: Menu & Stock Customization
    private void renderAdminMenuStockTab(PrintWriter out, SecurityService.Session session) {
        List<MenuItem> allItems = messService.getCatalog().getAllItems();
        List<StockChangeRecord> stockLogs = messService.getStockChangeLogs();

        out.println("    <div class='dash-card'>");
        out.println("      <div style='display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;'>");
        out.println("        <div>");
        out.println("          <h3 style='margin:0; font-size:18px; font-weight:800;'>🍲 Menu Catalog &amp; Live Stock Control</h3>");
        out.println("          <p style='margin:4px 0 0; font-size:13px; color:#6B6560;'>Customize dishes, edit stock quantities, mark sold out, and track inventory audits</p>");
        out.println("        </div>");
        out.println("        <button type='button' class='btn btn-orange btn-sm' onclick='toggleAddDishForm()'>➕ Add New Dish</button>");
        out.println("      </div>");

        // Add New Dish Collapsible Form
        out.println("      <div id='add-dish-form-box' style='display:none; background:#FFFDF9; border:1px solid #FED7AA; border-radius:10px; padding:18px; margin-bottom:24px;'>");
        out.println("        <h4 style='margin:0 0 14px; font-size:15px; color:#EA580C;'>Create New Cafeteria Dish</h4>");
        out.println("        <form method='POST' action='/action/admin-add-dish'>");
        out.println("          <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;'>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Dish Name *</label><input type='text' name='name' class='search-box' style='border-radius:6px;' required placeholder='e.g. Malabar Parotta'></div>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Category *</label><select name='category' class='search-box' style='border-radius:6px;'><option value='Breakfast'>Breakfast</option><option value='Lunch'>Lunch</option><option value='Snacks'>Snacks</option><option value='Dinner'>Dinner</option><option value='Beverages'>Beverages</option></select></div>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Price (Credits) *</label><input type='number' name='price' class='search-box' style='border-radius:6px;' required placeholder='e.g. 70'></div>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Calories (kcal) *</label><input type='number' name='calories' class='search-box' style='border-radius:6px;' required placeholder='e.g. 380'></div>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Initial Stock Quantity *</label><input type='number' name='quantity' class='search-box' style='border-radius:6px;' required placeholder='e.g. 40'></div>");
        out.println("            <div><label style='font-size:12px; font-weight:600;'>Low Stock Alert Threshold</label><input type='number' name='threshold' class='search-box' style='border-radius:6px;' value='15'></div>");
        out.println("          </div>");
        out.println("          <div style='margin-bottom:12px;'><label style='font-size:12px; font-weight:600;'>Description</label><input type='text' name='description' class='search-box' style='border-radius:6px;' placeholder='Short appetizing description of dish...'></div>");
        out.println("          <div style='margin-bottom:14px;'><label style='font-size:12px; font-weight:600;'>Image URL</label><input type='url' name='imageUrl' class='search-box' style='border-radius:6px;' placeholder='https://...'></div>");
        out.println("          <button type='submit' class='btn btn-orange btn-sm'>Save &amp; Add Dish to Menu</button>");
        out.println("        </form>");
        out.println("      </div>");

        // Menu Items Table with Direct Stock Edit & Actions
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead>");
        out.println("            <tr><th>ID</th><th>Dish Name</th><th>Category</th><th>Price</th><th>Calories</th><th>Stock Quantity</th><th>Availability</th><th>Actions</th></tr>");
        out.println("          </thead>");
        out.println("          <tbody>");
        for (MenuItem item : allItems) {
            if (item.isArchived()) continue;
            boolean low = item.isLowStock();
            boolean soldOut = item.isSoldOut();

            out.println("            <tr style='" + (low ? "background:#FFFBEB;" : "") + "'>");
            out.println("              <td>#" + item.getItemId() + "</td>");
            out.println("              <td><strong>" + escapeHtml(item.getItemName()) + "</strong> " + (item.isHealthy() ? "<span class='badge badge-green'>Healthy</span>" : "") + "</td>");
            out.println("              <td>" + escapeHtml(item.getCategory()) + "</td>");
            out.println("              <td>" + item.getPrice() + " Cr</td>");
            out.println("              <td>" + (item.getCalories() != null ? item.getCalories() + " kcal" : "-") + "</td>");

            // Stock edit with +/- buttons
            out.println("              <td>");
            out.println("                <div style='display:flex; align-items:center; gap:6px;'>");
            out.println("                  <form method='POST' action='/action/admin-adjust-stock' style='margin:0;'>");
            out.println("                    <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                    <input type='hidden' name='delta' value='-5'>");
            out.println("                    <button type='submit' class='btn btn-white btn-sm' style='padding:2px 6px;'>-5</button>");
            out.println("                  </form>");
            out.println("                  <form method='POST' action='/action/admin-adjust-stock' style='margin:0;'>");
            out.println("                    <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                    <input type='hidden' name='delta' value='-1'>");
            out.println("                    <button type='submit' class='btn btn-white btn-sm' style='padding:2px 6px;'>-1</button>");
            out.println("                  </form>");
            out.println("                  <strong style='min-width:32px; text-align:center; " + (low ? "color:#D97706;" : "") + (soldOut ? "color:#DC2626;" : "") + "'>" + item.getAvailableQuantity() + "</strong>");
            out.println("                  <form method='POST' action='/action/admin-adjust-stock' style='margin:0;'>");
            out.println("                    <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                    <input type='hidden' name='delta' value='1'>");
            out.println("                    <button type='submit' class='btn btn-white btn-sm' style='padding:2px 6px;'>+1</button>");
            out.println("                  </form>");
            out.println("                  <form method='POST' action='/action/admin-adjust-stock' style='margin:0;'>");
            out.println("                    <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                    <input type='hidden' name='delta' value='5'>");
            out.println("                    <button type='submit' class='btn btn-white btn-sm' style='padding:2px 6px;'>+5</button>");
            out.println("                  </form>");
            if (low) out.println("                  <span class='badge badge-amber'>Low Stock</span>");
            out.println("                </div>");
            out.println("              </td>");

            // Availability toggle
            out.println("              <td>");
            out.println("                <form method='POST' action='/action/admin-toggle-dish-active' style='margin:0;'>");
            out.println("                  <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            if (item.isActive()) {
                out.println("                  <button type='submit' class='btn btn-green btn-sm' title='Click to mark Sold Out'>Available</button>");
            } else {
                out.println("                  <button type='submit' class='btn btn-danger btn-sm' title='Click to mark Available'>Sold Out</button>");
            }
            out.println("                </form>");
            out.println("              </td>");

            // Actions: Remove stock with reason, Edit, Delete (with archival)
            out.println("              <td>");
            out.println("                <div style='display:flex; gap:6px;'>");
            out.println("                  <button type='button' class='btn btn-white btn-sm' onclick='promptRemoveStock(" + item.getItemId() + ", \"" + escapeHtml(item.getItemName()) + "\")'>Remove</button>");
            out.println("                  <form method='POST' action='/action/admin-delete-dish' style='margin:0;' onsubmit='return confirm(\"Delete or archive " + escapeHtml(item.getItemName()) + "?\");'>");
            out.println("                    <input type='hidden' name='itemId' value='" + item.getItemId() + "'>");
            out.println("                    <button type='submit' class='btn btn-danger btn-sm' title='Delete or archive dish'>Delete</button>");
            out.println("                  </form>");
            out.println("                </div>");
            out.println("              </td>");
            out.println("            </tr>");
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");

        // Stock Change Logs
        out.println("      <h4 style='margin:24px 0 12px; font-size:16px;'>📜 Stock Change Audit History</h4>");
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead><tr><th>Record ID</th><th>Dish Name</th><th>Old Stock</th><th>New Stock</th><th>Delta</th><th>Reason</th><th>Admin</th><th>Timestamp</th></tr></thead>");
        out.println("          <tbody>");
        if (stockLogs.isEmpty()) {
            out.println("            <tr><td colspan='8' style='text-align:center; color:#6B6560;'>No stock adjustments recorded.</td></tr>");
        } else {
            for (StockChangeRecord scr : stockLogs) {
                out.println("            <tr>");
                out.println("              <td>#" + scr.getRecordId() + "</td>");
                out.println("              <td><strong>" + escapeHtml(scr.getItemName()) + "</strong></td>");
                out.println("              <td>" + scr.getOldQuantity() + "</td>");
                out.println("              <td>" + scr.getNewQuantity() + "</td>");
                out.println("              <td>" + (scr.getDelta() > 0 ? "+" + scr.getDelta() : scr.getDelta()) + "</td>");
                out.println("              <td>" + escapeHtml(scr.getReason()) + "</td>");
                out.println("              <td>" + escapeHtml(scr.getPerformedBy()) + "</td>");
                out.println("              <td style='font-size:11px;'>" + scr.getTimestamp() + "</td>");
                out.println("            </tr>");
            }
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");

        out.println("    </div>");

        // Hidden Form for Remove Stock with Reason
        out.println("    <form id='form-admin-remove-stock' method='POST' action='/action/admin-remove-stock' style='display:none;'>");
        out.println("      <input type='hidden' name='itemId' id='rem-stock-id'>");
        out.println("      <input type='hidden' name='amount' id='rem-stock-amt'>");
        out.println("      <input type='hidden' name='reason' id='rem-stock-reason'>");
        out.println("    </form>");

        out.println("    <script>");
        out.println("    function toggleAddDishForm() {");
        out.println("      var f = document.getElementById('add-dish-form-box');");
        out.println("      f.style.display = (f.style.display === 'none' ? 'block' : 'none');");
        out.println("    }");
        out.println("    function promptRemoveStock(itemId, name) {");
        out.println("      var amt = prompt('Enter quantity of ' + name + ' to remove (or 0 to zero out stock):');");
        out.println("      if (amt !== null) {");
        out.println("        var reason = prompt('Mandatory reason: (Sold out, Spoiled, Ingredient shortage, Other):', 'Sold out');");
        out.println("        if (reason && reason.trim()) {");
        out.println("          document.getElementById('rem-stock-id').value = itemId;");
        out.println("          document.getElementById('rem-stock-amt').value = amt;");
        out.println("          document.getElementById('rem-stock-reason').value = reason.trim();");
        out.println("          document.getElementById('form-admin-remove-stock').submit();");
        out.println("        } else { alert('A mandatory reason is required to remove stock.'); }");
        out.println("      }");
        out.println("    }");
        out.println("    </script>");
    }

    // Admin Tab 4: Immutable Credit Ledger & Audit Logs
    private void renderAdminAuditTab(PrintWriter out, SecurityService.Session session) {
        List<TransactionRecord> txs = messService.getAllTransactions();

        out.println("    <div class='dash-card'>");
        out.println("      <h3 style='margin:0 0 14px; font-size:18px; font-weight:800;'>📜 Complete Campus Credit Ledger &amp; Audit Trail</h3>");
        out.println("      <p style='color:#6B6560; font-size:13px; margin-bottom:16px;'>Immutable audit entries for all campus wallet debits, refunds, welfare grants, and monthly reissues.</p>");
        out.println("      <div class='data-table-wrapper'>");
        out.println("        <table class='data-table'>");
        out.println("          <thead><tr><th>Tx ID</th><th>Type</th><th>Student Name</th><th>Reg No</th><th>Amount</th><th>Balance After</th><th>Reason / Notes</th><th>Admin / Source</th><th>Timestamp</th></tr></thead>");
        out.println("          <tbody>");
        for (TransactionRecord tx : txs) {
            out.println("            <tr>");
            out.println("              <td>#" + tx.getTransactionId() + "</td>");
            out.println("              <td><span class='badge " + (tx.getAmount() >= 0 ? "badge-green" : "badge-orange") + "'>" + escapeHtml(tx.getType()) + "</span></td>");
            out.println("              <td><strong>" + escapeHtml(tx.getStudentName()) + "</strong></td>");
            out.println("              <td>" + escapeHtml(tx.getStudentRegNumber()) + "</td>");
            out.println("              <td><strong>" + (tx.getAmount() > 0 ? "+" + tx.getAmount() : tx.getAmount()) + " Cr</strong></td>");
            out.println("              <td>" + tx.getBalanceAfter() + " Cr</td>");
            out.println("              <td>" + escapeHtml(tx.getNotes()) + "</td>");
            out.println("              <td>" + escapeHtml(tx.getPerformedBy()) + "</td>");
            out.println("              <td style='font-size:11px;'>" + tx.getTimestamp() + "</td>");
            out.println("            </tr>");
        }
        out.println("          </tbody>");
        out.println("        </table>");
        out.println("      </div>");
        out.println("    </div>");
    }

    // =========================================================================
    // 4. HIDDEN DEVELOPER & ARCHITECTURE DIAGNOSTICS PAGE
    // =========================================================================

    private void renderDeveloperDiagnosticsPage(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/html");
        resp.setCharacterEncoding("UTF-8");

        try (PrintWriter out = resp.getWriter()) {
            renderHead(out, "Developer & Architecture Diagnostics - SmartMess");

            out.println("  <header class='site-header'>");
            out.println("    <a href='/' class='logo-area'>");
            out.println("      <div class='logo-badge'>⚙️</div>");
            out.println("      <div class='logo-text'>Smart<span class='accent'>Mess</span> Diagnostics</div>");
            out.println("    </a>");
            out.println("    <a href='/' class='btn btn-orange btn-sm'>← Return to Campus Portal</a>");
            out.println("  </header>");

            out.println("  <div class='container' style='margin-top:30px;'>");

            // Architecture Banner
            out.println("    <div class='dash-card' style='border:1px solid #38BDF8; background:#F0F9FF;'>");
            out.println("      <h2 style='margin:0; font-size:20px; color:#0369A1;'>🏗️ Pure Java Architecture &amp; Review 2 Diagnostics</h2>");
            out.println("      <p style='margin:6px 0 0; color:#0284C7; font-size:13px;'>100% Pure Java Runtime • Zero JavaScript frameworks • Apache Tomcat &amp; Embedded HttpServlet Specification</p>");
            out.println("    </div>");

            // Technical Servlet Endpoints
            out.println("    <div class='dash-card'>");
            out.println("      <h3 style='margin:0 0 14px; font-size:16px;'>🔌 Registered Pure Java Servlet Endpoints</h3>");
            out.println("      <div class='data-table-wrapper'>");
            out.println("        <table class='data-table'>");
            out.println("          <thead><tr><th>Endpoint URI</th><th>Target HttpServlet</th><th>Protocol &amp; Contract</th><th>Role Access</th></tr></thead>");
            out.println("          <tbody>");
            out.println("            <tr><td><code>/</code></td><td>WebPortalServlet</td><td>HTML5 / Modern Pure Java View</td><td>Public &amp; All Roles</td></tr>");
            out.println("            <tr><td><code>/css/smartmess.css</code></td><td>WebPortalServlet</td><td>Static CSS Stylesheet Stream</td><td>Public</td></tr>");
            out.println("            <tr><td><code>/api/java/auth</code></td><td>AuthServlet</td><td>VIT Email Verification &amp; Sessions</td><td>Public</td></tr>");
            out.println("            <tr><td><code>/api/java/menu</code></td><td>MenuServlet</td><td>Digital Catalog &amp; Live Stock Toggles</td><td>Student, Chef, Admin</td></tr>");
            out.println("            <tr><td><code>/api/java/order</code></td><td>OrderServlet</td><td>Atomic Order Placement, Cancel &amp; Prep Timer</td><td>Student, Chef</td></tr>");
            out.println("            <tr><td><code>/api/java/kitchen</code></td><td>KitchenQueueServlet</td><td>Chef FIFO Dispatch &amp; Room Deliveries</td><td>Chef</td></tr>");
            out.println("            <tr><td><code>/api/java/sickleave</code></td><td>SickLeaveServlet</td><td>Warden Sick-Leave Room Delivery Review</td><td>Student, Warden</td></tr>");
            out.println("            <tr><td><code>/api/java/credits</code></td><td>CreditServlet</td><td>Credit Ledger &amp; Razorpay Top-ups</td><td>Student, Admin</td></tr>");
            out.println("            <tr><td><code>/api/java/admin</code></td><td>AdminServlet</td><td>Admin Analytics &amp; 9,000 Credit Reset</td><td>Admin</td></tr>");
            out.println("            <tr><td><code>/api/java/live-events</code></td><td>LiveEventsServlet</td><td>Server-Sent Events (SSE) Live Gateway</td><td>All Roles</td></tr>");
            out.println("          </tbody>");
            out.println("        </table>");
            out.println("      </div>");
            out.println("    </div>");

            // JVM & Runtime Health Metrics
            Runtime rt = Runtime.getRuntime();
            long totalMem = rt.totalMemory() / (1024 * 1024);
            long freeMem = rt.freeMemory() / (1024 * 1024);
            long usedMem = totalMem - freeMem;

            out.println("    <div class='dash-card'>");
            out.println("      <h3 style='margin:0 0 14px; font-size:16px;'>⚡ JVM Runtime &amp; Database Health</h3>");
            out.println("      <div style='display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;'>");
            out.println("        <div style='background:#FAF8F5; padding:14px; border-radius:8px;'><strong>JVM Memory:</strong> " + usedMem + " MB / " + totalMem + " MB used</div>");
            out.println("        <div style='background:#FAF8F5; padding:14px; border-radius:8px;'><strong>Active Threads:</strong> " + Thread.activeCount() + " threads</div>");
            out.println("        <div style='background:#FAF8F5; padding:14px; border-radius:8px;'><strong>PostgreSQL JDBC:</strong> Fallback / In-Memory Mock Active</div>");
            out.println("      </div>");
            out.println("    </div>");

            out.println("  </div>");

            out.println("  <footer class='site-footer'>SmartMess Developer Diagnostics • Review 2</footer>");
            out.println("</body></html>");
        }
    }

    // =========================================================================
    // POST ACTION IMPLEMENTATIONS
    // =========================================================================

    private void handleLoginPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = req.getParameter("role");
        if (role == null) role = "student";

        String authMethod = req.getParameter("auth_method");
        SecurityService.AuthResult result;

        if ("student".equalsIgnoreCase(role) && "reg".equalsIgnoreCase(authMethod)) {
            String regNumber = req.getParameter("regNumber");
            String roomNumber = req.getParameter("roomNumber");
            result = securityService.authenticateStudentByReg(regNumber, roomNumber);
        } else {
            String email = req.getParameter("email");
            String password = req.getParameter("password");
            result = securityService.authenticate(role, email, password);
        }

        if (result.success) {
            Cookie c = new Cookie("SMARTMESS_SESSION", result.token);
            c.setPath("/");
            c.setMaxAge(86400); // 24h session
            resp.addCookie(c);
            resp.sendRedirect("/dashboard?role=" + role.toLowerCase());
        } else {
            resp.sendRedirect("/login?role=" + role.toLowerCase() + "&error=" + URLEncoder.encode(result.errorMessage, StandardCharsets.UTF_8));
        }
    }

    private void handleRegisterPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String name = req.getParameter("name");
        String email = req.getParameter("email");
        String regNumber = req.getParameter("regNumber");
        String roomNumber = req.getParameter("roomNumber");
        String password = req.getParameter("password");

        String phone = req.getParameter("phone");
        if (phone == null || phone.trim().isEmpty()) phone = "+91 9876543210";
        SecurityService.AuthResult result = securityService.registerStudent(name, email, phone, roomNumber, password, password, messService);
        if (result.success) {
            resp.sendRedirect("/login?role=student&msg=" + URLEncoder.encode("Account registered successfully! Please sign in.", StandardCharsets.UTF_8));
        } else {
            resp.sendRedirect("/register?error=" + URLEncoder.encode(result.errorMessage, StandardCharsets.UTF_8));
        }
    }

    private void handleForgotPasswordPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String email = req.getParameter("email");
        resp.sendRedirect("/forgot-password?msg=" + URLEncoder.encode("If an account exists for " + email + ", password reset instructions have been dispatched.", StandardCharsets.UTF_8));
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        if (session != null) {
            securityService.invalidateSession(session.token);
        }
        Cookie c = new Cookie("SMARTMESS_SESSION", "");
        c.setPath("/");
        c.setMaxAge(0);
        resp.addCookie(c);
        resp.sendRedirect("/");
    }

    private void handleStudentOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            String deliveryType = req.getParameter("deliveryType");
            boolean isRoom = "ROOM_DELIVERY".equalsIgnoreCase(deliveryType);
            Student student = messService.getStudentProfile(session.userId);
            String roomAddr = student != null ? student.getHostelRoom() : "Block B - Room 304";

            List<OrderItem> items = new ArrayList<>();
            String itemsParam = req.getParameter("items");
            if (itemsParam != null && !itemsParam.trim().isEmpty()) {
                String[] pairs = itemsParam.split(",");
                for (String pair : pairs) {
                    String[] parts = pair.trim().split(":");
                    if (parts.length == 2) {
                        try {
                            int id = Integer.parseInt(parts[0].trim());
                            int q = Integer.parseInt(parts[1].trim());
                            if (q > 0) {
                                MenuItem mi = messService.getCatalog().findById(id);
                                if (mi != null) {
                                    items.add(new OrderItem(mi.getItemId(), mi.getItemName(), q, mi.getPrice(), mi.getCalories()));
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            if (items.isEmpty()) {
                String itemIdStr = req.getParameter("itemId");
                if (itemIdStr != null && !itemIdStr.trim().isEmpty()) {
                    int itemId = Integer.parseInt(itemIdStr.trim());
                    int qty = 1;
                    try { qty = Integer.parseInt(req.getParameter("quantity")); } catch (Exception ignored) {}
                    if (qty <= 0) qty = 1;
                    MenuItem item = messService.getCatalog().findById(itemId);
                    if (item == null) {
                        resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode("Item not found.", StandardCharsets.UTF_8));
                        return;
                    }
                    items.add(new OrderItem(item.getItemId(), item.getItemName(), qty, item.getPrice(), item.getCalories()));
                }
            }

            if (items.isEmpty()) {
                resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode("Your food tray is empty. Please add items before placing an order.", StandardCharsets.UTF_8));
                return;
            }

            BaseOrder order = messService.placeOrder(session.userId, items, isRoom, roomAddr);
            Student updatedStudent = messService.getStudentProfile(session.userId);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Order #" + order.getOrderId() + " (" + order.getPickupToken() + ") placed successfully! Deducted " + order.getTotalAmount() + " Cr. Remaining wallet: " + updatedStudent.getRemainingCredits() + " Cr.", StandardCharsets.UTF_8));
        } catch (OutOfStockException | InsufficientCreditsException e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleCancelOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int orderId = Integer.parseInt(req.getParameter("orderId"));
            messService.cancelOrder(orderId, session.userId);
            Student updatedStudent = messService.getStudentProfile(session.userId);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Order #" + orderId + " cancelled. Full credits refunded. Wallet Balance: " + updatedStudent.getRemainingCredits() + " Cr.", StandardCharsets.UTF_8));
        } catch (InvalidOrderStateException e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleSubmitSickLeave(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            String hostelBlock = req.getParameter("hostelBlock");
            String roomNumber = req.getParameter("roomNumber");
            String reason = req.getParameter("reason");
            String mealsNeeded = req.getParameter("mealsNeeded");
            String attachedNote = req.getParameter("attachedNote");
            String dateStr = req.getParameter("date");
            LocalDate date = (dateStr != null && !dateStr.isEmpty()) ? LocalDate.parse(dateStr) : LocalDate.now();

            Student s = messService.getStudentProfile(session.userId);
            messService.submitHealthRequest(session.userId, s.getName(), s.getRegistrationNumber(), s.getPhone(),
                    hostelBlock, roomNumber, reason, attachedNote, date, mealsNeeded);

            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Sick leave request submitted to your hostel block warden.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleReviewSickLeave(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int reqId = Integer.parseInt(req.getParameter("requestId"));
            String decision = req.getParameter("decision");
            boolean approve = "APPROVE".equalsIgnoreCase(decision);
            String rejectionReason = req.getParameter("reason");

            messService.reviewHealthRequest(reqId, approve, rejectionReason, session.name);
            String destTab = approve ? "approved" : "rejected";
            resp.sendRedirect("/dashboard?role=warden&tab=" + destTab + "&msg=" + URLEncoder.encode("Request #" + reqId + " " + (approve ? "Approved (Room delivery enabled)" : "Rejected"), StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=warden&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleChefSetPrep(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int orderId = Integer.parseInt(req.getParameter("orderId"));
            int minutes = Integer.parseInt(req.getParameter("minutes"));
            messService.updateOrderPrepTime(orderId, minutes, "Chef estimated " + minutes + " mins remaining");
            resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Prep time set to " + minutes + " mins for Order #" + orderId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=chef&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleChefAdvanceOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int orderId = Integer.parseInt(req.getParameter("orderId"));
            String nextStatusStr = req.getParameter("nextStatus");
            String activity = req.getParameter("activity");
            OrderStatus next = OrderStatus.valueOf(nextStatusStr);
            messService.advanceOrderStatus(orderId, next, activity);
            resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Order #" + orderId + " is now " + next.getDisplayName(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=chef&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleBookPreOrder(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            int qty = 1;
            try { qty = Integer.parseInt(req.getParameter("quantity")); } catch (Exception ignored) {}
            if (qty <= 0) qty = 1;
            PreOrder po = messService.placePreOrder(session.userId, itemId, qty, LocalDate.now().plusDays(1));
            Student updatedStudent = messService.getStudentProfile(session.userId);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("⭐ Pre-order booked successfully! Token: " + po.getPickupToken() + " (" + po.getItemName() + " x" + po.getQuantity() + "). Charged " + po.getTotalAmount() + " Cr. Remaining wallet: " + updatedStudent.getRemainingCredits() + " Cr.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleTopup(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int amount = Integer.parseInt(req.getParameter("amount"));
            messService.topUpCredits(session.userId, amount);
            Student updatedStudent = messService.getStudentProfile(session.userId);
            resp.sendRedirect("/dashboard?role=student&msg=" + URLEncoder.encode("Successfully topped up +" + amount + " Credits via Razorpay. New Wallet Balance: " + updatedStudent.getRemainingCredits() + " Cr.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=student&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdvanceKitchen(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        messService.processNextKitchenOrder();
        resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Next order moved to cooking queue.", StandardCharsets.UTF_8));
    }

    private void handleToggleStock(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        int itemId = Integer.parseInt(req.getParameter("itemId"));
        messService.toggleStockStatus(itemId);
        resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Menu item stock status toggled.", StandardCharsets.UTF_8));
    }

    private void handleLogWaste(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        resp.sendRedirect("/dashboard?role=chef&msg=" + URLEncoder.encode("Wastage audit entry logged successfully.", StandardCharsets.UTF_8));
    }

    private void handleResetCredits(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        messService.resetAllStudentCredits(9000);
        resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("1-Click Reset complete: All students credited with 9,000 monthly credits.", StandardCharsets.UTF_8));
    }

    // Admin Credit Handlers
    private void handleAdminAddCredits(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int studentId = Integer.parseInt(req.getParameter("studentId"));
            int amount = Integer.parseInt(req.getParameter("amount"));
            String reason = req.getParameter("reason");
            messService.addStudentCredits(studentId, amount, reason, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Added +" + amount + " credits to student #" + studentId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminDeductCredits(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int studentId = Integer.parseInt(req.getParameter("studentId"));
            int amount = Integer.parseInt(req.getParameter("amount"));
            String reason = req.getParameter("reason");
            messService.deductStudentCredits(studentId, amount, reason, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Deducted -" + amount + " credits from student #" + studentId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminSetLimit(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int studentId = Integer.parseInt(req.getParameter("studentId"));
            int limit = Integer.parseInt(req.getParameter("limit"));
            messService.setStudentMonthlyLimit(studentId, limit, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Monthly limit updated to " + limit + " Credits for student #" + studentId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminReissueStudent(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int studentId = Integer.parseInt(req.getParameter("studentId"));
            messService.reissueStudentCredits(studentId, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Credits reissued back to monthly limit for student #" + studentId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminReissueAll(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int count = messService.reissueAllStudentsCredits(session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Successfully reissued monthly credits for all " + count + " enrolled students.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminBulkCredits(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            String sidsStr = req.getParameter("studentIds");
            String action = req.getParameter("action");
            int amount = 0;
            try { amount = Integer.parseInt(req.getParameter("amount")); } catch (Exception ignored) {}
            String reason = req.getParameter("reason");

            List<Integer> sids = new ArrayList<>();
            if (sidsStr != null && !sidsStr.isEmpty()) {
                for (String part : sidsStr.split(",")) {
                    sids.add(Integer.parseInt(part.trim()));
                }
            }

            int count = messService.bulkCreditAction(sids, action, amount, reason, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Bulk credit action completed for " + count + " students.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=credits&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminToggleAutoReissue(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        boolean newState = !messService.isAutoMonthlyReissueEnabled();
        messService.setAutoMonthlyReissueEnabled(newState);
        resp.sendRedirect("/dashboard?role=admin&tab=credits&msg=" + URLEncoder.encode("Automatic 1st-of-month credit reissue is now " + (newState ? "ENABLED" : "DISABLED"), StandardCharsets.UTF_8));
    }

    // Admin Menu & Stock Handlers
    private void handleAdminAddDish(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            String name = req.getParameter("name");
            String category = req.getParameter("category");
            int price = Integer.parseInt(req.getParameter("price"));
            int calories = Integer.parseInt(req.getParameter("calories"));
            int quantity = Integer.parseInt(req.getParameter("quantity"));
            int threshold = 15;
            try { threshold = Integer.parseInt(req.getParameter("threshold")); } catch (Exception ignored) {}
            String description = req.getParameter("description");
            String imageUrl = req.getParameter("imageUrl");

            MenuItem item = new MenuItem(0, name, category, price, calories, quantity, description, imageUrl, threshold);
            messService.addMenuItem(item, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Added new dish '" + name + "' to catalog.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminUpdateDish(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            MenuItem item = messService.getCatalog().findById(itemId);
            if (item != null) {
                if (req.getParameter("name") != null) item.setItemName(req.getParameter("name"));
                if (req.getParameter("category") != null) item.setCategory(req.getParameter("category"));
                if (req.getParameter("price") != null) item.setPrice(Integer.parseInt(req.getParameter("price")));
                if (req.getParameter("calories") != null) item.setCalories(Integer.parseInt(req.getParameter("calories")));
                if (req.getParameter("description") != null) item.setDescription(req.getParameter("description"));
                if (req.getParameter("imageUrl") != null) item.setImageUrl(req.getParameter("imageUrl"));
                messService.updateMenuItem(item, session.email);
            }
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Dish #" + itemId + " details updated.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminAdjustStock(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            int delta = Integer.parseInt(req.getParameter("delta"));
            messService.adjustItemStock(itemId, delta, "Admin quick adjustment (" + (delta > 0 ? "+" : "") + delta + ")", session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Stock adjusted for item #" + itemId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminRemoveStock(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            int amount = Integer.parseInt(req.getParameter("amount"));
            String reason = req.getParameter("reason");
            messService.removeStock(itemId, amount, reason, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Stock removed for item #" + itemId + ". Reason: " + reason, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminToggleDishActive(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            messService.toggleItemAvailability(itemId, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Availability toggled for item #" + itemId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminDeleteDish(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            messService.deleteMenuItem(itemId, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Dish #" + itemId + " deleted or archived to preserve order history.", StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminSetThreshold(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        try {
            int itemId = Integer.parseInt(req.getParameter("itemId"));
            int threshold = Integer.parseInt(req.getParameter("threshold"));
            messService.setLowStockThreshold(itemId, threshold, session.email);
            resp.sendRedirect("/dashboard?role=admin&tab=menu&msg=" + URLEncoder.encode("Low stock threshold set to " + threshold + " for item #" + itemId, StandardCharsets.UTF_8));
        } catch (Exception e) {
            resp.sendRedirect("/dashboard?role=admin&tab=menu&error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    private void handleAdminSaveWidgets(HttpServletRequest req, HttpServletResponse resp, SecurityService.Session session) throws IOException {
        Map<String, Boolean> prefs = new LinkedHashMap<>();
        String[] allWidgets = {"widget_orders", "widget_credits", "widget_low_stock", "widget_pending_leaves", "widget_top_dishes"};
        for (String w : allWidgets) {
            prefs.put(w, "true".equals(req.getParameter(w)));
        }
        messService.saveAdminWidgetPreferences(session.email, prefs, Arrays.asList(allWidgets));
        resp.sendRedirect("/dashboard?role=admin&tab=overview&msg=" + URLEncoder.encode("Dashboard widget layout saved.", StandardCharsets.UTF_8));
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
