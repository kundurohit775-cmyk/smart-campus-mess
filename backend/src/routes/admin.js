import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';

const router = express.Router();

// Require admin access for all routes in this file
router.use(authenticateToken, requireRole('admin'));

/**
 * GET /api/admin/analytics
 * Summary statistics & insights for dashboard
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const totalStudentsRow = await db.get("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const totalStudents = totalStudentsRow ? parseInt(totalStudentsRow.count, 10) : 0;

    const ordersTodayRow = await db.get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_credits
      FROM orders 
      WHERE DATE(order_time) = CURRENT_DATE AND order_status != 'Cancelled'
    `);

    const pendingOrdersRow = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE order_status IN ('Pending', 'Accepted', 'Preparing')
    `);
    const pendingOrdersCount = pendingOrdersRow ? parseInt(pendingOrdersRow.count, 10) : 0;

    const completedOrdersRow = await db.get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE order_status = 'Completed'
    `);
    const completedOrdersCount = completedOrdersRow ? parseInt(completedOrdersRow.count, 10) : 0;

    // Top ordered dishes
    const topItems = await db.all(`
      SELECT m.item_name, m.category, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status != 'Cancelled'
      GROUP BY m.item_id, m.item_name, m.category
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Low credit students count
    const lowCreditRow = await db.get(`
      SELECT COUNT(*) as count 
      FROM credits c
      JOIN students s ON c.student_id = s.student_id
      WHERE c.remaining_credits < 500 AND s.status = 'active'
    `);
    const lowCreditStudents = lowCreditRow ? parseInt(lowCreditRow.count, 10) : 0;

    res.json({
      analytics: {
        totalStudents,
        ordersToday: ordersTodayRow ? parseInt(ordersTodayRow.count, 10) : 0,
        creditsUsedToday: ordersTodayRow ? parseInt(ordersTodayRow.total_credits, 10) : 0,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        lowCreditStudents,
        topItems
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/students
 * List all students with current month balance
 */
router.get('/students', async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const students = await db.all(`
      SELECT s.student_id, s.name, s.email, s.phone, s.room_number, s.status, s.created_at,
             COALESCE(c.remaining_credits, 9000) as remaining_credits,
             COALESCE(c.used_credits, 0) as used_credits,
             COALESCE(c.monthly_limit, 9000) as monthly_limit
      FROM students s
      LEFT JOIN credits c ON s.student_id = c.student_id AND c.month = ? AND c.year = ?
      ORDER BY s.student_id ASC
    `, currentMonth, currentYear);

    res.json({ students });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/students/:studentId/credits
 * Modify credits: action = 'reset' (to 9000) OR 'adjust' (by amount)
 */
router.patch('/students/:studentId/credits', async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const { action, amount, reason } = req.body;

    if (action === 'reset') {
      const result = await creditService.resetMonthlyCredits(studentId);
      return res.json({
        message: `Student #${studentId} credits reset to 9,000`,
        credits: result
      });
    }

    if (action === 'adjust') {
      const adjAmount = parseInt(amount, 10);
      if (isNaN(adjAmount)) {
        return res.status(400).json({ error: 'Adjustment amount must be a number.' });
      }
      const result = await creditService.adjustStudentCredits(studentId, adjAmount, reason);
      return res.json({
        message: `Student #${studentId} credits adjusted by ${adjAmount}`,
        credits: result
      });
    }

    res.status(400).json({ error: 'Invalid action. Must be "reset" or "adjust".' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/menu
 * List all menu items including stock & active status
 */
router.get('/menu', async (req, res, next) => {
  try {
    const rawItems = await db.all('SELECT * FROM menu_items ORDER BY item_id DESC');
    const items = rawItems.map(row => {
      let is_healthy = false;
      if (row.healthy_override !== null && row.healthy_override !== undefined) {
        is_healthy = Boolean(row.healthy_override);
      } else if (row.calories !== null && row.calories !== undefined && row.calories !== '') {
        is_healthy = Number(row.calories) <= 400;
      }
      return {
        ...row,
        is_healthy,
        isHealthy: is_healthy
      };
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/menu
 * Create a new menu item
 */
router.post('/menu', async (req, res, next) => {
  try {
    const { item_name, category, price, calories, healthy_override, description, image_url, available_quantity } = req.body;

    if (!item_name || !category || price === undefined) {
      return res.status(400).json({ error: 'Item name, category, and price are required.' });
    }

    const defaultImg = image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
    const cal = (calories !== undefined && calories !== null && calories !== '') ? parseInt(calories, 10) : null;
    let overrideVal = null;
    if (healthy_override === true || healthy_override === 'true') overrideVal = true;
    else if (healthy_override === false || healthy_override === 'false') overrideVal = false;

    const result = await db.run(`
      INSERT INTO menu_items (item_name, category, price, calories, healthy_override, description, image_url, available_quantity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, item_name.trim(), category.trim(), parseInt(price, 10), cal, overrideVal, description || '', defaultImg, parseInt(available_quantity || 0, 10));

    const newItem = await db.get('SELECT * FROM menu_items WHERE item_id = ?', result.lastInsertRowid);
    let is_healthy = false;
    if (newItem.healthy_override !== null && newItem.healthy_override !== undefined) {
      is_healthy = Boolean(newItem.healthy_override);
    } else if (newItem.calories !== null && newItem.calories !== undefined) {
      is_healthy = Number(newItem.calories) <= 400;
    }

    res.status(201).json({
      message: `Menu item "${newItem.item_name}" created successfully.`,
      item: { ...newItem, is_healthy, isHealthy: is_healthy }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/menu/:itemId
 * Update an existing menu item
 */
router.patch('/menu/:itemId', async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const { item_name, category, price, calories, healthy_override, description, image_url, available_quantity, is_active } = req.body;

    const existing = await db.get('SELECT * FROM menu_items WHERE item_id = ?', itemId);
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    let overrideVal = existing.healthy_override;
    if (healthy_override === true || healthy_override === 'true') overrideVal = true;
    else if (healthy_override === false || healthy_override === 'false') overrideVal = false;
    else if (healthy_override === null || healthy_override === 'null' || healthy_override === '') overrideVal = null;

    let calVal = existing.calories;
    if (calories !== undefined) {
      calVal = (calories === null || calories === '') ? null : parseInt(calories, 10);
    }

    await db.run(`
      UPDATE menu_items 
      SET item_name = COALESCE(?, item_name),
          category = COALESCE(?, category),
          price = COALESCE(?, price),
          calories = ?,
          healthy_override = ?,
          description = COALESCE(?, description),
          image_url = COALESCE(?, image_url),
          available_quantity = COALESCE(?, available_quantity),
          is_active = COALESCE(?, is_active)
      WHERE item_id = ?
    `,
      item_name ? item_name.trim() : null,
      category ? category.trim() : null,
      price !== undefined ? parseInt(price, 10) : null,
      calVal,
      overrideVal,
      description !== undefined ? description : null,
      image_url !== undefined ? image_url : null,
      available_quantity !== undefined ? parseInt(available_quantity, 10) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      itemId
    );

    const updated = await db.get('SELECT * FROM menu_items WHERE item_id = ?', itemId);
    let is_healthy = false;
    if (updated.healthy_override !== null && updated.healthy_override !== undefined) {
      is_healthy = Boolean(updated.healthy_override);
    } else if (updated.calories !== null && updated.calories !== undefined) {
      is_healthy = Number(updated.calories) <= 400;
    }

    res.json({
      message: `Menu item "${updated.item_name}" updated.`,
      item: { ...updated, is_healthy, isHealthy: is_healthy }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/menu/:itemId
 * Soft-delete menu item
 */
router.delete('/menu/:itemId', async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);

    // Soft delete to protect relational integrity with order_items
    await db.run('UPDATE menu_items SET is_active = 0 WHERE item_id = ?', itemId);

    res.json({ message: `Menu item #${itemId} deactivated.` });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/orders
 * List all orders
 */
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await db.all(`
      SELECT o.*, s.name as student_name, s.email as student_email, s.room_number
      FROM orders o
      JOIN students s ON o.student_id = s.student_id
      ORDER BY o.order_id DESC
      LIMIT 100
    `);

    const result = [];
    for (const o of orders) {
      const items = await db.all(`
        SELECT oi.*, m.item_name, m.category
        FROM order_items oi
        JOIN menu_items m ON oi.item_id = m.item_id
        WHERE oi.order_id = ?
      `, o.order_id);
      result.push({ ...o, items });
    }

    res.json({ orders: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/transactions
 * List all campus credit transactions
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await db.all(`
      SELECT t.*, s.name as student_name, s.email as student_email, s.room_number,
             o.pickup_token, o.order_status
      FROM transactions t
      JOIN students s ON t.student_id = s.student_id
      LEFT JOIN orders o ON t.order_id = o.order_id
      ORDER BY t.transaction_id DESC
      LIMIT 150
    `);

    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

export default router;
