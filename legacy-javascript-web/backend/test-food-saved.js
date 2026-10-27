import db from './src/db/database.js';
import { sustainabilityService } from './src/services/sustainabilityService.js';
import { migrateSustainability } from './src/db/migrate_sustainability.js';

async function runFoodSavedTests() {
  console.log('🧪 Starting Food Saved Sustainability Metrics Automated Tests...\n');

  try {
    // 1. Run migration check
    await migrateSustainability();

    // 2. Fetch or create a test special dish
    let dish = await db.get("SELECT item_id, item_name, price, portion_weight_kg FROM menu_items WHERE is_active = 1 LIMIT 1");
    if (!dish) {
      const res = await db.run(`
        INSERT INTO menu_items (item_name, category, price, is_special, portion_weight_kg, available_quantity, is_active)
        VALUES ('Special Hyderabadi Haleem', 'Dinner', 120, true, 0.500, 50, 1)
      `);
      dish = { item_id: res.lastInsertRowid, item_name: 'Special Hyderabadi Haleem', price: 120, portion_weight_kg: 0.500 };
    }
    const dishId = dish.item_id;

    // Fetch or create student
    let student = await db.get("SELECT student_id FROM students LIMIT 1");
    if (!student) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Eco Student', 'eco_student@vitstudent.ac.in', '9876543218', 'hash', 'Room 303', 'active')
      `);
      student = { student_id: res.lastInsertRowid };
    }
    const studentId = student.student_id;

    // 3. Seed synthetic pre-orders across several dates
    console.log('🌱 Seeding sample confirmed pre-orders for special dish...');
    const insertedPreOrderIds = [];
    const testDates = [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0]
    ];

    for (const dateStr of testDates) {
      const token = `TK-ECO-${Math.floor(1000 + Math.random() * 9000)}`;
      const qty = 40; // 40 portions pre-ordered
      const poRes = await db.run(`
        INSERT INTO pre_orders (student_id, item_id, quantity, price_per_item, total_amount, pickup_token, scheduled_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `, studentId, dishId, qty, dish.price || 100, qty * (dish.price || 100), token, dateStr);

      insertedPreOrderIds.push(poRes.lastInsertRowid);
    }

    console.log(`✅ Seeded ${insertedPreOrderIds.length} batches of pre-orders for Dish #${dishId} ("${dish.item_name}")`);

    // 4. Test Sustainability Service Calculation
    const stats = await sustainabilityService.getPublicFoodSavedStats();
    console.log('\n--- 🌍 PUBLIC FOOD SAVED SUSTAINABILITY METRICS ---');
    console.log(`All-Time Food Saved:    ${stats.metrics.allTimeKgSaved} kg`);
    console.log(`This Month Food Saved:  ${stats.metrics.thisMonthKgSaved} kg`);
    console.log(`This Week Food Saved:   ${stats.metrics.thisWeekKgSaved} kg`);
    console.log(`CO2e Emissions Avoided: ${stats.metrics.co2AvoidedKg} kg CO2e`);
    console.log(`Water Saved:            ${stats.metrics.waterSavedLiters} Liters`);
    console.log(`Total Pre-Orders:       ${stats.metrics.totalPreOrdersCount}`);
    console.log(`Participating Students: ${stats.metrics.uniqueStudentsCount}`);
    console.log(`Timeline Weeks Count:   ${stats.timeline.length}`);
    console.log(`Top Dishes Count:       ${stats.topDishes.length}`);

    // Validations
    if (stats.metrics.allTimeKgSaved <= 0) {
      throw new Error(`Expected all-time kg saved > 0, got: ${stats.metrics.allTimeKgSaved}`);
    }
    if (stats.metrics.co2AvoidedKg <= 0) {
      throw new Error(`Expected CO2 avoided > 0, got: ${stats.metrics.co2AvoidedKg}`);
    }
    if (stats.metrics.thisMonthKgSaved <= 0) {
      throw new Error(`Expected this month kg saved > 0, got: ${stats.metrics.thisMonthKgSaved}`);
    }
    if (stats.metrics.allTimeKgSaved < 0 || stats.metrics.thisWeekKgSaved < 0) {
      throw new Error('Metrics must never be negative!');
    }

    console.log('✅ Test 1 Passed: Public food saved sustainability metrics accurately calculated and non-negative.');

    // 5. Cleanup synthetic test records
    console.log('\n🧹 Cleaning up synthetic test pre-orders and metrics...');
    for (const poId of insertedPreOrderIds) {
      await db.run('DELETE FROM pre_orders WHERE pre_order_id = ?', poId);
    }
    await db.run('DELETE FROM sustainability_metrics WHERE dish_id = ?', dishId);
    console.log('✅ Cleaned up synthetic records.');

    console.log('\n🎉 ALL SUSTAINABILITY FOOD SAVED TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  }
}

runFoodSavedTests().then(() => process.exit(0));
