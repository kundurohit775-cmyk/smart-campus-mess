import db from './src/db/database.js';
import { productionService } from './src/services/productionService.js';

async function testCollectedSaveBug() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING SOLD / COLLECTED QUANTITY PERSISTENCE & LEFTOVER FORMULAS');
  console.log('======================================================================\n');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Get sample dish
  let dish = await db.get("SELECT * FROM menu_items WHERE item_name = 'Paneer Butter Masala (Eco-Test)'");
  if (!dish) {
    const insertRes = await db.query(`
      INSERT INTO menu_items (item_name, category, price, available_quantity, is_special, is_active, portion_weight_kg)
      VALUES ('Paneer Butter Masala (Eco-Test)', 'Breakfast', 120, 85, true, 1, 0.400)
      RETURNING *
    `);
    dish = insertRes.rows[0];
  }

  const dishId = dish.item_id;
  const portionWeight = 0.400; // 400g

  // ==========================================
  // CASE 1: Prepared = 88, Collected = 82
  // ==========================================
  console.log('--- TEST CASE 1: Prepared = 88, Sold / Collected = 82 ---');
  const payload1 = [{
    dishId: dishId,
    logDate: todayStr,
    preparedQuantity: 88,
    collectedQuantity: 82,
    quantityPrepared: 88,
    quantitySold: 82,
    baselineQuantity: 100,
    portionWeightKg: portionWeight,
    reason: 'overprepared'
  }];

  console.log('📤 Submitting save payload:', JSON.stringify(payload1[0], null, 2));
  await productionService.logProduction(1, payload1, todayStr);

  // Directly check DB record
  const dbRow1 = await db.get('SELECT * FROM production_records WHERE dish_id = ? AND record_date = ?', dishId, todayStr);
  console.log('\n📦 Database Record in production_records:');
  console.log(`   • prepared_quantity:        ${dbRow1.prepared_quantity}`);
  console.log(`   • collected_quantity:       ${dbRow1.collected_quantity}`);
  console.log(`   • leftover_quantity:        ${dbRow1.leftover_quantity}`);
  console.log(`   • actual_waste_kg:          ${parseFloat(dbRow1.actual_waste_kg).toFixed(3)} kg`);
  console.log(`   • estimated_food_saved_kg:  ${parseFloat(dbRow1.estimated_food_saved_kg).toFixed(3)} kg`);

  // Simulate refresh: call getDailyProductionOverview
  const overview1 = await productionService.getDailyProductionOverview(todayStr);
  const refreshedItem1 = overview1.dishes.find(d => d.dishId === dishId);

  console.log('\n🔄 After Page Refresh (getDailyProductionOverview):');
  console.log(`   • Prepared Quantity:        ${refreshedItem1.preparedQuantity} (Expected: 88)`);
  console.log(`   • Collected Quantity:       ${refreshedItem1.collectedQuantity} (Expected: 82)`);
  console.log(`   • Leftover Waste:           ${refreshedItem1.leftoverQuantity} (Expected: 6)`);
  console.log(`   • Actual Waste kg:          ${refreshedItem1.actualWasteKg.toFixed(3)} kg (Expected: 2.400 kg)`);
  console.log(`   • Food Saved kg:            ${refreshedItem1.estimatedFoodSavedKg.toFixed(3)} kg (Expected: 4.800 kg)`);

  if (refreshedItem1.collectedQuantity !== 82) {
    throw new Error(`FAIL: collectedQuantity is ${refreshedItem1.collectedQuantity}, expected 82!`);
  }
  if (refreshedItem1.leftoverQuantity !== 6) {
    throw new Error(`FAIL: leftoverQuantity is ${refreshedItem1.leftoverQuantity}, expected 6!`);
  }
  if (Math.abs(refreshedItem1.actualWasteKg - 2.400) > 0.001) {
    throw new Error(`FAIL: actualWasteKg is ${refreshedItem1.actualWasteKg}, expected 2.400!`);
  }
  if (Math.abs(refreshedItem1.estimatedFoodSavedKg - 4.800) > 0.001) {
    throw new Error(`FAIL: estimatedFoodSavedKg is ${refreshedItem1.estimatedFoodSavedKg}, expected 4.800!`);
  }
  console.log('✅ Case 1 Passed with 100% precision!\n');

  // ==========================================
  // CASE 2: Prepared = 88, Collected = 88
  // ==========================================
  console.log('--- TEST CASE 2: Prepared = 88, Sold / Collected = 88 ---');
  const payload2 = [{
    dishId: dishId,
    logDate: todayStr,
    preparedQuantity: 88,
    collectedQuantity: 88,
    quantityPrepared: 88,
    quantitySold: 88,
    baselineQuantity: 100,
    portionWeightKg: portionWeight,
    reason: 'exact match'
  }];

  await productionService.logProduction(1, payload2, todayStr);
  const overview2 = await productionService.getDailyProductionOverview(todayStr);
  const refreshedItem2 = overview2.dishes.find(d => d.dishId === dishId);

  console.log(`   • Prepared: ${refreshedItem2.preparedQuantity}, Collected: ${refreshedItem2.collectedQuantity}`);
  console.log(`   • Leftover: ${refreshedItem2.leftoverQuantity} (Expected: 0)`);
  console.log(`   • Actual Waste kg: ${refreshedItem2.actualWasteKg} kg (Expected: 0 kg)`);

  if (refreshedItem2.leftoverQuantity !== 0 || refreshedItem2.actualWasteKg !== 0) {
    throw new Error(`FAIL: Case 2 leftover/waste mismatch!`);
  }
  console.log('✅ Case 2 Passed!\n');

  // ==========================================
  // CASE 3: Prepared = 88, Collected = 90 (Surplus sales)
  // ==========================================
  console.log('--- TEST CASE 3: Prepared = 88, Sold / Collected = 90 (Floor at zero check) ---');
  const payload3 = [{
    dishId: dishId,
    logDate: todayStr,
    preparedQuantity: 88,
    collectedQuantity: 90,
    quantityPrepared: 88,
    quantitySold: 90,
    baselineQuantity: 100,
    portionWeightKg: portionWeight,
    reason: 'extra walk-ins'
  }];

  await productionService.logProduction(1, payload3, todayStr);
  const overview3 = await productionService.getDailyProductionOverview(todayStr);
  const refreshedItem3 = overview3.dishes.find(d => d.dishId === dishId);

  console.log(`   • Prepared: ${refreshedItem3.preparedQuantity}, Collected: ${refreshedItem3.collectedQuantity}`);
  console.log(`   • Leftover: ${refreshedItem3.leftoverQuantity} (Expected: 0)`);
  console.log(`   • Actual Waste kg: ${refreshedItem3.actualWasteKg} kg (Expected: 0 kg)`);

  if (refreshedItem3.leftoverQuantity !== 0 || refreshedItem3.actualWasteKg !== 0) {
    throw new Error(`FAIL: Case 3 negative leftover not floored at zero!`);
  }
  console.log('✅ Case 3 Passed!\n');

  console.log('🎉 ALL COLLECTED QUANTITY & PERSISTENCE TESTS PASSED SUCCESSFULLY! 🚀\n');
}

testCollectedSaveBug().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
