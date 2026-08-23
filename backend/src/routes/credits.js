import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';

const router = express.Router();

/**
 * GET /api/credits/:studentId
 * Returns current monthly balance, limit, used credits, low balance warning, and transaction ledger.
 */
router.get('/:studentId', authenticateToken, (req, res, next) => {
  try {
    const rawId = req.params.studentId;
    const user = req.user;

    // Lookup student in DB by ID or Email
    let student = db.prepare('SELECT student_id, name, email, room_number FROM students WHERE student_id = ? OR email = ?').get(rawId, user?.email || rawId);

    if (!student && user && user.role === 'student') {
      // Auto-sync Better Auth student into students table
      const insert = db.prepare(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES (?, ?, ?, 'better-auth-managed', ?, 'active')
      `);
      const result = insert.run(user.name || 'Student', user.email, user.phone || '', user.roomNumber || 'Hostel');
      student = db.prepare('SELECT student_id, name, email, room_number FROM students WHERE student_id = ?').get(result.lastInsertRowid);
    }

    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const credits = creditService.getOrCreateMonthlyCredits(student.student_id);

    const transactions = db.prepare(`
      SELECT t.*, o.pickup_token, o.order_status
      FROM transactions t
      LEFT JOIN orders o ON t.order_id = o.order_id
      WHERE t.student_id = ?
      ORDER BY t.transaction_id DESC
      LIMIT 50
    `).all(student.student_id);

    res.json({
      student,
      credits: {
        credit_id: credits.credit_id,
        monthly_limit: credits.monthly_limit,
        used_credits: credits.used_credits,
        remaining_credits: credits.remaining_credits,
        month: credits.month,
        year: credits.year,
        is_low_balance: credits.is_low_balance,
        low_balance_threshold: 500
      },
      transactions
    });
  } catch (err) {
    next(err);
  }
});

export default router;
