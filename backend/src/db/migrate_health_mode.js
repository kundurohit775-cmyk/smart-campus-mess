import db from './database.js';

export async function migrateHealthMode() {
  console.log('🔄 Running Health Mode database migration...');

  try {
    // 1. Add calories to menu_items table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='calories'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN calories INT DEFAULT 250;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "calories" column to menu_items');

    // 2. Add daily_calorie_goal to students table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='students' AND column_name='daily_calorie_goal'
        ) THEN
          ALTER TABLE students ADD COLUMN daily_calorie_goal INT DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "daily_calorie_goal" column to students');

    // 3. Add total_calories to orders table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='total_calories'
        ) THEN
          ALTER TABLE orders ADD COLUMN total_calories INT DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "total_calories" column to orders');

    // 4. Add calories to order_items table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='order_items' AND column_name='calories'
        ) THEN
          ALTER TABLE order_items ADD COLUMN calories INT DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "calories" column to order_items');

    // 5. Create student_daily_intake table
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_daily_intake (
        intake_id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        calories INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
      CREATE INDEX IF NOT EXISTS idx_daily_intake_student_date ON student_daily_intake(student_id, date);
    `);
    console.log('✅ Created student_daily_intake table & index');

    // 6. Update realistic calories for dishes
    const caloriePresets = [
      { name: '%Dosa%', cal: 320 },
      { name: '%Idli%', cal: 180 },
      { name: '%Biryani%', cal: 480 },
      { name: '%Paneer%', cal: 420 },
      { name: '%Dal%', cal: 310 },
      { name: '%Chole%', cal: 520 },
      { name: '%Samosa%', cal: 210 },
      { name: '%Coffee%', cal: 160 },
      { name: '%Tea%' , cal: 90 },
      { name: '%Chai%', cal: 90 },
      { name: '%Rice%', cal: 380 },
      { name: '%Noodle%', cal: 410 },
      { name: '%Paratha%', cal: 340 },
      { name: '%Sandwich%', cal: 290 },
      { name: '%Burger%', cal: 450 },
      { name: '%Shake%', cal: 260 },
      { name: '%Juice%', cal: 140 },
      { name: '%Salad%', cal: 120 },
      { name: '%Fruit%', cal: 110 }
    ];

    for (const preset of caloriePresets) {
      await db.query(`
        UPDATE menu_items 
        SET calories = $1 
        WHERE item_name ILIKE $2 AND (calories IS NULL OR calories = 0 OR calories = 250)
      `, [preset.cal, preset.name]);
    }

    // Default any remaining dishes to 300 kcal if 0 or null
    await db.query(`
      UPDATE menu_items 
      SET calories = 300 
      WHERE calories IS NULL OR calories <= 0
    `);

    console.log('✅ Seeded realistic calorie counts on menu items');
    console.log('🎉 Health Mode Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_health_mode.js')) {
  migrateHealthMode()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
