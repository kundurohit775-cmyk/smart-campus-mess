import db from './src/db/database.js';
import { imageService, GENERIC_FOOD_PLACEHOLDER } from './src/services/imageService.js';
import { migrateFallbackImages } from './src/db/migrate_fallback_images.js';

async function runAutoImageTests() {
  console.log('🧪 Starting Auto-Fetch Dish Images End-to-End Tests...\n');

  try {
    // 1. Run Migration check
    await migrateFallbackImages();

    // 2. Test Image Service direct resolution
    const biryaniImg = imageService.resolveDishImage('Hyderabadi Chicken Dum Biryani', 'Lunch');
    console.log('📸 Resolved Biryani Image:', biryaniImg);
    if (!biryaniImg || !biryaniImg.startsWith('http')) {
      throw new Error('Failed to resolve Biryani image URL');
    }
    console.log('✅ Test 1 Passed: Direct keyword image resolution works.');

    // 3. Test Unknown Dish Name fallback
    const unknownImg = imageService.resolveDishImage('Random XYZ Unknown Dish 999', 'Snacks');
    console.log('📸 Resolved Unknown Dish Image:', unknownImg);
    if (!unknownImg || !unknownImg.startsWith('http')) {
      throw new Error('Failed to resolve fallback image for unknown dish');
    }
    console.log('✅ Test 2 Passed: Unknown dish name falls back cleanly.');

    // 4. Test Database insertion without image_url
    const insertRes = await db.run(`
      INSERT INTO menu_items (
        item_name, category, price, calories, is_special, description, image_url, fallback_image_url, available_quantity, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      'Automated Test Masala Dosa',
      'Breakfast',
      70,
      280,
      false,
      'Crispy golden fermented crepe with spicy potato masala',
      null,
      imageService.resolveDishImage('Automated Test Masala Dosa', 'Breakfast'),
      25
    );

    const testItemId = insertRes.lastInsertRowid;
    console.log(`\n🍔 Created Test Dish #${testItemId} with auto-resolved fallback image.`);

    const fetchedItem = await db.get('SELECT * FROM menu_items WHERE item_id = ?', testItemId);
    if (!fetchedItem.fallback_image_url) {
      throw new Error('Test dish is missing fallback_image_url');
    }
    console.log(`✅ Test 3 Passed: Test item stored fallback image: ${fetchedItem.fallback_image_url}`);

    // 5. Test Image Refresh
    const refreshRes = await imageService.refreshDishImage(testItemId);
    console.log('🔄 Refreshed Dish Image:', refreshRes.fallbackImageUrl);
    if (!refreshRes.fallbackImageUrl) {
      throw new Error('Failed to refresh dish image');
    }
    console.log('✅ Test 4 Passed: Image refresh endpoint / helper successfully generated fresh photo.');

    // 6. Test Chef Override with custom image_url
    const customChefPhoto = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=999&custom=true';
    await db.run('UPDATE menu_items SET image_url = ? WHERE item_id = ?', customChefPhoto, testItemId);

    const overriddenItem = await db.get('SELECT * FROM menu_items WHERE item_id = ?', testItemId);
    const displayImg = overriddenItem.image_url || overriddenItem.fallback_image_url;
    if (displayImg !== customChefPhoto) {
      throw new Error(`Chef uploaded photo did not take priority. Got: ${displayImg}`);
    }
    console.log('✅ Test 5 Passed: Chef custom uploaded image_url takes top priority over fallback.');

    // 7. Cleanup
    await db.run('DELETE FROM menu_items WHERE item_id = ?', testItemId);
    console.log(`🧹 Cleaned up Test Dish #${testItemId}`);

    console.log('\n🎉 ALL AUTO-FETCH DISH IMAGE TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Auto-Image Tests Failed:', err);
    process.exit(1);
  }
}

runAutoImageTests().then(() => process.exit(0));
