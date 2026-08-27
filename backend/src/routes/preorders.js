import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { preOrderService } from '../services/preOrderService.js';

const router = express.Router();

async function resolveStudent(reqUser) {
  if (!reqUser) return null;
  let student = await db.get('SELECT student_id, name, email FROM students WHERE student_id = ? OR email = ?', reqUser.id, reqUser.email);
  return student;
}

/**
 * GET /api/preorders/specials
 * Public or Authenticated: Returns all active specials available for next-day pre-order with live remaining stock.
 */
router.get('/specials', async (req, res, next) => {
  try {
    const specials = await preOrderService.getTomorrowSpecials();
    res.json({
      specials,
      count: specials.length,
      tomorrowDate: preOrderService.getTomorrowDate()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/preorders
 * Student: Place a next-day pre-order for a special dish
 * Body: { itemId: 12, quantity: 3 }
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const { itemId, quantity } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required.' });
    }

    const qty = parseInt(quantity || 1, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const result = await preOrderService.placePreOrder(student.student_id, itemId, qty);

    res.status(201).json({
      success: true,
      message: `Successfully pre-ordered ${qty}x ${result.item_name} for ${result.scheduled_date}!`,
      preOrder: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/preorders/my
 * Student: Get list of all my upcoming and past pre-orders
 */
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const preOrders = await preOrderService.getStudentPreOrders(student.student_id);

    res.json({
      success: true,
      preOrders,
      count: preOrders.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/preorders/:preOrderId/cancel
 * Student: Cancel an upcoming pre-order and refund credits
 */
router.post('/:preOrderId/cancel', authenticateToken, async (req, res, next) => {
  try {
    const student = await resolveStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    const result = await preOrderService.cancelPreOrder(req.params.preOrderId, student.student_id);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/preorders/admin
 * Chef / Admin: List all pre-orders for kitchen preparation & token fulfillment
 */
router.get('/admin', authenticateToken, requireRole('chef', 'admin'), async (req, res, next) => {
  try {
    const { date, itemId } = req.query;
    const preOrders = await preOrderService.getAllPreOrders(date, itemId);

    res.json({
      preOrders,
      count: preOrders.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/preorders/admin/:preOrderId/fulfill
 * Chef / Admin: Mark a pre-order as fulfilled when student picks up their meal
 */
router.patch('/admin/:preOrderId/fulfill', authenticateToken, requireRole('chef', 'admin'), async (req, res, next) => {
  try {
    const preOrder = await preOrderService.fulfillPreOrder(req.params.preOrderId);

    res.json({
      success: true,
      message: `Pre-order #${preOrder.pre_order_id} marked as fulfilled.`,
      preOrder
    });
  } catch (err) {
    next(err);
  }
});

export default router;
