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
        forecast_demand INT DEFAULT 0,
        safety_margin INT DEFAULT 0,
        recommended_quantity INT DEFAULT 0,
        baseline_quantity INT DEFAULT 0,
        prepared_quantity INT DEFAULT 0,
        collected_quantity INT DEFAULT 0,
        leftover_quantity INT DEFAULT 0,
        recommendation_variance_quantity INT DEFAULT 0,
        recommendation_adherence_status VARCHAR(50) DEFAULT 'AT_RECOMMENDATION',
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

    // 2. Ensure new adherence & demand columns exist if table was already created
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_records' AND column_name='forecast_demand') THEN
          ALTER TABLE production_records ADD COLUMN forecast_demand INT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_records' AND column_name='safety_margin') THEN
          ALTER TABLE production_records ADD COLUMN safety_margin INT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_records' AND column_name='recommendation_variance_quantity') THEN
          ALTER TABLE production_records ADD COLUMN recommendation_variance_quantity INT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_records' AND column_name='recommendation_adherence_status') THEN
          ALTER TABLE production_records ADD COLUMN recommendation_adherence_status VARCHAR(50) DEFAULT 'AT_RECOMMENDATION';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='portion_weight_kg') THEN
          ALTER TABLE menu_items ADD COLUMN portion_weight_kg NUMERIC(5,3) DEFAULT 0.400;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added adherence & variance columns to "production_records"');

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
