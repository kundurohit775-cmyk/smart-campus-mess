import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

export const HEALTHY_CALORIE_THRESHOLD = 400;

/**
 * Determines whether a dish is diet-friendly:
 * - If healthy_override is set (boolean), use that override.
 * - Otherwise, true if calories != null and calories <= 400 kcal.
 * - If calories == null and no override, returns false (hidden in Health Mode).
 */
export function computeIsHealthy(item) {
  if (item.healthy_override !== null && item.healthy_override !== undefined) {
    return Boolean(item.healthy_override);
  }
  if (item.calories !== null && item.calories !== undefined && item.calories !== '') {
    return Number(item.calories) <= HEALTHY_CALORIE_THRESHOLD;
  }
  return false;
}

/**
 * GET /api/menu
 * Public or Authenticated: Returns all active menu items with live stock, special pre-order metadata, calorie counts, and computed is_healthy status.
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT m.item_id, m.item_name, m.category, m.price, m.calories, m.healthy_override,
             m.is_special, m.special_stock_limit, m.special_available_date,
             m.description, m.image_url, m.available_quantity, m.is_active,
             COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.quantity ELSE 0 END), 0) as booked_stock
      FROM menu_items m
      LEFT JOIN pre_orders p ON m.item_id = p.item_id AND p.scheduled_date = m.special_available_date
      WHERE m.is_active = 1
      GROUP BY m.item_id
      ORDER BY m.is_special DESC, m.category ASC, m.item_name ASC
    `);

    const items = result.rows.map(row => {
      const isSpecial = Boolean(row.is_special);
      let remainingStock = row.available_quantity;
      let isSoldOut = row.available_quantity <= 0;

      if (isSpecial && row.special_stock_limit != null) {
        const limit = parseInt(row.special_stock_limit, 10);
        const booked = parseInt(row.booked_stock, 10);
        remainingStock = Math.max(0, limit - booked);
        isSoldOut = remainingStock <= 0;
      }

      return {
        ...row,
        is_special: isSpecial,
        isSpecial,
        remaining_stock: remainingStock,
        remaining_count: remainingStock,
        is_sold_out: isSoldOut ? 1 : 0,
        isSoldOut,
        is_healthy: computeIsHealthy(row),
        isHealthy: computeIsHealthy(row)
      };
    });

    res.json({
      items,
      count: items.length,
      healthyCalorieThreshold: HEALTHY_CALORIE_THRESHOLD
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/menu/:itemId/toggle-stock
 * Chef / Mess Staff quick stock toggler
 */
router.patch('/:itemId/toggle-stock', authenticateToken, requireRole('chef', 'admin'), async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const { available_quantity } = req.body;

    const currentItem = await db.get('SELECT * FROM menu_items WHERE item_id = ?', itemId);

    if (!currentItem) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    let newQty;
    if (available_quantity !== undefined) {
      newQty = Math.max(0, parseInt(available_quantity, 10));
    } else {
      newQty = currentItem.available_quantity > 0 ? 0 : 30;
    }

    await db.run('UPDATE menu_items SET available_quantity = ? WHERE item_id = ?', newQty, itemId);

    res.json({
      message: `Stock updated for ${currentItem.item_name}`,
      item: {
        ...currentItem,
        available_quantity: newQty,
        is_sold_out: newQty <= 0 ? 1 : 0,
        is_healthy: computeIsHealthy(currentItem),
        isHealthy: computeIsHealthy(currentItem)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
