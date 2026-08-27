import db from './database.js';
import { imageService } from '../services/imageService.js';

export async function migrateFallbackImages() {
  console.log('🔄 Running Fallback Images database migration...');

  try {
    // 1. Add fallback_image_url column to menu_items if not exists
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='menu_items' AND column_name='fallback_image_url'
        ) THEN
          ALTER TABLE menu_items ADD COLUMN fallback_image_url TEXT DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added "fallback_image_url" column to menu_items');

    // 2. Backfill existing items where image_url is missing or empty
    const itemsRes = await db.query(`
      SELECT item_id, item_name, category, image_url, fallback_image_url 
      FROM menu_items 
      WHERE image_url IS NULL OR image_url = '' OR fallback_image_url IS NULL
    `);

    console.log(`🔍 Checking ${itemsRes.rows.length} dishes for image backfill...`);

    let backfilledCount = 0;
    for (const item of itemsRes.rows) {
      if (!item.fallback_image_url) {
        const autoImg = imageService.resolveDishImage(item.item_name, item.category);
        await db.run(
          'UPDATE menu_items SET fallback_image_url = ? WHERE item_id = ?',
          autoImg,
          item.item_id
        );
        backfilledCount++;
      }
    }

    console.log(`✅ Backfilled ${backfilledCount} dishes with auto-resolved food photos.`);
    console.log('🎉 Fallback Images Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_fallback_images.js')) {
  migrateFallbackImages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
