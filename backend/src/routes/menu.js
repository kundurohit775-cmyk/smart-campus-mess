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
 * Public or Authenticated: Returns all active menu items with live available stock, calorie counts, and computed is_healthy status.
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT item_id, item_name, category, price, calories, healthy_override, description, image_url, available_quantity, is_active,
             (CASE WHEN available_quantity <= 0 THEN 1 ELSE 0 END) as is_sold_out
      FROM menu_items
      WHERE is_active = 1
      ORDER BY category ASC, item_name ASC
    `);

    const items = result.rows.map(row => ({
      ...row,
      is_healthy: computeIsHealthy(row),
      isHealthy: computeIsHealthy(row)
    }));

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
