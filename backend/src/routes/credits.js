import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';

const router = express.Router();

async function resolveStudent(reqUser, targetParam) {
  if (!reqUser) return null;
  let student = await db.get('SELECT student_id, name, email, room_number, daily_calorie_goal, health_mode_enabled FROM students WHERE student_id = ? OR email = ?', targetParam || reqUser.id, reqUser.email);
  if (!student && reqUser.role === 'student') {
    const result = await db.run(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES (?, ?, ?, 'better-auth-managed', ?, 'active')
    `, reqUser.name || 'Student', reqUser.email, reqUser.phone || '', reqUser.roomNumber || 'Hostel');
    student = await db.get('SELECT student_id, name, email, room_number, daily_calorie_goal, health_mode_enabled FROM students WHERE student_id = ?', result.lastInsertRowid);
  }
  return student;
}

/**
 * GET /api/credits/health-stats
 * Returns today's consumed calories, student's daily calorie goal, and healthModeEnabled preference.
 * Shape: { goal: number|null, consumed: number, date: string, healthModeEnabled: boolean }
 */
router.get('/health-stats', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    // Get today's intake from student_daily_intake table
    const intakeRow = await db.get(`
      SELECT calories, date 
      FROM student_daily_intake 
      WHERE student_id = ? AND date = CURRENT_DATE
    `, student.student_id);

    const consumedToday = intakeRow ? parseInt(intakeRow.calories, 10) : 0;
    const todayDate = new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      studentId: student.student_id,
      date: intakeRow?.date || todayDate,
      goal: student.daily_calorie_goal,
      dailyCalorieGoal: student.daily_calorie_goal,
      consumed: consumedToday,
      consumedToday,
      healthModeEnabled: Boolean(student.health_mode_enabled)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/credits/calorie-goal
 * Sets or updates the student's daily calorie goal.
 * Body: { dailyCalorieGoal: 2000 }
 */
router.patch('/calorie-goal', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const { dailyCalorieGoal, goal } = req.body;
    const inputVal = dailyCalorieGoal !== undefined ? dailyCalorieGoal : goal;
    const goalVal = (inputVal === null || inputVal === undefined || inputVal === '')
      ? null
      : Math.max(500, Math.min(10000, parseInt(inputVal, 10)));

    await db.run(`
      UPDATE students 
      SET daily_calorie_goal = ? 
      WHERE student_id = ?
    `, goalVal, student.student_id);

    // Fetch today's intake
    const intakeRow = await db.get(`
      SELECT calories 
      FROM student_daily_intake 
      WHERE student_id = ? AND date = CURRENT_DATE
    `, student.student_id);

    res.json({
      success: true,
      message: goalVal ? `Daily calorie goal set to ${goalVal} kcal.` : 'Daily calorie goal removed.',
      goal: goalVal,
      dailyCalorieGoal: goalVal,
      consumed: intakeRow ? parseInt(intakeRow.calories, 10) : 0,
      consumedToday: intakeRow ? parseInt(intakeRow.calories, 10) : 0
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/credits/health-mode
 * Persists student's Health Mode toggle preference.
 * Body: { enabled: true }
 */
router.patch('/health-mode', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const { enabled } = req.body;
    const isEnabled = Boolean(enabled);

    await db.run(`
      UPDATE students 
      SET health_mode_enabled = ? 
      WHERE student_id = ?
    `, isEnabled, student.student_id);

    res.json({
      success: true,
      healthModeEnabled: isEnabled
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/credits/:studentId
 * Returns current monthly balance, limit, used credits, low balance warning, and transaction ledger.
 */
router.get('/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const rawId = req.params.studentId;
    const user = req.user;

    const student = await resolveStudent(user, rawId);

    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const credits = await creditService.getOrCreateMonthlyCredits(student.student_id);

    const transactions = await db.all(`
      SELECT t.*, o.pickup_token, o.order_status, o.total_calories
      FROM transactions t
      LEFT JOIN orders o ON t.order_id = o.order_id
      WHERE t.student_id = ?
      ORDER BY t.transaction_id DESC
      LIMIT 50
    `, student.student_id);

    // Get today's intake
    const intakeRow = await db.get(`
      SELECT calories 
      FROM student_daily_intake 
      WHERE student_id = ? AND date = CURRENT_DATE
    `, student.student_id);

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
        low_balance_threshold: 500,
        daily_calorie_goal: student.daily_calorie_goal,
        consumed_calories_today: intakeRow ? parseInt(intakeRow.calories, 10) : 0,
        health_mode_enabled: Boolean(student.health_mode_enabled)
      },
      transactions
    });
  } catch (err) {
    next(err);
  }
});

export default router;
