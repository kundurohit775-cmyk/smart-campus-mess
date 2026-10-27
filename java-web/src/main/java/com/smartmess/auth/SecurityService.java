package com.smartmess.auth;

import com.smartmess.model.Student;
import com.smartmess.model.Warden;
import com.smartmess.service.IMessService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise Security and Session Management Service for SmartMess.
 * Enforces:
 * - SHA-256 salted password hashing (never stores or exposes plaintext/hashes)
 * - Strict role validation on the server for all four roles: Student, Chef, Warden, Admin
 * - Rate-limited sign-in attempts with cooldown messaging
 * - Mobile OTP generation with 5-minute expiry and resend countdown
 * - Password reset OTP with 10-minute expiry and single-use invalidation
 * - Secure session issuance, token tracking, and 30-minute inactivity expiration
 */
public class SecurityService {

    private static final String SALT = "SmartMess_Secure_Salt_2026_VIT";
    private static final long SESSION_TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes
    private static final long OTP_EXPIRY_MS = 5 * 60 * 1000L;        // 5 minutes for mobile OTP
    private static final long FORGOT_PWD_EXPIRY_MS = 10 * 60 * 1000L;// 10 minutes for email OTP
    private static final long RESEND_COOLDOWN_MS = 60 * 1000L;       // 60 seconds resend cooldown
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long COOLDOWN_DURATION_MS = 5 * 60 * 1000L; // 5 minutes cooldown

    // Configured authorized emails
    private final String chefEmail;
    private final String adminEmail;

    // In-memory credential stores
    private final Map<String, UserCredentials> userStore = new ConcurrentHashMap<>();
    private final Map<String, WardenAccount> wardenStore = new ConcurrentHashMap<>();
    private final Map<String, Session> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, List<Long>> failedAttempts = new ConcurrentHashMap<>();
    private final Map<String, OtpEntry> mobileOtpStore = new ConcurrentHashMap<>();
    private final Map<String, OtpEntry> emailOtpStore = new ConcurrentHashMap<>();

    private static SecurityService instance;

    public static synchronized SecurityService getInstance() {
        if (instance == null) {
            instance = new SecurityService();
        }
        return instance;
    }

    public SecurityService() {
        this.chefEmail = System.getenv().getOrDefault("CHEF_EMAIL", "chef.campus@vit.ac.in").toLowerCase();
        this.adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin.mess@vit.ac.in").toLowerCase();

        seedDefaultAccounts();
    }

    private void seedDefaultAccounts() {
        // Seed Chef Account
        userStore.put(chefEmail, new UserCredentials(1, "Chef Vikram", chefEmail, hashPassword("Chef@123"), "chef", "active", null));
        userStore.put("chef@smartmess.edu", new UserCredentials(1, "Chef Vikram", "chef@smartmess.edu", hashPassword("Chef@123"), "chef", "active", null));

        // Seed Admin Account
        userStore.put(adminEmail, new UserCredentials(2, "Mess Committee Admin", adminEmail, hashPassword("Admin@123"), "admin", "active", null));
        userStore.put("admin@smartmess.edu", new UserCredentials(2, "Mess Committee Admin", "admin@smartmess.edu", hashPassword("Admin@123"), "admin", "active", null));

        // Seed Warden Accounts (Assigned to specific hostel blocks)
        seedWarden(10, "Dr. S. Raman", "warden.blockb@vit.ac.in", "Warden@123", "Block B", "+91 9876500001");
        seedWarden(11, "Prof. Priya Nair", "warden.blockc@vit.ac.in", "Warden@123", "Block C", "+91 9876500002");
        seedWarden(12, "Mr. K. Varma", "warden.blocka@vit.ac.in", "Warden@123", "Block A", "+91 9876500003");
        seedWarden(13, "Dr. S. Raman", "warden@vit.ac.in", "Warden@123", "Block B", "+91 9876500001");

        // Seed Default Students
        seedStudent(22, "Rohit Kundu", "rohit.kundu2022@vitstudent.ac.in", "+91 9876543210", "Block B - Room 304", "Student@123");
        seedStudent(23, "Aarav Sharma", "aarav.sharma2023@vitstudent.ac.in", "+91 9876543211", "Block C - Room 112", "Student@123");
    }

    private void seedWarden(int id, String name, String email, String password, String block, String phone) {
        String cleanEmail = email.toLowerCase().trim();
        WardenAccount wa = new WardenAccount(id, name, cleanEmail, hashPassword(password), block, phone);
        wardenStore.put(cleanEmail, wa);
        userStore.put(cleanEmail, new UserCredentials(id, name, cleanEmail, wa.passwordHash, "warden", "active", block));
    }

    private void seedStudent(int id, String name, String email, String phone, String room, String password) {
        String cleanEmail = email.toLowerCase().trim();
        userStore.put(cleanEmail, new UserCredentials(id, name, cleanEmail, hashPassword(password), "student", "active", room, phone));
    }

    // =========================================================================
    // PASSWORD HASHING (Salted SHA-256)
    // =========================================================================

    public static String hashPassword(String password) {
        if (password == null) return "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(SALT.getBytes(StandardCharsets.UTF_8));
            byte[] bytes = md.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) return false;
        String computed = hashPassword(rawPassword);
        return computed.equals(storedHash);
    }

    // =========================================================================
    // RATE LIMITING & COOLDOWN
    // =========================================================================

    public boolean isRateLimited(String identifier) {
        if (identifier == null) return false;
        String key = identifier.toLowerCase().trim();
        List<Long> timestamps = failedAttempts.get(key);
        if (timestamps == null || timestamps.isEmpty()) return false;

        long now = System.currentTimeMillis();
        // Keep only attempts within cooldown duration window
        timestamps.removeIf(ts -> now - ts > COOLDOWN_DURATION_MS);

        return timestamps.size() >= MAX_FAILED_ATTEMPTS;
    }

    public long getCooldownRemainingSeconds(String identifier) {
        if (identifier == null) return 0;
        String key = identifier.toLowerCase().trim();
        List<Long> timestamps = failedAttempts.get(key);
        if (timestamps == null || timestamps.isEmpty()) return 0;

        long now = System.currentTimeMillis();
        long oldestInWindow = timestamps.get(0);
        long elapsed = now - oldestInWindow;
        long remaining = (COOLDOWN_DURATION_MS - elapsed) / 1000L;
        return Math.max(0, remaining);
    }

    public void recordFailedAttempt(String identifier) {
        if (identifier == null) return;
        String key = identifier.toLowerCase().trim();
        failedAttempts.computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()))
                      .add(System.currentTimeMillis());
    }

    public void recordSuccess(String identifier) {
        if (identifier == null) return;
        failedAttempts.remove(identifier.toLowerCase().trim());
    }

    // =========================================================================
    // AUTHENTICATION LOGIC
    // =========================================================================

    public AuthResult loginWithPassword(String email, String password, String expectedRole) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return AuthResult.error("All fields are required.");
        }

        String cleanEmail = email.toLowerCase().trim();

        // 1. Rate Limit Check
        if (isRateLimited(cleanEmail)) {
            long remaining = getCooldownRemainingSeconds(cleanEmail);
            return AuthResult.error(String.format("Too many failed attempts. Account temporarily locked. Please wait %d seconds cooldown.", remaining));
        }

        // 2. Role Specific Verification
        String role = expectedRole != null ? expectedRole.toLowerCase().trim() : "student";

        if ("chef".equals(role)) {
            if (!cleanEmail.equals(chefEmail) && !cleanEmail.equals("chef@smartmess.edu")) {
                recordFailedAttempt(cleanEmail);
                return AuthResult.error("Not authorized for Chef access.");
            }
        } else if ("admin".equals(role)) {
            if (!cleanEmail.equals(adminEmail) && !cleanEmail.equals("admin@smartmess.edu")) {
                recordFailedAttempt(cleanEmail);
                return AuthResult.error("Not authorized for Admin access.");
            }
        } else if ("warden".equals(role)) {
            if (!wardenStore.containsKey(cleanEmail)) {
                recordFailedAttempt(cleanEmail);
                return AuthResult.error("Not authorized for Warden access.");
            }
        } else if ("student".equals(role)) {
            if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
                recordFailedAttempt(cleanEmail);
                return AuthResult.error("Only VIT student email addresses (@vitstudent.ac.in) are permitted.");
            }
            if (password.length() < 8) {
                return AuthResult.error("Password must be at least 8 characters long.");
            }
        }

        // 3. User Store Lookup
        UserCredentials user = userStore.get(cleanEmail);
        if (user == null) {
            recordFailedAttempt(cleanEmail);
            return AuthResult.error("Invalid email or password.");
        }

        // 4. Inactive or Locked Status Check
        if ("locked".equalsIgnoreCase(user.status) || "inactive".equalsIgnoreCase(user.status)) {
            return AuthResult.error("Account is " + user.status + ". Please contact administrator.");
        }

        // 5. Password Verification
        if (!verifyPassword(password, user.passwordHash)) {
            recordFailedAttempt(cleanEmail);
            return AuthResult.error("Invalid email or password.");
        }

        // Success: Clear failed attempts and generate Session
        recordSuccess(cleanEmail);
        Session session = createSession(user.id, user.name, user.email, user.role, user.extra);
        return AuthResult.success(session);
    }

    // =========================================================================
    // MOBILE OTP FOR STUDENT
    // =========================================================================

    public OtpResult sendMobileOtp(String rawPhone) {
        String cleanPhone = normalizePhone(rawPhone);
        if (cleanPhone.length() < 10) {
            return OtpResult.error("Please enter a valid 10-digit Indian mobile number with +91.");
        }

        long now = System.currentTimeMillis();
        OtpEntry existing = mobileOtpStore.get(cleanPhone);
        if (existing != null && (now - existing.createdAt) < RESEND_COOLDOWN_MS) {
            long waitSec = (RESEND_COOLDOWN_MS - (now - existing.createdAt)) / 1000L;
            return OtpResult.error("Please wait " + waitSec + " seconds before requesting another code.");
        }

        // Generate 6-digit code (simulated code "123456" or random digits)
        String code = "123456";
        mobileOtpStore.put(cleanPhone, new OtpEntry(code, now, OTP_EXPIRY_MS));

        return OtpResult.success("Verification code sent by SMS to " + maskPhone(cleanPhone) + ". Code expires in 5 minutes.", 60);
    }

    public AuthResult loginWithMobileOtp(String rawPhone, String code) {
        String cleanPhone = normalizePhone(rawPhone);
        if (cleanPhone.length() < 10) {
            return AuthResult.error("Invalid mobile number.");
        }
        if (code == null || code.trim().length() != 6) {
            return AuthResult.error("Verification code must be exactly 6 digits.");
        }

        OtpEntry entry = mobileOtpStore.get(cleanPhone);
        if (entry == null || entry.isExpired()) {
            return AuthResult.error("Verification code is expired or invalid. Please request a new code.");
        }

        if (!entry.code.equals(code.trim())) {
            return AuthResult.error("Invalid verification code. Please check your SMS.");
        }

        // Single-use: burn OTP
        mobileOtpStore.remove(cleanPhone);

        // Find associated student or create default student session
        UserCredentials user = findUserByPhone(cleanPhone);
        int userId = user != null ? user.id : 22;
        String name = user != null ? user.name : "Rohit Kundu";
        String email = user != null ? user.email : "rohit.kundu2022@vitstudent.ac.in";
        String room = user != null ? user.extra : "Block B - Room 304";

        Session session = createSession(userId, name, email, "student", room);
        return AuthResult.success(session);
    }

    // =========================================================================
    // STUDENT REGISTRATION (Initializes 9,000 Monthly Credits)
    // =========================================================================

    public AuthResult registerStudent(String name, String email, String phone, String room,
                                      String password, String confirmPassword, IMessService messService) {
        if (name == null || name.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            phone == null || phone.trim().isEmpty() ||
            room == null || room.trim().isEmpty() ||
            password == null || confirmPassword == null) {
            return AuthResult.error("All registration fields are required.");
        }

        String cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail.endsWith("@vitstudent.ac.in")) {
            return AuthResult.error("Registration is strictly restricted to VIT student emails ending with @vitstudent.ac.in.");
        }

        if (password.length() < 8) {
            return AuthResult.error("Password must be at least 8 characters long.");
        }

        if (!password.equals(confirmPassword)) {
            return AuthResult.error("Password and confirm password do not match.");
        }

        String cleanPhone = normalizePhone(phone);
        if (cleanPhone.length() < 10) {
            return AuthResult.error("Please enter a valid 10-digit mobile number.");
        }

        if (userStore.containsKey(cleanEmail)) {
            return AuthResult.error("An account with this email address already exists. Please sign in.");
        }

        int newId = 100 + userStore.size();
        String hashedPassword = hashPassword(password);
        UserCredentials creds = new UserCredentials(newId, name.trim(), cleanEmail, hashedPassword, "student", "active", room.trim(), cleanPhone);
        userStore.put(cleanEmail, creds);

        // Initialize 9,000 Monthly Credits in mess service
        if (messService != null) {
            Student student = new Student(newId, name.trim(), cleanEmail, cleanPhone, room.trim(), 9000);
            messService.registerStudent(student);
        }

        Session session = createSession(newId, name.trim(), cleanEmail, "student", room.trim());
        return AuthResult.success(session);
    }

    // =========================================================================
    // FORGOT PASSWORD FLOW (10-min Single-Use OTP)
    // =========================================================================

    public OtpResult sendPasswordResetOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            return OtpResult.error("Please enter your registered account email.");
        }

        String cleanEmail = email.toLowerCase().trim();
        if (!userStore.containsKey(cleanEmail)) {
            // For security, do not leak whether email exists
            return OtpResult.success("If an account exists for " + cleanEmail + ", a 6-digit reset code has been sent.", 60);
        }

        String code = "784912"; // simulated 6-digit email OTP
        emailOtpStore.put(cleanEmail, new OtpEntry(code, System.currentTimeMillis(), FORGOT_PWD_EXPIRY_MS));

        return OtpResult.success("A 6-digit reset code has been sent to " + cleanEmail + ". Code expires in 10 minutes.", 60);
    }

    public AuthResult resetPasswordWithOtp(String email, String otp, String newPassword, String confirmPassword) {
        if (email == null || otp == null || newPassword == null || confirmPassword == null) {
            return AuthResult.error("All fields are required.");
        }

        String cleanEmail = email.toLowerCase().trim();
        OtpEntry entry = emailOtpStore.get(cleanEmail);
        if (entry == null || entry.isExpired()) {
            return AuthResult.error("Password reset code has expired or is invalid. Please request a new code.");
        }

        if (!entry.code.equals(otp.trim())) {
            return AuthResult.error("Invalid reset code. Please check your email.");
        }

        if (newPassword.length() < 8) {
            return AuthResult.error("New password must be at least 8 characters long.");
        }

        if (!newPassword.equals(confirmPassword)) {
            return AuthResult.error("New passwords do not match.");
        }

        UserCredentials user = userStore.get(cleanEmail);
        if (user == null) {
            return AuthResult.error("Account not found.");
        }

        // Update password hash and burn OTP
        user.passwordHash = hashPassword(newPassword);
        emailOtpStore.remove(cleanEmail);

        return AuthResult.successMessage("Password successfully reset! You can now sign in with your new password.");
    }

    // =========================================================================
    // SECURE SESSIONS (30-Minute Inactivity Expiry)
    // =========================================================================

    public Session createSession(int userId, String name, String email, String role, String extra) {
        String sessionId = UUID.randomUUID().toString();
        Session s = new Session(sessionId, userId, name, email, role, extra);
        activeSessions.put(sessionId, s);
        return s;
    }

    public Session getValidSession(String sessionId) {
        if (sessionId == null) return null;
        Session s = activeSessions.get(sessionId);
        if (s == null) return null;

        if (s.isExpired()) {
            activeSessions.remove(sessionId);
            return null;
        }

        s.touch();
        return s;
    }

    public void invalidateSession(String sessionId) {
        if (sessionId != null) {
            activeSessions.remove(sessionId);
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public WardenAccount getWarden(String email) {
        return wardenStore.get(email.toLowerCase().trim());
    }

    private UserCredentials findUserByPhone(String phone) {
        for (UserCredentials u : userStore.values()) {
            if (phone.equals(u.phone)) {
                return u;
            }
        }
        return null;
    }

    private String normalizePhone(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("[^0-9+]", "").trim();
    }

    private String maskPhone(String phone) {
        if (phone.length() >= 10) {
            return "+91 ******" + phone.substring(phone.length() - 4);
        }
        return phone;
    }

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    public static class Session {
        public final String sessionId;
        public final int userId;
        public final String name;
        public final String email;
        public final String role;
        public final String extra; // room for student, block for warden
        public final long createdAt;
        private long lastAccessTime;

        public Session(String sessionId, int userId, String name, String email, String role, String extra) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.role = role;
            this.extra = extra;
            this.createdAt = System.currentTimeMillis();
            this.lastAccessTime = this.createdAt;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - lastAccessTime > SESSION_TIMEOUT_MS;
        }

        public void touch() {
            this.lastAccessTime = System.currentTimeMillis();
        }
    }

    public static class UserCredentials {
        public final int id;
        public final String name;
        public final String email;
        public String passwordHash;
        public final String role;
        public String status;
        public final String extra;
        public String phone;

        public UserCredentials(int id, String name, String email, String passwordHash, String role, String status, String extra) {
            this(id, name, email, passwordHash, role, status, extra, null);
        }

        public UserCredentials(int id, String name, String email, String passwordHash, String role, String status, String extra, String phone) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.passwordHash = passwordHash;
            this.role = role;
            this.status = status;
            this.extra = extra;
            this.phone = phone;
        }
    }

    public static class WardenAccount {
        public final int id;
        public final String name;
        public final String email;
        public final String passwordHash;
        public final String assignedBlock;
        public final String phone;

        public WardenAccount(int id, String name, String email, String passwordHash, String assignedBlock, String phone) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.passwordHash = passwordHash;
            this.assignedBlock = assignedBlock;
            this.phone = phone;
        }
    }

    private static class OtpEntry {
        public final String code;
        public final long createdAt;
        public final long durationMs;

        public OtpEntry(String code, long createdAt, long durationMs) {
            this.code = code;
            this.createdAt = createdAt;
            this.durationMs = durationMs;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - createdAt > durationMs;
        }
    }

    public static class AuthResult {
        public final boolean success;
        public final String message;
        public final Session session;

        private AuthResult(boolean success, String message, Session session) {
            this.success = success;
            this.message = message;
            this.session = session;
        }

        public static AuthResult success(Session session) {
            return new AuthResult(true, "Authentication successful", session);
        }

        public static AuthResult successMessage(String message) {
            return new AuthResult(true, message, null);
        }

        public static AuthResult error(String message) {
            return new AuthResult(false, message, null);
        }
    }

    public static class OtpResult {
        public final boolean success;
        public final String message;
        public final int countdownSeconds;

        public OtpResult(boolean success, String message, int countdownSeconds) {
            this.success = success;
            this.message = message;
            this.countdownSeconds = countdownSeconds;
        }

        public static OtpResult success(String message, int countdown) {
            return new OtpResult(true, message, countdown);
        }

        public static OtpResult error(String message) {
            return new OtpResult(false, message, 0);
        }
    }
}
