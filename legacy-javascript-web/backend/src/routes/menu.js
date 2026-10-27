import express from 'express';
import db from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { imageService, GENERIC_FOOD_PLACEHOLDER } from '../services/imageService.js';
import { preOrderService } from '../services/preOrderService.js';

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
 * Public or Authenticated: Returns all active menu items with live stock, special pre-order metadata, resolved fallback images, calorie counts, and computed is_healthy status.
 */
router.get('/', async (req, res, next) => {
  try {
    const tomorrowStr = preOrderService.getTomorrowDate();
    const result = await db.query(`
      SELECT m.item_id, m.item_name, m.category, m.price, m.calories, m.healthy_override,
             m.is_special, m.special_stock_limit, m.special_available_date,
             m.description, m.image_url, m.fallback_image_url, m.available_quantity, m.is_active,
             COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.quantity ELSE 0 END), 0) as booked_stock
      FROM menu_items m
      LEFT JOIN pre_orders p ON m.item_id = p.item_id AND p.scheduled_date = $1
      WHERE m.is_active = 1
      GROUP BY m.item_id
      ORDER BY m.is_special DESC, m.category ASC, m.item_name ASC
    `, [tomorrowStr]);

    const items = result.rows.map(row => {
      const isSpecial = Boolean(row.is_special === true || row.is_special === 'true' || row.is_special === 1 || row.is_special === '1');
      let remainingStock = parseInt(row.available_quantity, 10) || 0;
      let isSoldOut = remainingStock <= 0;

      if (isSpecial) {
        const limit = (row.special_stock_limit != null && parseInt(row.special_stock_limit, 10) > 0)
          ? parseInt(row.special_stock_limit, 10)
          : Math.max(10, parseInt(row.available_quantity, 10) || 25);
        const booked = parseInt(row.booked_stock, 10);
        remainingStock = Math.max(0, limit - booked);
        isSoldOut = remainingStock <= 0;
      }

      // Safe image resolution:
      // 1. Chef uploaded image takes top priority
      // 2. Auto-fetched fallback image
      // 3. Guaranteed generic food placeholder
      const hasUploadedImg = Boolean(row.image_url && row.image_url.trim() !== '');
      let fallbackImg = row.fallback_image_url;

      if (!hasUploadedImg && !fallbackImg) {
        fallbackImg = imageService.resolveDishImage(row.item_name, row.category);
        // Async background persist
        db.run('UPDATE menu_items SET fallback_image_url = ? WHERE item_id = ?', fallbackImg, row.item_id).catch(() => {});
      }

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
