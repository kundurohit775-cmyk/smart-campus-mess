import pg from 'pg';
import dotenv from 'dotenv';
import db from './database.js';

dotenv.config();

export async function syncSqliteFromNeon() {
  if (!process.env.DATABASE_URL) return;

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const neonDishes = await pool.query('SELECT item_id, item_name, category, price, description, image_url, available_quantity, is_active FROM menu_items ORDER BY item_id ASC');
    console.log(`🐘 Fetched ${neonDishes.rows.length} dishes from Neon PostgreSQL.`);

    db.transaction(() => {
      db.prepare('DELETE FROM order_items').run();
      db.prepare('DELETE FROM menu_items').run();

      const insertStmt = db.prepare(`
        INSERT INTO menu_items (item_id, item_name, category, price, description, image_url, available_quantity, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const dish of neonDishes.rows) {
        insertStmt.run(
          dish.item_id,
          dish.item_name,
          dish.category,
          dish.price,
          dish.description,
          dish.image_url,
          dish.available_quantity,
          dish.is_active ? 1 : 0
        );
      }
    })();

    console.log('✅ SQLite menu_items table synchronized 1:1 with Neon PostgreSQL IDs!');
  } catch (err) {
    console.error('❌ Sync error:', err);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('sync_sqlite_from_neon.js')) {
  syncSqliteFromNeon().then(() => process.exit(0));
}
