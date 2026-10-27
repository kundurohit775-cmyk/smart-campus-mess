import db from './database.js';

export async function migrateHealthModeV2() {
  console.log('🔄 Running Health Mode V2 (Diet-Friendly & Overrides) database migration...');

  try {
    // 1. Add healthy_override to menu_items table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='healthy_override'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN healthy_override BOOLEAN DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "healthy_override" column to menu_items');

    // 2. Add health_mode_enabled to students table
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='students' AND column_name='health_mode_enabled'
        ) THEN
          ALTER TABLE students ADD COLUMN health_mode_enabled BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "health_mode_enabled" column to students');

    console.log('🎉 Health Mode V2 Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_health_mode_v2.js')) {
  migrateHealthModeV2()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
