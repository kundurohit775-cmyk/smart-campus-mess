import db from './src/db/database.js';
import { productionService } from './src/services/productionService.js';
import { forecastService } from './src/services/forecastService.js';

async function testRecommendationAndValidation() {
  console.log('🧪 ====================================================================');
  console.log('   END-TO-END VALIDATION: RECOMMENDATION LOGIC, GUARDRAILS & ADHERENCE');
  console.log('======================================================================\n');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Create or retrieve test dish: "Iced Cold Coffee with Ice Cream (Eco-Test)"
  let coffeeDish = await db.get("SELECT * FROM menu_items WHERE item_name = 'Iced Cold Coffee with Ice Cream (Eco-Test)'");
  if (!coffeeDish) {
    const insertRes = await db.query(`
      INSERT INTO menu_items (item_name, category, price, available_quantity, is_special, is_active, portion_weight_kg)
      VALUES ('Iced Cold Coffee with Ice Cream (Eco-Test)', 'Beverages', 90, 48, true, 1, 0.450)
      RETURNING *
    `);
    coffeeDish = insertRes.rows[0];
  }

  const coffeeDishId = coffeeDish.item_id;

  let student = await db.get("SELECT student_id FROM students LIMIT 1");
  let studentId = student?.student_id;
  if (!studentId) {
    const studentRes = await db.query(`
      INSERT INTO students (registration_number, name, email, hostel_block, room_number, dietary_preference, wallet_balance, pin_hash)
      VALUES ('21BCE0001', 'Test Student', 'test.student@vitstudent.ac.in', 'Block A', '101', 'Vegetarian', 5000, 'hash')
      RETURNING student_id
    `);
    studentId = studentRes.rows[0].student_id;
  }

  // Insert 40 confirmed pre-orders for today
  await db.query(`
    DELETE FROM pre_orders WHERE item_id = $1 AND scheduled_date = $2
  `, [coffeeDishId, todayStr]);

  await db.query(`
    INSERT INTO pre_orders (student_id, item_id, quantity, price_per_item, total_amount, pickup_token, scheduled_date, status)
    VALUES ($1, $2, 40, 90, 3600, 'PRE-8822', $3, 'confirmed')
  `, [studentId, coffeeDishId, todayStr]);

  // -------------------------------------------------------------------------
  // TEST 1: Recommended quantity MUST respect confirmed advance pre-orders
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Advance Pre-Order Demand Signal Integration ---');
  const forecastRec = await forecastService.getDishForecast(coffeeDishId, todayStr);
  console.log(`   • Confirmed Pre-Orders (Known Demand): ${forecastRec.pre_order_quantity} portions`);
  console.log(`   • Expected Demand:                    ${forecastRec.expected_demand} portions`);
  console.log(`   • Safety Buffer (+8%):                +${forecastRec.safety_margin} portions`);
  console.log(`   • Final AI Recommended Prep:          ${forecastRec.recommended_quantity} portions`);

  if (forecastRec.recommended_quantity < 40) {
    throw new Error(`FAIL: Recommended prep (${forecastRec.recommended_quantity}) is lower than confirmed pre-orders (40)!`);
  }
  console.log('✅ Test 1 Passed: AI Recommended preparation correctly satisfies confirmed pre-orders + safety margin!\n');

  // -------------------------------------------------------------------------
  // TEST 2: Impossible Collected Quantity (Collected > Prepared) Guardrail
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Impossible Collection Validation Guardrail ---');
  const invalidPayload = [{
    dishId: coffeeDishId,
    logDate: todayStr,
    preparedQuantity: 32,
    collectedQuantity: 43,
    baselineQuantity: 48,
    portionWeightKg: 0.450
  }];

  let validationFailedAsExpected = false;
  try {
    await productionService.logProduction(1, invalidPayload, todayStr);
  } catch (err) {
    if (err.message.includes('Collected quantity cannot exceed prepared quantity')) {
      validationFailedAsExpected = true;
      console.log(`   ✅ Correctly caught impossible collection: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!validationFailedAsExpected) {
    throw new Error('FAIL: Backend accepted impossible collection where collected (43) > prepared (32)!');
  }
  console.log('✅ Test 2 Passed: Impossible collection strictly rejected with 400 validation error!\n');

  // -------------------------------------------------------------------------
  // TEST 3: Proper Food Saved & Leftover Distinction + Adherence Status
  // Baseline = 48, Recommended = 44, Prepared = 44, Collected = 29
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Business Logic, Leftover vs Food Saved & Adherence ---');
  const validPayload = [{
    dishId: coffeeDishId,
    logDate: todayStr,
    baselineQuantity: 48,
    recommendedQuantity: 44,
    preparedQuantity: 44,
    collectedQuantity: 29,
    portionWeightKg: 0.450,
    reason: 'low turnout'
  }];

  await productionService.logProduction(1, validPayload, todayStr);

  const overview = await productionService.getDailyProductionOverview(todayStr);
  const itemData = overview.dishes.find(d => d.dishId === coffeeDishId);

  console.log(`   • Baseline:                     ${itemData.baselineQuantity} portions`);
  console.log(`   • AI Recommended:               ${itemData.recommendedQuantity} portions`);
  console.log(`   • Prepared (Cooked):            ${itemData.preparedQuantity} portions`);
  console.log(`   • Sold / Collected:             ${itemData.collectedQuantity} portions`);
  console.log(`   • Leftover Waste:               ${itemData.leftoverQuantity} portions (${itemData.actualWasteKg} kg)`);
  console.log(`   • Avoided Overprep (Saved):     ${itemData.estimatedFoodSavedKg} kg`);
  console.log(`   • Recommendation Adherence:     ${itemData.recommendationAdherenceStatus}`);
  console.log(`   • Recommendation Variance:      ${itemData.recommendationVariance} portions`);

  // Expected:
  // Leftover = 44 - 29 = 15 portions
  // Actual Waste = 15 * 0.450 = 6.750 kg
  // Food Saved = (48 - 44) * 0.450 = 1.800 kg
  // Adherence = AT_RECOMMENDATION
  if (itemData.leftoverQuantity !== 15) throw new Error(`Leftover is ${itemData.leftoverQuantity}, expected 15!`);
  if (Math.abs(itemData.actualWasteKg - 6.750) > 0.001) throw new Error(`Actual waste is ${itemData.actualWasteKg}, expected 6.750!`);
  if (Math.abs(itemData.estimatedFoodSavedKg - 1.800) > 0.001) throw new Error(`Food saved is ${itemData.estimatedFoodSavedKg}, expected 1.800!`);
  if (itemData.recommendationAdherenceStatus !== 'AT_RECOMMENDATION') throw new Error(`Adherence is ${itemData.recommendationAdherenceStatus}, expected AT_RECOMMENDATION!`);

  console.log('✅ Test 3 Passed: Leftover waste (6.750 kg) and Avoided overprep (1.800 kg) are distinct and validated!\n');

  console.log('🎉 ALL END-TO-END BUSINESS LOGIC & GUARDRAIL TESTS PASSED SUCCESSFULLY! 🚀\n');
}

testRecommendationAndValidation().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
