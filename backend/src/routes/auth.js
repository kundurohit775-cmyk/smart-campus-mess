import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';
import { smsService } from '../services/smsService.js';

const router = express.Router();

// Rate limiting caches
const otpSendRateLimit = new Map(); // Map<phone, number[]>
const otpVerifyAttempts = new Map(); // Map<phone, { count: number, lockedUntil: number }>

function checkSendRateLimit(phone) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const timestamps = (otpSendRateLimit.get(phone) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= 3) {
    return false;
  }

  timestamps.push(now);
  otpSendRateLimit.set(phone, timestamps);
  return true;
}

function checkVerifyAttempts(phone) {
  const now = Date.now();
  const record = otpVerifyAttempts.get(phone);

  if (record && record.lockedUntil > now) {
    const remainingMins = Math.ceil((record.lockedUntil - now) / (60 * 1000));
    return { allowed: false, message: `Account temporarily locked due to multiple failed verification attempts. Please try again in ${remainingMins} minutes.` };
  }

  return { allowed: true };
}

function recordFailedVerifyAttempt(phone) {
  const now = Date.now();
  const record = otpVerifyAttempts.get(phone) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    record.count = 0;
  }

  otpVerifyAttempts.set(phone, record);
}

function clearVerifyAttempts(phone) {
  otpVerifyAttempts.delete(phone);
}

/**
 * =============================================================================
 * 1. STUDENT REGISTRATION (DIRECT 1-STEP REGISTRATION — STRICT @vitstudent.ac.in)
 * =============================================================================
 * POST /api/auth-helpers/register (and /api/auth/register)
 * Body: { name, email, password, phone, roomNumber }
 * Directly creates student account, allocates 9,000 monthly credits, and returns session token.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, roomNumber } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, mobile number, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const formattedPhone = smsService.formatPhoneNumber(phone);

    // 1. STRICT VIT STUDENT EMAIL RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
      });
    }

    // 2. Validate Mobile Number (10+ digits)
    if (formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    // 3. Check for existing email or phone
    const existingStudentByEmail = await db.get('SELECT student_id FROM students WHERE LOWER(email) = ?', cleanEmail);
    const existingAdmin = await db.get('SELECT admin_id FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (existingStudentByEmail || existingAdmin) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const existingStudentByPhone = await db.get('SELECT student_id FROM students WHERE phone = ?', formattedPhone);
    if (existingStudentByPhone) {
      return res.status(400).json({ error: 'An account with this mobile number already exists.' });
    }

    // 4. Create Student in PostgreSQL Database
    const passwordHash = await bcrypt.hash(password, 10);
    const studentName = name.trim();

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

    // Allocate 9,000 monthly credits
    const credits = await creditService.getOrCreateMonthlyCredits(studentId);

    // Issue JWT Session Token
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
      message: 'Account created successfully! 9,000 monthly dining credits granted.',
      token,
      user: userObj
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 2. STUDENT LOGIN METHOD A: EMAIL + PASSWORD
 * =============================================================================
 * POST /api/auth-helpers/login
 * Body: { email, password }
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
          isWarden: false,
          isStudent: effectiveRole === 'student'
        }
      });
    }

    // 2. Check in Wardens (Hostel Wardens)
    const warden = await db.get('SELECT * FROM wardens WHERE LOWER(email) = ?', cleanEmail);
    if (warden) {
      const match = await bcrypt.compare(password, warden.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { 
          id: warden.warden_id, 
          email: warden.email, 
          role: 'warden', 
          name: warden.name,
          phone: warden.phone,
          assignedHostelBlock: warden.assigned_hostel_block
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: warden.warden_id,
          name: warden.name,
          email: warden.email,
          phone: warden.phone,
          role: 'warden',
          assignedHostelBlock: warden.assigned_hostel_block,
          isWarden: true,
          isChef: false,
          isAdmin: false,
          isStudent: false
        }
      });
    }

    // 3. STRICT VIT STUDENT EMAIL LOGIN RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(403).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.'
      });
    }

    // 4. Check in Students
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
 * 3. STUDENT LOGIN METHOD B: MOBILE OTP (TWILIO VERIFY)
 * =============================================================================
 */

/**
 * POST /api/auth-helpers/login/send-otp (and /otp/send)
 * Body: { phone }
 */
router.post(['/login/send-otp', '/otp/send'], async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ error: 'Please enter a valid mobile number.' });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);

    // 1. Rate Limiting: Max 3 requests per phone per 10 minutes
    if (!checkSendRateLimit(formattedPhone)) {
      return res.status(429).json({
        error: 'Too many OTP requests. Maximum 3 requests allowed per 10 minutes. Please try again later.'
      });
    }

    // 2. Look up student by registered phone number
    const student = await db.get(`
      SELECT student_id, name, email, phone, status 
      FROM students 
      WHERE phone = ? OR phone = ?
      LIMIT 1
    `, formattedPhone, phone.replace(/\D/g, ''));

    if (!student) {
      // Safe generic message to prevent enumeration
      return res.json({
        success: true,
        message: 'If this mobile number is registered, a verification code has been sent via SMS.',
        phone: formattedPhone
      });
    }

    if (student.status !== 'active') {
      return res.status(403).json({ error: 'Student account is deactivated. Please contact administration.' });
    }

    // 3. Dispatch Twilio Verify SMS
    const result = await smsService.sendVerifyOtp(formattedPhone);

    return res.json({
      success: true,
      message: result?.message || `Verification code sent via SMS to ${formattedPhone}.`,
      phone: formattedPhone
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth-helpers/login/verify-otp (and /otp/verify)
 * Body: { phone, code } (or { phone, otp })
 */
router.post(['/login/verify-otp', '/otp/verify'], async (req, res, next) => {
  try {
    const { phone, code, otp } = req.body;
    const otpCode = (code || otp || '').toString().trim();

    if (!phone || !otpCode) {
      return res.status(400).json({ error: 'Mobile number and 6-digit verification code are required.' });
    }

    const formattedPhone = smsService.formatPhoneNumber(phone);

    // 1. Check attempt lockout
    const attemptCheck = checkVerifyAttempts(formattedPhone);
    if (!attemptCheck.allowed) {
      return res.status(429).json({ error: attemptCheck.message });
    }

    // 2. Verify with Twilio Verify
    const isApproved = await smsService.checkVerifyOtp(formattedPhone, otpCode);

    if (!isApproved) {
      recordFailedVerifyAttempt(formattedPhone);
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check your SMS and try again.'
      });
    }

    // 3. Find registered student
    const student = await db.get(`
      SELECT * FROM students 
      WHERE phone = ? OR phone = ?
      LIMIT 1
    `, formattedPhone, phone.replace(/\D/g, ''));

    if (!student) {
      return res.status(404).json({
        error: 'No registered student account was found associated with this mobile number. Please register first.'
      });
    }

    if (student.status !== 'active') {
      return res.status(403).json({ error: 'Student account is deactivated. Please contact campus admin.' });
    }

    clearVerifyAttempts(formattedPhone);

    // Allocate / retrieve monthly credits
    const credits = await creditService.getOrCreateMonthlyCredits(student.student_id);

    // 4. Issue signed JWT session token
    const token = jwt.sign(
      {
        id: student.student_id,
        email: student.email,
        name: student.name,
        role: 'student',
        phone: student.phone
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      message: 'Mobile OTP verified successfully!',
      token,
      user: {
        id: student.student_id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        roomNumber: student.room_number || 'Hostel',
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
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * 4. GET ACTIVE USER DETAILS
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
    if (req.user.role === 'warden') {
      const warden = await db.get('SELECT warden_id, name, email, phone, assigned_hostel_block FROM wardens WHERE warden_id = ?', req.user.id);
      if (warden) {
        return res.json({
          user: {
            id: warden.warden_id,
            name: warden.name,
            email: warden.email,
            phone: warden.phone,
            role: 'warden',
            assignedHostelBlock: warden.assigned_hostel_block,
            isWarden: true,
            isChef: false,
            isAdmin: false,
            isStudent: false
          }
        });
      }
    }

    const admin = await db.get('SELECT admin_id, name, email, role FROM admins WHERE admin_id = ?', req.user.id);
    const effectiveRole = req.user?.role || admin?.role || 'admin';
    return res.json({
      user: {
        id: admin?.admin_id,
        name: admin?.name,
        email: admin?.email,
        role: effectiveRole,
        isChef: effectiveRole === 'chef',
        isAdmin: effectiveRole === 'admin',
        isWarden: effectiveRole === 'warden',
        isStudent: effectiveRole === 'student'
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
