import db from './database.js';

export async function migratePreOrders() {
  console.log('🔄 Running Pre-Order System database migration...');

  try {
    // 1. Add is_special, special_stock_limit, special_available_date to menu_items
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='is_special'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN is_special BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='special_stock_limit'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN special_stock_limit INT DEFAULT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='special_available_date'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN special_available_date DATE DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Added special item columns to menu_items');

    // 2. Create pre_orders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS pre_orders (
        pre_order_id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        item_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        price_per_item INT NOT NULL,
        total_amount INT NOT NULL,
        pickup_token VARCHAR(50) NOT NULL,
        scheduled_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pre_orders_student ON pre_orders(student_id);
      CREATE INDEX IF NOT EXISTS idx_pre_orders_item_date ON pre_orders(item_id, scheduled_date);
    `);
    console.log('✅ Created pre_orders table and indices');

    // 3. Seed a sample special item for tomorrow if none exists
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const existingSpecial = await db.get("SELECT item_id FROM menu_items WHERE is_special = TRUE AND special_available_date = $1", tomorrowStr);
    if (!existingSpecial) {
      await db.run(`
        INSERT INTO menu_items (
          item_name, category, price, calories, description, 
          image_url, available_quantity, is_active, is_special, 
          special_stock_limit, special_available_date
        ) VALUES (
          'Hyderabadi Dum Biryani Feast (Chef Special)', 
          'Lunch', 
          160, 
          580, 
          'Authentic slow-cooked saffron basmati rice with spices, mirchi ka salan & burani raita. Limited next-day kitchen batch.',
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
          15, 
          1, 
          TRUE, 
          15, 
          $1
        )
      `, tomorrowStr);
      console.log(`✅ Seeded sample special item for tomorrow (${tomorrowStr}) with 15 units limit`);
    }

    console.log('🎉 Pre-Order System Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_preorders.js')) {
  migratePreOrders()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
