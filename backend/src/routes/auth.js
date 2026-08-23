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

    // Check in Admins / Chefs first
    const admin = await db.get('SELECT * FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: admin.admin_id, email: admin.email, role: admin.role, name: admin.name },
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
          role: admin.role
        }
      });
    }

    // 1. STRICT VIT STUDENT EMAIL LOGIN RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      return res.status(403).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.'
      });
    }

    // Check in Students
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
 * POST /api/auth-helpers/register
 * Body: { name, email, password, phone, roomNumber }
 * STRICT: Only @vitstudent.ac.in emails are allowed for student registration.
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

    // 2. Check if email already exists
    const existingStudent = await db.get('SELECT student_id FROM students WHERE LOWER(email) = ?', cleanEmail);
    const existingAdmin = await db.get('SELECT admin_id FROM admins WHERE LOWER(email) = ?', cleanEmail);

    if (existingStudent || existingAdmin) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.run(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, name.trim(), cleanEmail, phone || '', passwordHash, roomNumber || '');
    
    const studentId = result.lastInsertRowid;

    // Initialize monthly 9,000 credit allowance
    const credits = await creditService.getOrCreateMonthlyCredits(studentId);

    const token = jwt.sign(
      { id: studentId, email: cleanEmail, role: 'student', name: name.trim() },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({
      message: 'Registration successful! 9,000 Mess credits allocated.',
      token,
      user: {
        id: studentId,
        name: name.trim(),
        email: cleanEmail,
        phone,
        roomNumber,
        role: 'student',
        credits: {
          remaining: credits.remaining_credits,
          used: credits.used_credits,
          limit: credits.monthly_limit,
          isLowBalance: false
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth-helpers/otp/send
 * Body: { phone }
 * Sends 6-digit OTP via SMS (Rate limited: 3 reqs / 10 min)
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
 * POST /api/auth-helpers/otp/verify
 * Body: { phone, otp }
 * Verifies 6-digit OTP, logs student in, and returns session
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
    return res.json({
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
