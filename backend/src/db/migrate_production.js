import db from './database.js';

export async function migrateProductionRecords() {
  console.log('🔄 Running Production Records & Feedback-Loop Schema Migration...');

  try {
    // 1. Create production_records table
    await db.query(`
      CREATE TABLE IF NOT EXISTS production_records (
        record_id SERIAL PRIMARY KEY,
        dish_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
        record_date DATE NOT NULL,
        planned_quantity INT DEFAULT 0,
        pre_order_quantity INT DEFAULT 0,
        on_spot_quantity INT DEFAULT 0,
        total_demand INT DEFAULT 0,
        recommended_quantity INT DEFAULT 0,
        baseline_quantity INT DEFAULT 0,
        prepared_quantity INT DEFAULT 0,
        collected_quantity INT DEFAULT 0,
        leftover_quantity INT DEFAULT 0,
        portion_weight_kg NUMERIC(5,3) DEFAULT 0.400,
        estimated_food_saved_kg NUMERIC(8,3) DEFAULT 0.000,
        actual_waste_kg NUMERIC(8,3) DEFAULT 0.000,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_dish_record_date UNIQUE (dish_id, record_date)
      );
    `);
    console.log('✅ Checked/Created "production_records" table');

    // 2. Ensure portion_weight_kg exists in menu_items
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='portion_weight_kg'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN portion_weight_kg NUMERIC(5,3) DEFAULT 0.400;
        END IF;
      END $$;
    `);
    console.log('✅ Checked "portion_weight_kg" column in "menu_items"');

    // 3. Create indices for fast historical analytics
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_prod_records_date ON production_records(record_date);
      CREATE INDEX IF NOT EXISTS idx_prod_records_dish ON production_records(dish_id);
    `);
    console.log('✅ Checked/Created indices on "production_records"');

    console.log('🎉 Production Records Schema Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Production Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_production.js')) {
  migrateProductionRecords()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
