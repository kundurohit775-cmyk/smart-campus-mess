import db from './database.js';

export async function migrateWastageLogs() {
  console.log('🔄 Running Wastage Logs database migration...');

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS wastage_logs (
        log_id SERIAL PRIMARY KEY,
        dish_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
        chef_id INT REFERENCES admins(admin_id) ON DELETE SET NULL,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        quantity_prepared INT NOT NULL DEFAULT 0,
        quantity_sold INT NOT NULL DEFAULT 0,
        quantity_wasted INT NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_dish_log_date UNIQUE (dish_id, log_date)
      );
    `);
    console.log('✅ Checked/Created "wastage_logs" table');

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wastage_logs_dish_date ON wastage_logs(dish_id, log_date);
      CREATE INDEX IF NOT EXISTS idx_wastage_logs_date ON wastage_logs(log_date);
    `);
    console.log('✅ Checked/Created indices for "wastage_logs"');

    console.log('🎉 Wastage Logs Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Wastage Logs Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_wastage.js')) {
  migrateWastageLogs()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
