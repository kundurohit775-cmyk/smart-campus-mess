import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';
import { otpService } from '../services/otpService.js';

const router = express.Router();

/**
 * =============================================================================
 * STUDENT REGISTRATION (DIRECT 1-STEP REGISTRATION — STRICT @vitstudent.ac.in)
 * =============================================================================
 */

/**
 * POST /api/auth-helpers/register (and /register)
 * Body: { name, email, password, phone, roomNumber }
 * Directly creates student account, allocates 9,000 monthly credits, and returns JWT session token.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, roomNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. STRICT VIT STUDENT EMAIL RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(400).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
      });
    }

    // 2. Check if email already registered
    const existingStudent = await db.get('SELECT student_id FROM students WHERE LOWER(email) = ?', cleanEmail);
    const existingAdmin = await db.get('SELECT admin_id FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (existingStudent || existingAdmin) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // 3. Create Student in PostgreSQL
    const passwordHash = await bcrypt.hash(password, 10);
    const studentName = name.trim();

    const result = await db.run(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, studentName, cleanEmail, phone || '', passwordHash, roomNumber || 'Hostel');

    const studentId = result.lastInsertRowid;

    // Dual-sync into Better Auth user & account tables
    try {
      const authUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "roomNumber", phone)
        VALUES ($1, $2, $3, TRUE, NOW(), NOW(), 'student', $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [authUserId, studentName, cleanEmail, roomNumber || 'Hostel', phone || '']);

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

    // Allocate 9,000 monthly credits allowance
    const credits = await creditService.getOrCreateMonthlyCredits(studentId);

    // Generate session JWT token
    const token = jwt.sign(
      { id: studentId, email: cleanEmail, role: 'student', name: studentName },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const userObj = {
      id: studentId,
      name: studentName,
      email: cleanEmail,
      phone: phone || '',
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
      message: 'Account created successfully! Welcome to Smart Campus Mess.',
      token,
      user: userObj
    });
  } catch (err) {
    next(err);
  }
});

/**
 * =============================================================================
 * STANDARD LOGIN FLOW (EMAIL + PASSWORD — NO OTP)
 * =============================================================================
 */

/**
 * POST /api/auth-helpers/login
 * Body: { email, password }
 * Authenticates user and issues JWT session token immediately with email + password.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in Admins / Chefs first
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
        { id: student.student_id, email: student.email, role: 'student', name: student.name },
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
 * POST /api/auth-helpers/otp/send (Mobile SMS OTP alternative)
 */
router.post('/otp/send', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    const result = await otpService.requestOtp(phone);
    res.json(result);
  } catch (err) {
    if (err.message.includes('limit reached')) {
      return res.status(429).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/auth-helpers/otp/verify (Mobile SMS OTP alternative)
 */
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required.' });
    }

    const result = await otpService.verifyOtpAndLogin(phone, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/auth-helpers/me
 * Retrieves active authenticated user details
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
