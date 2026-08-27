import db from './src/db/database.js';
import { computeIsHealthy, HEALTHY_CALORIE_THRESHOLD } from './src/routes/menu.js';
import { orderService } from './src/services/orderService.js';
import { creditService } from './src/services/creditService.js';

async function runDietFriendlyTests() {
  console.log('🧪 Starting Diet-Friendly Health Mode Automated Tests...\n');

  try {
    // 1. Test unit logic for computeIsHealthy
    console.log('1️⃣ Testing computeIsHealthy logic:');
    
    const itemUnder400 = { calories: 350, healthy_override: null };
    const itemOver400 = { calories: 450, healthy_override: null };
    const itemExactly400 = { calories: 400, healthy_override: null };
    const itemNullCal = { calories: null, healthy_override: null };
    const itemForceHealthy = { calories: 650, healthy_override: true };
    const itemForceUnhealthy = { calories: 200, healthy_override: false };
    const itemNullCalForceHealthy = { calories: null, healthy_override: true };

    if (!computeIsHealthy(itemUnder400)) throw new Error('itemUnder400 should be healthy');
    if (computeIsHealthy(itemOver400)) throw new Error('itemOver400 should NOT be healthy');
    if (!computeIsHealthy(itemExactly400)) throw new Error('itemExactly400 should be healthy');
    if (computeIsHealthy(itemNullCal)) throw new Error('itemNullCal should NOT be healthy');
    if (!computeIsHealthy(itemForceHealthy)) throw new Error('itemForceHealthy should be healthy');
    if (computeIsHealthy(itemForceUnhealthy)) throw new Error('itemForceUnhealthy should NOT be healthy');
    if (!computeIsHealthy(itemNullCalForceHealthy)) throw new Error('itemNullCalForceHealthy should be healthy');

    console.log('  ✅ computeIsHealthy passed all 7 rule cases.');

    // 2. Test database items computation
    console.log('\n2️⃣ Testing database menu query is_healthy computation:');
    const menuResult = await db.query('SELECT item_id, item_name, calories, healthy_override FROM menu_items WHERE is_active = 1 LIMIT 5');
    for (const item of menuResult.rows) {
      const isHealthy = computeIsHealthy(item);
      console.log(`  - [${isHealthy ? '🥗 Diet-Friendly' : '🍔 Standard'}] "${item.item_name}": ${item.calories ?? 'null'} kcal, override: ${item.healthy_override}`);
    }
    console.log('  ✅ Database query returned items successfully.');

    // 3. Test mixed order with null-calorie item
    console.log('\n3️⃣ Testing order with mixed calorie and null-calorie items:');
    
    // Create temporary null-calorie dish
    const nullCalDishRes = await db.run(`
      INSERT INTO menu_items (item_name, category, price, calories, healthy_override, description, image_url, available_quantity, is_active)
      VALUES ('Test Special Chai (No Calorie Data)', 'Beverages', 40, NULL, NULL, 'Special tea', 'https://example.com/tea.jpg', 50, 1)
    `);
    const nullCalDishId = nullCalDishRes.lastInsertRowid;

    // Create temporary calibrated dish
    const calDishRes = await db.run(`
      INSERT INTO menu_items (item_name, category, price, calories, healthy_override, description, image_url, available_quantity, is_active)
      VALUES ('Test Fresh Sprout Salad (Healthy)', 'Snacks', 60, 150, NULL, 'Sprouts', 'https://example.com/sprout.jpg', 50, 1)
    `);
    const calDishId = calDishRes.lastInsertRowid;

    // Test student
    let student = await db.get("SELECT student_id, name, email FROM students WHERE email = 'test_health_student@vitstudent.ac.in'");
    const studentId = student.student_id;

    await creditService.getOrCreateMonthlyCredits(studentId);
    await db.run("UPDATE credits SET remaining_credits = 9000 WHERE student_id = ?", studentId);

    const orderRes = await orderService.placeOrder(studentId, [
      { itemId: nullCalDishId, quantity: 2 }, // 2x Chai (0 added to intake)
      { itemId: calDishId, quantity: 1 }     // 1x Salad (150 kcal added to intake)
    ]);

    console.log(`  📦 Placed mixed order #${orderRes.orderId} (totalCalories: ${orderRes.totalCalories} kcal)`);
    if (orderRes.totalCalories !== 150) {
      throw new Error(`Expected order calories to be 150 (ignoring null), got ${orderRes.totalCalories}`);
    }
    console.log('  ✅ Null-calorie item handled smoothly without throwing errors.');

    // Clean up test items
    await orderService.cancelOrder(orderRes.orderId, studentId);
    await db.run('DELETE FROM order_items WHERE order_id = ?', orderRes.orderId);
    await db.run('DELETE FROM transactions WHERE order_id = ?', orderRes.orderId);
    await db.run('DELETE FROM orders WHERE order_id = ?', orderRes.orderId);
    await db.run('DELETE FROM menu_items WHERE item_id IN (?, ?)', nullCalDishId, calDishId);

    console.log('\n🎉 ALL DIET-FRIENDLY & HEALTH MODE TESTS PASSED! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runDietFriendlyTests();
