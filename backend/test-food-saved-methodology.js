import db from './src/db/database.js';
import { migrateProductionRecords } from './src/db/migrate_production.js';
import { productionService } from './src/services/productionService.js';
import { sustainabilityService } from './src/services/sustainabilityService.js';

async function runEndToEndFoodSavedTest() {
  console.log('🌱 ====================================================================');
  console.log('   END-TO-END VERIFICATION: DEMAND-SIGNAL & FEEDBACK-LOOP METHODOLOGY');
  console.log('======================================================================\n');

  try {
    await migrateProductionRecords();

    const testDateStr = new Date().toISOString().split('T')[0];

    // 1. Create or retrieve sample test dish
    let testDish = await db.get("SELECT * FROM menu_items WHERE item_name = 'Paneer Butter Masala (Eco-Test)'");
    if (!testDish) {
      const insertRes = await db.query(`
        INSERT INTO menu_items (
          item_name, category, price, available_quantity, is_special, is_active, portion_weight_kg
        ) VALUES (
          'Paneer Butter Masala (Eco-Test)', 'Special Pre-Order', 120, 85, true, 1, 0.400
        ) RETURNING *
      `);
      testDish = insertRes.rows[0];
      console.log(`✅ Step 1: Created Sample Dish "${testDish.item_name}" (ID: ${testDish.item_id}, Portion: 0.400 kg)`);
    } else {
      console.log(`✅ Step 1: Found Sample Dish "${testDish.item_name}" (ID: ${testDish.item_id}, Portion: 0.400 kg)`);
    }

    const dishId = testDish.item_id;
    const portionWeight = 0.400; // 400 grams

    // 2. Setup Historical Baseline & Recommended Targets
    // Baseline = 100 portions (what kitchen would have cooked without pre-order optimization)
    const baselineQuantity = 100;
    const expectedDemand = 85;
    const safetyMargin = Math.round(expectedDemand * 0.08); // 8% buffer = 7
    const recommendedQuantity = expectedDemand + safetyMargin; // 92 portions

    console.log(`\n📊 Step 2: Planning & Target Metrics:`);
    console.log(`   • Historical Baseline (Without Signals): ${baselineQuantity} portions`);
    console.log(`   • Expected Demand (Forecasted):          ${expectedDemand} portions`);
    console.log(`   • Recommended Prep (Forecast + Buffer):  ${recommendedQuantity} portions (8% buffer = +${safetyMargin})`);

    // 3. Chef Prepares & Finalizes End-of-Day Quantities
    // Chef prepares 88 portions (informed by advance demand signals, avoiding the 100-portion baseline)
    const preparedQuantity = 88;
    const collectedQuantity = 82; // 82 students collected their meals
    const leftoverQuantity = preparedQuantity - collectedQuantity; // 6 portions leftover

    console.log(`\n🍳 Step 3: Chef Actual Production Execution:`);
    console.log(`   • Actually Cooked / Prepared:            ${preparedQuantity} portions`);
    console.log(`   • Student Pickups / Collected:           ${collectedQuantity} portions`);
    console.log(`   • Actual Leftover Waste:                 ${leftoverQuantity} portions (${leftoverQuantity * portionWeight} kg)`);

    // 4. Log production via productionService
    await productionService.logProduction(1, [{
      dishId: dishId,
      baselineQuantity: baselineQuantity,
      recommendedQuantity: recommendedQuantity,
      preparedQuantity: preparedQuantity,
      collectedQuantity: collectedQuantity,
      leftoverQuantity: leftoverQuantity,
      portionWeightKg: portionWeight,
      reason: 'overprepared'
    }], testDateStr);

    // 5. Query and verify calculation in database
    const record = await db.get(`
      SELECT * FROM production_records WHERE dish_id = ? AND record_date = ?
    `, dishId, testDateStr);

    if (!record) {
      throw new Error(`Production record not found for dish #${dishId} on ${testDateStr}`);
    }

    const calculatedSavedKg = parseFloat(record.estimated_food_saved_kg);
    const calculatedWasteKg = parseFloat(record.actual_waste_kg);

    // Expected mathematical formula:
    // estimated_food_saved_kg = MAX(0, baseline_quantity - prepared_quantity) * portion_weight_kg
    const expectedSavedKg = Math.max(0, (baselineQuantity - preparedQuantity)) * portionWeight; // (100 - 88) * 0.400 = 4.800 kg
    const expectedWasteKg = leftoverQuantity * portionWeight; // 6 * 0.400 = 2.400 kg

    console.log(`\n🧮 Step 4: Verification of Formula & Recorded Values:`);
    console.log(`   • Formula: MAX(0, baseline - prepared) * portion_weight`);
    console.log(`   • Computation: (${baselineQuantity} - ${preparedQuantity}) * ${portionWeight} = ${expectedSavedKg.toFixed(3)} kg`);
    console.log(`   • Database estimated_food_saved_kg:       ${calculatedSavedKg.toFixed(3)} kg`);
    console.log(`   • Database actual_waste_kg:               ${calculatedWasteKg.toFixed(3)} kg`);

    if (Math.abs(calculatedSavedKg - expectedSavedKg) > 0.001) {
      throw new Error(`Calculation mismatch! Expected ${expectedSavedKg} kg, got ${calculatedSavedKg} kg.`);
    }
    console.log(`   ✅ Exact Formula Match: Verified ${calculatedSavedKg} kg avoided overproduction!`);

    // 6. Test Public Impact Dashboard API
    const publicStats = await sustainabilityService.getPublicFoodSavedStats();
    console.log(`\n🌍 Step 5: Public Food Saved Portal API Response:`);
    console.log(`   • All-Time Food Saved:                    ${publicStats.metrics.allTimeKgSaved} kg`);
    console.log(`   • CO2e Avoided:                           ${publicStats.metrics.co2AvoidedKg} kg CO2e`);
    console.log(`   • Water Conserved:                        ${publicStats.metrics.waterSavedLiters} Liters`);
    console.log(`   • Equivalent Meals Saved:                 ${publicStats.metrics.mealsEquivalent} Meals`);
    console.log(`   • Auditable Methodology:                  "${publicStats.methodology.formula}"`);

    console.log('\n🎉 ALL DEMAND-SIGNAL & FOOD-SAVED FEEDBACK LOOP TESTS PASSED! 🚀\n');
  } catch (err) {
    console.error('\n❌ Food Saved Test Failure:', err);
    process.exit(1);
  }
}

runEndToEndFoodSavedTest().then(() => process.exit(0));
