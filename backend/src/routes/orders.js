import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { orderService } from '../services/orderService.js';

const router = express.Router();

function resolveStudentId(user) {
  if (!user) return null;
  let student = db.prepare('SELECT student_id FROM students WHERE student_id = ? OR email = ?').get(user.id, user.email);
  if (!student) {
    const res = db.prepare(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status) 
      VALUES (?, ?, ?, 'better-auth', ?, 'active')
    `).run(user.name || 'Student', user.email, user.phone || '', user.roomNumber || 'Hostel');
    return res.lastInsertRowid;
  }
  return student.student_id;
}

/**
 * POST /api/orders
 * Places an order with atomic transaction credit deduction and stock check.
 * Body: { items: [{ itemId: 1, quantity: 2 }] }
 */
router.post('/', authenticateToken, requireRole('student'), (req, res, next) => {
  try {
    const studentId = resolveStudentId(req.user);
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items to place an order.' });
    }

    const orderResult = orderService.placeOrder(studentId, items);

    res.status(201).json({
      message: `Order #${orderResult.orderId} placed successfully! Token: ${orderResult.pickupToken}`,
      order: orderResult
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/orders
 * Returns orders based on role.
 * - Students receive their own orders
 * - Chef / Admin receive all incoming orders (with optional ?status= query)
 */
router.get('/', authenticateToken, (req, res, next) => {
  try {
    const { status } = req.query;

    if (req.user.role === 'student') {
      const studentId = resolveStudentId(req.user);
      const orders = orderService.getOrdersByStudentId(studentId);
      return res.json({ orders });
    }

    // Chef and Admin
    const orders = orderService.getAllOrders(status);
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:orderId
 * Fetches single order details
 */
router.get('/:orderId', authenticateToken, (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const order = orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Students can only view their own order
    if (req.user.role === 'student') {
      const studentId = resolveStudentId(req.user);
      if (order.student_id !== studentId) {
        return res.status(403).json({ error: 'Access denied to this order.' });
      }
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orders/:orderId/status
 * Chef or Admin moves order through the workflow:
 * Pending -> Accepted -> Preparing -> Ready -> Completed
 */
router.patch('/:orderId/status', authenticateToken, requireRole('chef', 'admin'), (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const updatedOrder = orderService.updateOrderStatus(orderId, status);

    res.json({
      message: `Order #${orderId} status updated to "${status}".`,
      order: updatedOrder
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/orders/:orderId/cancel
 * Cancels an order. STRICTLY allowed only if status is "Pending".
 * Atomically refunds credits and restores inventory.
 */
router.patch('/:orderId/cancel', authenticateToken, (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const isStaff = req.user.role === 'admin' || req.user.role === 'chef';
    const studentId = resolveStudentId(req.user);

    const result = orderService.cancelOrder(orderId, studentId, isStaff);

    res.json({
      message: `Order #${orderId} successfully cancelled. ${result.refundedAmount} credits refunded to your account.`,
      result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
