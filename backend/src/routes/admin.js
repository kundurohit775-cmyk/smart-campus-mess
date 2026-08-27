import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';
import { imageService, GENERIC_FOOD_PLACEHOLDER } from '../services/imageService.js';

const router = express.Router();

// Allow Admin and Chef to manage menu, analytics & food catalog
router.use(authenticateToken, requireRole('admin', 'chef'));

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
 * List all menu items including stock, specials & active status
 */
router.get('/menu', async (req, res, next) => {
  try {
    const rawItems = await db.all(`
      SELECT m.*, COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.quantity ELSE 0 END), 0) as booked_stock
      FROM menu_items m
      LEFT JOIN pre_orders p ON m.item_id = p.item_id AND p.scheduled_date = m.special_available_date
      GROUP BY m.item_id
      ORDER BY m.item_id DESC
    `);
    const items = rawItems.map(row => {
      let is_healthy = false;
      if (row.healthy_override !== null && row.healthy_override !== undefined) {
        is_healthy = Boolean(row.healthy_override);
      } else if (row.calories !== null && row.calories !== undefined && row.calories !== '') {
        is_healthy = Number(row.calories) <= 400;
      }

      const isSpecial = Boolean(row.is_special);
      let remainingStock = row.available_quantity;
      if (isSpecial && row.special_stock_limit != null) {
        const limit = parseInt(row.special_stock_limit, 10);
        const booked = parseInt(row.booked_stock, 10);
        remainingStock = Math.max(0, limit - booked);
      }

      const hasUploadedImg = Boolean(row.image_url && row.image_url.trim() !== '');
      const fallbackImg = row.fallback_image_url || imageService.resolveDishImage(row.item_name, row.category);
      const displayImg = hasUploadedImg ? row.image_url : (fallbackImg || GENERIC_FOOD_PLACEHOLDER);
      const isAutoImage = !hasUploadedImg && Boolean(fallbackImg);

      return {
        ...row,
        image_url: hasUploadedImg ? row.image_url : null,
        fallback_image_url: fallbackImg,
        display_image_url: displayImg,
        effective_image_url: displayImg,
        is_auto_image: isAutoImage,
        isAutoImage,
        is_special: isSpecial,
        isSpecial,
        remaining_stock: remainingStock,
        remaining_count: remainingStock,
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
 * POST /api/admin/menu/:itemId/refresh-image
 * Chef / Admin: Re-fetch an alternate auto-matched food photo for the dish
 */
router.post('/menu/:itemId/refresh-image', async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const result = await imageService.refreshDishImage(itemId);

    res.json({
      success: true,
      message: 'Dish image refreshed successfully.',
      ...result
    });
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
    const { 
      item_name, category, price, calories, healthy_override, 
      is_special, special_stock_limit, special_available_date,
      description, image_url, available_quantity 
    } = req.body;

    if (!item_name || !category || price === undefined) {
      return res.status(400).json({ error: 'Item name, category, and price are required.' });
    }

    const uploadedImg = (image_url && image_url.trim() !== '') ? image_url.trim() : null;
    const fallbackImg = uploadedImg ? null : imageService.resolveDishImage(item_name, category);
    const cal = (calories !== undefined && calories !== null && calories !== '') ? parseInt(calories, 10) : null;
    let overrideVal = null;
    if (healthy_override === true || healthy_override === 'true') overrideVal = true;
    else if (healthy_override === false || healthy_override === 'false') overrideVal = false;

    const isSpecialVal = Boolean(is_special === true || is_special === 'true');
    const stockLimitVal = (special_stock_limit !== undefined && special_stock_limit !== null && special_stock_limit !== '')
      ? parseInt(special_stock_limit, 10)
      : null;
    const availDateVal = special_available_date || null;

    const result = await db.run(`
      INSERT INTO menu_items (
        item_name, category, price, calories, healthy_override, 
        is_special, special_stock_limit, special_available_date,
        description, image_url, fallback_image_url, available_quantity, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, 
      item_name.trim(), category.trim(), parseInt(price, 10), cal, overrideVal, 
      isSpecialVal, stockLimitVal, availDateVal,
      description || '', uploadedImg, fallbackImg, parseInt(available_quantity || 0, 10)
    );

    const newItem = await db.get('SELECT * FROM menu_items WHERE item_id = ?', result.lastInsertRowid);
    let is_healthy = false;
    if (newItem.healthy_override !== null && newItem.healthy_override !== undefined) {
      is_healthy = Boolean(newItem.healthy_override);
    } else if (newItem.calories !== null && newItem.calories !== undefined) {
      is_healthy = Number(newItem.calories) <= 400;
    }

    const displayImg = newItem.image_url || newItem.fallback_image_url || GENERIC_FOOD_PLACEHOLDER;

    res.status(201).json({
      message: `Menu item "${newItem.item_name}" created successfully.`,
      item: { 
        ...newItem, 
        display_image_url: displayImg,
        is_auto_image: !newItem.image_url && Boolean(newItem.fallback_image_url),
        is_healthy, 
        isHealthy: is_healthy 
      }
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
    const { 
      item_name, category, price, calories, healthy_override, 
      is_special, special_stock_limit, special_available_date,
      description, image_url, available_quantity, is_active 
    } = req.body;

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

    let isSpecialVal = existing.is_special;
    if (is_special !== undefined) {
      isSpecialVal = Boolean(is_special === true || is_special === 'true');
    }

    let stockLimitVal = existing.special_stock_limit;
    if (special_stock_limit !== undefined) {
      stockLimitVal = (special_stock_limit === null || special_stock_limit === '') ? null : parseInt(special_stock_limit, 10);
    }

    let availDateVal = existing.special_available_date;
    if (special_available_date !== undefined) {
      availDateVal = (special_available_date === null || special_available_date === '') ? null : special_available_date;
    }

    let uploadedImgVal = existing.image_url;
    let fallbackImgVal = existing.fallback_image_url;

    if (image_url !== undefined) {
      if (image_url && image_url.trim() !== '') {
        uploadedImgVal = image_url.trim();
      } else {
        uploadedImgVal = null;
        if (!fallbackImgVal) {
          fallbackImgVal = imageService.resolveDishImage(item_name || existing.item_name, category || existing.category);
        }
      }
    }

    await db.run(`
      UPDATE menu_items 
      SET item_name = COALESCE(?, item_name),
          category = COALESCE(?, category),
          price = COALESCE(?, price),
          calories = ?,
          healthy_override = ?,
          is_special = ?,
          special_stock_limit = ?,
          special_available_date = ?,
          description = COALESCE(?, description),
          image_url = ?,
          fallback_image_url = ?,
          available_quantity = COALESCE(?, available_quantity),
          is_active = COALESCE(?, is_active)
      WHERE item_id = ?
    `,
      item_name ? item_name.trim() : null,
      category ? category.trim() : null,
      price !== undefined ? parseInt(price, 10) : null,
      calVal,
      overrideVal,
      isSpecialVal,
      stockLimitVal,
      availDateVal,
      description !== undefined ? description : null,
      uploadedImgVal,
      fallbackImgVal,
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

    const displayImg = updated.image_url || updated.fallback_image_url || GENERIC_FOOD_PLACEHOLDER;

    res.json({
      message: `Menu item "${updated.item_name}" updated.`,
      item: { 
        ...updated, 
        display_image_url: displayImg,
        is_auto_image: !updated.image_url && Boolean(updated.fallback_image_url),
        is_healthy, 
        isHealthy: is_healthy 
      }
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
