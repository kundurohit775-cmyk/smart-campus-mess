import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';
import { smsService } from '../services/smsService.js';
import { otpService } from '../services/otpService.js';

const router = express.Router();

// In-memory store for pending student registrations during Mobile OTP verification (TTL: 10 minutes)
const pendingRegistrations = new Map();

// Rate limiting cache: Map<phone, number[]> timestamps
const rateLimitCache = new Map();

function checkRateLimit(phone) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const timestamps = (rateLimitCache.get(phone) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= 3) {
    return false;
  }

  timestamps.push(now);
  rateLimitCache.set(phone, timestamps);
  return true;
}

/**
 * =============================================================================
 * 1. STUDENT REGISTRATION — STEP 1: SEND MOBILE OTP (TWILIO VERIFY)
 * =============================================================================
 * POST /api/auth-helpers/register/send-otp (and /api/auth/register/send-otp)
 * Body: { name, email, password, phone, roomNumber }
 */
router.post(['/register/send-otp', '/send-otp'], async (req, res, next) => {
  try {
    const { name, email, password, phone, roomNumber } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and mobile number are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedPhone = smsService.formatPhoneNumber(phone);

    // 1. STRICT VIT STUDENT EMAIL RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
      });
    }

    // 2. Validate Phone Number (10+ digits with country code)
    if (formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // 3. Rate Limit: Max 3 requests per number per 10 minutes
    if (!checkRateLimit(formattedPhone)) {
      return res.status(429).json({
        error: 'Too many OTP requests. Maximum 3 requests allowed per 10 minutes. Please wait before trying again.'
      });
    }

    // 4. Check if email already registered
    const existingStudentByEmail = await db.get('SELECT student_id FROM students WHERE LOWER(email) = ?', cleanEmail);
    const existingAdmin = await db.get('SELECT admin_id FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (existingStudentByEmail || existingAdmin) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // 5. Check if phone number already registered
    const existingStudentByPhone = await db.get('SELECT student_id FROM students WHERE phone = ?', formattedPhone);
    if (existingStudentByPhone) {
      return res.status(400).json({ error: 'An account with this mobile number already exists.' });
    }

    // 6. Pre-hash password and hold registration payload temporarily
    const passwordHash = await bcrypt.hash(password, 10);
    const studentName = name.trim();

    pendingRegistrations.set(formattedPhone, {
      name: studentName,
      email: cleanEmail,
      passwordHash,
      phone: formattedPhone,
      roomNumber: roomNumber || 'Hostel',
      createdAt: Date.now()
    });

    // Clean up stale registrations older than 15 minutes
    const now = Date.now();
    for (const [key, val] of pendingRegistrations.entries()) {
      if (now - val.createdAt > 15 * 60 * 1000) {
        pendingRegistrations.delete(key);
      }
    }

    // 7. Dispatch SMS via Twilio Verify Service API
    const result = await smsService.sendVerifyOtp(formattedPhone);

    return res.json({
      success: true,
      message: `Verification code sent via SMS to ${formattedPhone}.`,
      phone: formattedPhone
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 2. STUDENT REGISTRATION — STEP 2: VERIFY MOBILE OTP & CREATE ACCOUNT
 * =============================================================================
 * POST /api/auth-helpers/register/verify-otp (and /api/auth/register/verify-otp)
 * Body: { phone, code } (or { phone, otp })
 */
router.post(['/register/verify-otp', '/verify-otp'], async (req, res, next) => {
  try {
    const { phone, code, otp } = req.body;
    const otpCode = (code || otp || '').toString().trim();

    if (!phone || !otpCode) {
      return res.status(400).json({ error: 'Mobile number and 6-digit verification code are required.' });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);

    // 1. Retrieve pending registration payload
    let pending = pendingRegistrations.get(formattedPhone);
    if (!pending) {
      // Try unformatted fallback
      for (const [key, val] of pendingRegistrations.entries()) {
        if (key.includes(phone) || phone.includes(key)) {
          pending = val;
          break;
        }
      }
    }

    if (!pending) {
      return res.status(400).json({
        error: 'Registration session expired or not found. Please submit the registration form again.'
      });
    }

    // 2. Verify with Twilio Verify Service (verificationChecks.create)
    const isApproved = await smsService.checkVerifyOtp(formattedPhone, otpCode);

    if (!isApproved) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check your SMS and try again.'
      });
    }

    // 3. Create Student Account in Database
    const { name: studentName, email: cleanEmail, passwordHash, roomNumber } = pending;

    const result = await db.run(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, studentName, cleanEmail, formattedPhone, passwordHash, roomNumber || 'Hostel');

    const studentId = result.lastInsertRowid;

    // Dual-sync into Better Auth user & account tables
    try {
      const authUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "roomNumber", phone)
        VALUES ($1, $2, $3, TRUE, NOW(), NOW(), 'student', $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [authUserId, studentName, cleanEmail, roomNumber || 'Hostel', formattedPhone]);

      const userRow = await db.pool.query('SELECT id FROM "user" WHERE email = $1', [cleanEmail]);
      if (userRow.rows.length > 0) {
        const uId = userRow.rows[0].id;
        const accId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await db.pool.query(`
          INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [accId, uId, cleanEmail, passwordHash]);
      }
    } catch (e) {
      console.warn('Better Auth user/account table sync warning:', e.message);
    }

    // Allocate 9,000 monthly dining credits
    const credits = await creditService.getOrCreateMonthlyCredits(studentId);

    // Delete verified pending record
    pendingRegistrations.delete(formattedPhone);

    // Generate JWT Session Token
    const token = jwt.sign(
      { id: studentId, email: cleanEmail, role: 'student', name: studentName, phone: formattedPhone },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const userObj = {
      id: studentId,
      name: studentName,
      email: cleanEmail,
      phone: formattedPhone,
      roomNumber: roomNumber || 'Hostel',
      role: 'student',
      isChef: false,
      isAdmin: false,
      isStudent: true,
      credits: {
        remaining: credits.remaining_credits,
        used: credits.used_credits,
        limit: credits.monthly_limit,
        isLowBalance: credits.is_low_balance
      }
    };

    return res.status(201).json({
      success: true,
      message: 'Mobile number verified and student account created successfully! Welcome to Smart Campus Mess.',
      token,
      user: userObj
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 3. DIRECT REGISTRATION (FALLBACK)
 * =============================================================================
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, roomNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedPhone = smsService.formatPhoneNumber(phone || '');

    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
      });
    }

    const existingStudent = await db.get('SELECT student_id FROM students WHERE LOWER(email) = ?', cleanEmail);
    const existingAdmin = await db.get('SELECT admin_id FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (existingStudent || existingAdmin) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const studentName = name.trim();

    const result = await db.run(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, studentName, cleanEmail, formattedPhone, passwordHash, roomNumber || 'Hostel');

    const studentId = result.lastInsertRowid;
    const credits = await creditService.getOrCreateMonthlyCredits(studentId);

    const token = jwt.sign(
      { id: studentId, email: cleanEmail, role: 'student', name: studentName, phone: formattedPhone },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Smart Campus Mess.',
      token,
      user: {
        id: studentId,
        name: studentName,
        email: cleanEmail,
        phone: formattedPhone,
        roomNumber: roomNumber || 'Hostel',
        role: 'student',
        credits: {
          remaining: credits.remaining_credits,
          used: credits.used_credits,
          limit: credits.monthly_limit,
          isLowBalance: credits.is_low_balance
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 4. STANDARD LOGIN FLOW (EMAIL + PASSWORD)
 * =============================================================================
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in Admins / Chefs
    const configuredChef = (config.chefEmail || '').trim().toLowerCase();
    const configuredAdmin = (config.adminEmail || '').trim().toLowerCase();
    const admin = await db.get('SELECT * FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      let effectiveRole = admin.role;
      if (effectiveRole === 'chef' && (!configuredChef || cleanEmail !== configuredChef)) {
        return res.status(403).json({
          error: 'Forbidden: Chef access is restricted.'
        });
      }

      if (effectiveRole === 'admin' && (!configuredAdmin || cleanEmail !== configuredAdmin)) {
        return res.status(403).json({
          error: 'Forbidden: Admin access is restricted.'
        });
      }

      const token = jwt.sign(
        { id: admin.admin_id, email: admin.email, role: effectiveRole, name: admin.name },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          role: effectiveRole,
          isChef: effectiveRole === 'chef',
          isAdmin: effectiveRole === 'admin',
          isStudent: effectiveRole === 'student'
        }
      });
    }

    // 2. STRICT VIT STUDENT EMAIL LOGIN RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(403).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.'
      });
    }

    // 3. Check in Students
    const student = await db.get('SELECT * FROM students WHERE LOWER(email) = ?', cleanEmail);
    if (student) {
      if (student.status !== 'active') {
        return res.status(403).json({ error: 'Account is deactivated. Please contact campus admin.' });
      }

      const match = await bcrypt.compare(password, student.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const credits = await creditService.getOrCreateMonthlyCredits(student.student_id);

      const token = jwt.sign(
        { id: student.student_id, email: student.email, role: 'student', name: student.name, phone: student.phone },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: student.student_id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          roomNumber: student.room_number,
          role: 'student',
          isChef: false,
          isAdmin: false,
          isStudent: true,
          credits: {
            remaining: credits.remaining_credits,
            used: credits.used_credits,
            limit: credits.monthly_limit,
            isLowBalance: credits.is_low_balance
          }
        }
      });
    }

    return res.status(401).json({ error: 'Account not found with this email.' });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 5. GET ACTIVE USER DETAILS
 * =============================================================================
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const student = await db.get('SELECT student_id, name, email, phone, room_number FROM students WHERE student_id = ?', req.user.id);
      const credits = await creditService.getOrCreateMonthlyCredits(req.user.id);

      return res.json({
        user: {
          id: student.student_id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          roomNumber: student.room_number,
          role: 'student',
          isChef: false,
          isAdmin: false,
          isStudent: true,
          credits: {
            remaining: credits.remaining_credits,
            used: credits.used_credits,
            limit: credits.monthly_limit,
            isLowBalance: credits.is_low_balance
          }
        }
      });
    }

    const admin = await db.get('SELECT admin_id, name, email, role FROM admins WHERE admin_id = ?', req.user.id);
    const effectiveRole = req.user.role;
    return res.json({
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: effectiveRole,
        isChef: effectiveRole === 'chef',
        isAdmin: effectiveRole === 'admin',
        isStudent: effectiveRole === 'student'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
