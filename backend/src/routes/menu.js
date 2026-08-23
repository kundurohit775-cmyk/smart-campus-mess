import express from 'express';
import pg from 'pg';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

let pgPool = null;
if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.includes('sample_pass')) {
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
}

/**
 * GET /api/menu
 * Public or Authenticated: Returns all active menu items with live available stock from Neon PostgreSQL or SQLite.
 */
router.get('/', async (req, res, next) => {
  try {
    let items = [];

    if (pgPool) {
      try {
        const result = await pgPool.query(`
          SELECT item_id, item_name, category, price, description, image_url, available_quantity, is_active,
                 (CASE WHEN available_quantity <= 0 THEN 1 ELSE 0 END) as is_sold_out
          FROM menu_items
          WHERE is_active = 1
          ORDER BY category ASC, item_name ASC
        `);
        items = result.rows;
      } catch (pgErr) {
        console.warn('⚠️ Postgres menu query error, falling back to local DB:', pgErr.message);
      }
    }

    if (items.length === 0) {
      items = db.prepare(`
        SELECT item_id, item_name, category, price, description, image_url, available_quantity, is_active,
               (CASE WHEN available_quantity <= 0 THEN 1 ELSE 0 END) as is_sold_out
        FROM menu_items
        WHERE is_active = 1
        ORDER BY category ASC, item_name ASC
      `).all();
    }

    res.json({
      items,
      count: items.length
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

    let currentItem = null;
    if (pgPool) {
      const r = await pgPool.query('SELECT * FROM menu_items WHERE item_id = $1', [itemId]);
      currentItem = r.rows[0];
    }
    if (!currentItem) {
      currentItem = db.prepare('SELECT * FROM menu_items WHERE item_id = ?').get(itemId);
    }

    if (!currentItem) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    let newQty;
    if (available_quantity !== undefined) {
      newQty = Math.max(0, parseInt(available_quantity, 10));
    } else {
      newQty = currentItem.available_quantity > 0 ? 0 : 30;
    }

    // Update in both Neon & SQLite
    if (pgPool) {
      await pgPool.query('UPDATE menu_items SET available_quantity = $1 WHERE item_id = $2', [newQty, itemId]);
    }
    db.prepare('UPDATE menu_items SET available_quantity = ? WHERE item_id = ?').run(newQty, itemId);

    res.json({
      message: `Stock updated for ${currentItem.item_name}`,
      item: {
        ...currentItem,
        available_quantity: newQty,
        is_sold_out: newQty <= 0 ? 1 : 0
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
