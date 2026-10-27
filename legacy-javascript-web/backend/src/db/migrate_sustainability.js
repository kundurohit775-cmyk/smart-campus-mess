import db from './database.js';

export async function migrateSustainability() {
  console.log('🔄 Running Sustainability & Food Saved Metrics database migration...');

  try {
    // 1. Add portion_weight_kg to menu_items if not exists
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='portion_weight_kg'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN portion_weight_kg NUMERIC(6,3) DEFAULT 0.450;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "portion_weight_kg" column in "menu_items"');

    // 2. Create sustainability_metrics table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sustainability_metrics (
        metric_id SERIAL PRIMARY KEY,
        dish_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
        batch_date DATE NOT NULL,
        quantity_preordered INT NOT NULL DEFAULT 0,
        portion_weight_kg NUMERIC(6,3) NOT NULL DEFAULT 0.450,
        estimated_qty_without_preorder INT NOT NULL DEFAULT 0,
        kg_saved NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        co2_avoided_kg NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_dish_batch_date UNIQUE (dish_id, batch_date)
      );
    `);
    console.log('✅ Checked/Created "sustainability_metrics" table');

    // 3. Create indices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_sustainability_batch_date ON sustainability_metrics(batch_date);
      CREATE INDEX IF NOT EXISTS idx_sustainability_dish_id ON sustainability_metrics(dish_id);
    `);
    console.log('✅ Checked/Created indices for "sustainability_metrics"');

    console.log('🎉 Sustainability Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Sustainability Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_sustainability.js')) {
  migrateSustainability()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
