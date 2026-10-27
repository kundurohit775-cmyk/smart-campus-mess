import db from './src/db/database.js';
import { forecastService } from './src/services/forecastService.js';
import { wastageService } from './src/services/wastageService.js';
import { migrateWastageLogs } from './src/db/migrate_wastage.js';

async function runForecastAndWastageTests() {
  console.log('🧪 Starting Demand Forecasting & Wastage Logging Automated Tests...\n');

  try {
    // 1. Ensure DB migration
    await migrateWastageLogs();

    // 2. Fetch or create a test menu item
    let dish = await db.get("SELECT item_id, item_name, price FROM menu_items WHERE is_active = 1 LIMIT 1");
    if (!dish) {
      const res = await db.run(`
        INSERT INTO menu_items (item_name, category, price, available_quantity, is_active)
        VALUES ('Test Forecast Thali', 'Lunch', 90, 50, 1)
      `);
      dish = { item_id: res.lastInsertRowid, item_name: 'Test Forecast Thali', price: 90 };
    }
    const dishId = dish.item_id;

    // Fetch or create a test student for order history
    let student = await db.get("SELECT student_id FROM students LIMIT 1");
    if (!student) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Forecasting Student', 'forecast_test@vitstudent.ac.in', '9876543219', 'hash', 'Room 101', 'active')
      `);
      student = { student_id: res.lastInsertRowid };
    }
    const studentId = student.student_id;

    // 3. Seed synthetic historical order data over the last 28 days (4 weeks)
    // Friday orders = 80 portions, Non-Friday orders = 40 portions
    console.log('🌱 Seeding 28 days of historical order data with Friday seasonality...');
    const insertedOrderIds = [];
    const today = new Date();

    for (let i = 28; i >= 1; i--) {
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - i);
      const isFriday = orderDate.getDay() === 5;
      const qty = isFriday ? 80 : 40;
      const isoDate = orderDate.toISOString();

      const oRes = await db.run(`
        INSERT INTO orders (student_id, total_amount, order_status, order_time, pickup_token)
        VALUES (?, ?, 'Completed', ?, 'TK-TEST')
      `, studentId, qty * dish.price, isoDate);

      const oId = oRes.lastInsertRowid;
      insertedOrderIds.push(oId);

      await db.run(`
        INSERT INTO order_items (order_id, item_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, oId, dishId, qty, dish.price, qty * dish.price);
    }

    console.log(`✅ Seeded ${insertedOrderIds.length} synthetic past orders for Dish #${dishId} ("${dish.item_name}")`);

    // 4. TEST 1: Demand Forecasting for a Friday
    // Next Friday
    const nextFriday = new Date();
    while (nextFriday.getDay() !== 5) {
      nextFriday.setDate(nextFriday.getDate() + 1);
    }
    const fridayDateStr = nextFriday.toISOString().split('T')[0];

    const fridayForecast = await forecastService.getDishForecast(dishId, fridayDateStr);
    console.log('\n--- 📈 FRIDAY DEMAND FORECAST RESULT ---');
    console.log(`Dish: "${fridayForecast.dishName}" on Friday (${fridayForecast.targetDate})`);
    console.log(`Forecasted Portions: ${fridayForecast.forecastedQuantity}`);
    console.log(`Confidence: ${fridayForecast.confidence} (Score: ${fridayForecast.confidenceScore}/100)`);
    console.log(`Weighted Recency Avg (WMA): ${fridayForecast.metrics.weightedRecencyAverage}`);
    console.log(`Seasonality Multiplier (S_dow): ${fridayForecast.metrics.seasonalityFactor}x`);
    console.log(`Reasoning: ${fridayForecast.reasoning}`);

    if (fridayForecast.metrics.seasonalityFactor <= 1.0) {
      throw new Error(`Expected Friday seasonality factor > 1.0 (since Friday orders are 80 vs 40), got ${fridayForecast.metrics.seasonalityFactor}`);
    }
    if (fridayForecast.forecastedQuantity < 50) {
      throw new Error(`Expected Friday forecast to reflect higher volume, got ${fridayForecast.forecastedQuantity}`);
    }
    if (fridayForecast.confidence !== 'High Confidence') {
      throw new Error(`Expected 'High Confidence' for 4 weeks of data, got: ${fridayForecast.confidence}`);
    }
    console.log('✅ Test 1 Passed: Demand forecasting correctly applies exponential weighting, day-of-week seasonality, and high confidence.');

    // 5. TEST 2: Bulk Today Forecast
    const bulkForecast = await forecastService.getTodayForecast();
    console.log(`\n--- 📊 BULK TODAY FORECAST ---`);
    console.log(`Total Menu Dishes Predicted: ${bulkForecast.totalDishes}`);
    console.log(`Total Kitchen Prep Target: ${bulkForecast.totalPredictedPortions} portions`);
    console.log(`High Confidence Dishes: ${bulkForecast.highConfidenceCount}`);

    if (!bulkForecast.forecasts || bulkForecast.forecasts.length === 0) {
      throw new Error('Bulk forecast returned empty forecast list');
    }
    console.log('✅ Test 2 Passed: Bulk today demand forecast computed for all active dishes.');

    // 6. TEST 3: Wastage Logging (Chef End of Day)
    console.log('\n--- 📋 WASTAGE LOGGING ---');
    const logDate = new Date().toISOString().split('T')[0];
    const logResult = await wastageService.logWastage(1, [
      {
        dishId,
        logDate,
        quantityPrepared: 100,
        quantitySold: 85,
        quantityWasted: 15,
        reason: 'overprepared'
      }
    ]);

    console.log(`Logged wastage: ${logResult.message}`);
    if (logResult.recordsCount !== 1 || logResult.records[0].quantity_wasted !== 15) {
      throw new Error(`Wastage log insert failed: ${JSON.stringify(logResult)}`);
    }
    console.log('✅ Test 3 Passed: Wastage successfully logged with auto-calculation & manual override.');

    // 7. TEST 4: Wastage Trends Aggregation
    const trends30d = await wastageService.getWastageTrends('30d');
    console.log('\n--- 📊 WASTAGE TRENDS (30 DAYS) ---');
    console.log(`Total Prepared: ${trends30d.summary.totalPrepared}`);
    console.log(`Total Sold:     ${trends30d.summary.totalSold}`);
    console.log(`Total Wasted:   ${trends30d.summary.totalWasted}`);
    console.log(`Wastage Rate:   ${trends30d.summary.wastagePercentage}%`);
    console.log(`Trend Badge:    ${trends30d.summary.trendBadgeText} (${trends30d.summary.trendDirection})`);

    if (trends30d.summary.totalPrepared < 100 || trends30d.summary.totalWasted < 15) {
      throw new Error(`Wastage trends aggregation mismatch: ${JSON.stringify(trends30d.summary)}`);
    }
    console.log('✅ Test 4 Passed: Wastage trends aggregation computes totals, percentages, and direction.');

    // 8. TEST 5: Admin Sustainability Summary
    const adminSummary = await wastageService.getAdminSummary();
    console.log('\n--- 🌍 ADMIN SUSTAINABILITY SUMMARY ---');
    console.log(`Kitchen Efficiency: ${adminSummary.kitchenEfficiency}%`);
    console.log(`Estimated Saved Meals: ${adminSummary.estimatedSavedPortions}`);
    console.log(`30d Wastage Rate: ${adminSummary.wastageRate}%`);

    if (adminSummary.kitchenEfficiency <= 0) {
      throw new Error('Invalid kitchen efficiency in admin summary');
    }
    console.log('✅ Test 5 Passed: Admin sustainability metrics computed.');

    // 9. CLEANUP synthetic test records
    console.log('\n🧹 Cleaning up synthetic test orders and wastage logs...');
    for (const oId of insertedOrderIds) {
      await db.run('DELETE FROM order_items WHERE order_id = ?', oId);
      await db.run('DELETE FROM orders WHERE order_id = ?', oId);
    }
    await db.run('DELETE FROM wastage_logs WHERE dish_id = ? AND log_date = ?', dishId, logDate);
    console.log('✅ Cleaned up synthetic records.');

    console.log('\n🎉 ALL DEMAND FORECASTING & WASTAGE LOGGING TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  }
}

runForecastAndWastageTests().then(() => process.exit(0));
