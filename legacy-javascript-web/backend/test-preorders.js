import db from './src/db/database.js';
import { preOrderService } from './src/services/preOrderService.js';
import { creditService } from './src/services/creditService.js';

async function runPreOrderTests() {
  console.log('🧪 Starting Next-Day Pre-Order End-to-End Tests...\n');

  try {
    const tomorrowStr = preOrderService.getTomorrowDate();
    console.log(`📅 Target Scheduled Date (Tomorrow): ${tomorrowStr}`);

    // 1. Setup test students
    let studentA = await db.get("SELECT student_id, name, email FROM students WHERE email = 'preorder_student_a@vitstudent.ac.in'");
    if (!studentA) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Student A', 'preorder_student_a@vitstudent.ac.in', '9876543211', 'hash123', 'Block B - 201', 'active')
      `);
      studentA = await db.get("SELECT student_id, name, email FROM students WHERE student_id = ?", res.lastInsertRowid);
    }

    let studentB = await db.get("SELECT student_id, name, email FROM students WHERE email = 'preorder_student_b@vitstudent.ac.in'");
    if (!studentB) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Student B', 'preorder_student_b@vitstudent.ac.in', '9876543212', 'hash123', 'Block B - 202', 'active')
      `);
      studentB = await db.get("SELECT student_id, name, email FROM students WHERE student_id = ?", res.lastInsertRowid);
    }

    await creditService.getOrCreateMonthlyCredits(studentA.student_id);
    await db.run("UPDATE credits SET remaining_credits = 9000, used_credits = 0 WHERE student_id = ?", studentA.student_id);

    await creditService.getOrCreateMonthlyCredits(studentB.student_id);
    await db.run("UPDATE credits SET remaining_credits = 9000, used_credits = 0 WHERE student_id = ?", studentB.student_id);

    // 2. Create a dedicated test special dish with stock limit 10
    const testLimit = 10;
    const specialDishRes = await db.run(`
      INSERT INTO menu_items (
        item_name, category, price, calories, is_special, 
        special_stock_limit, special_available_date, description, 
        image_url, available_quantity, is_active
      ) VALUES (
        'Test Smoked Gourmet Burger (Tomorrow Special)', 'Snacks', 150, 480, TRUE, 
        ?, ?, 'Limited batch gourmet burger', 
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', 10, 1
      )
    `, testLimit, tomorrowStr);
    const testItemId = specialDishRes.lastInsertRowid;
    console.log(`🍔 Created Special Item #${testItemId} with Stock Limit: ${testLimit} for ${tomorrowStr}`);

    // 3. Verify initial stock
    const initialRemaining = await preOrderService.getRemainingStock(testItemId, tomorrowStr);
    if (initialRemaining !== testLimit) {
      throw new Error(`Initial remaining mismatch. Expected ${testLimit}, got ${initialRemaining}`);
    }
    console.log(`✅ Test 1 Passed: Initial remaining stock is ${initialRemaining} units.`);

    // 4. Student A places pre-order for 4 units
    const orderA = await preOrderService.placePreOrder(studentA.student_id, testItemId, 4);
    console.log(`📦 Student A reserved 4 units (Order #${orderA.pre_order_id}, Token: ${orderA.pickup_token})`);

    const remainingAfterA = await preOrderService.getRemainingStock(testItemId, tomorrowStr);
    if (remainingAfterA !== 6) {
      throw new Error(`Expected 6 remaining, got ${remainingAfterA}`);
    }
    console.log(`✅ Test 2 Passed: Remaining stock correctly decremented to 6 units.`);

    // 5. Student B tries to pre-order 7 units (should fail, only 6 left)
    let rejectedOversell = false;
    try {
      await preOrderService.placePreOrder(studentB.student_id, testItemId, 7);
    } catch (err) {
      rejectedOversell = true;
      console.log(`🛡️ Correctly rejected oversell request: "${err.message}"`);
    }
    if (!rejectedOversell) {
      throw new Error('Oversell request for 7 units was NOT rejected!');
    }
    console.log(`✅ Test 3 Passed: Oversell prevention protected stock limit.`);

    // 6. Student B places pre-order for exactly remaining 6 units (hits 0)
    const orderB = await preOrderService.placePreOrder(studentB.student_id, testItemId, 6);
    console.log(`📦 Student B reserved remaining 6 units (Order #${orderB.pre_order_id}, Token: ${orderB.pickup_token})`);

    const remainingAfterB = await preOrderService.getRemainingStock(testItemId, tomorrowStr);
    if (remainingAfterB !== 0) {
      throw new Error(`Expected 0 remaining, got ${remainingAfterB}`);
    }
    console.log(`✅ Test 4 Passed: Item is now sold out (0 remaining).`);

    // 7. Third attempt when sold out must fail
    let rejectedSoldOut = false;
    try {
      await preOrderService.placePreOrder(studentA.student_id, testItemId, 1);
    } catch (err) {
      rejectedSoldOut = true;
      console.log(`🛡️ Correctly rejected sold-out request: "${err.message}"`);
    }
    if (!rejectedSoldOut) {
      throw new Error('Sold-out item accepted new order!');
    }
    console.log(`✅ Test 5 Passed: Sold-out item cleanly rejected booking.`);

    // 8. Student A cancels orderA -> stock should restore to 4 units
    const cancelRes = await preOrderService.cancelPreOrder(orderA.pre_order_id, studentA.student_id);
    console.log(`❌ Cancelled Order #${orderA.pre_order_id}: ${cancelRes.message}`);

    const remainingAfterCancel = await preOrderService.getRemainingStock(testItemId, tomorrowStr);
    if (remainingAfterCancel !== 4) {
      throw new Error(`Expected 4 remaining after cancellation, got ${remainingAfterCancel}`);
    }
    console.log(`✅ Test 6 Passed: Stock immediately restored to ${remainingAfterCancel} units after cancellation.`);

    // 9. Chef fulfills orderB
    const fulfillRes = await preOrderService.fulfillPreOrder(orderB.pre_order_id);
    if (fulfillRes.status !== 'fulfilled') {
      throw new Error(`Expected status 'fulfilled', got ${fulfillRes.status}`);
    }
    console.log(`✅ Test 7 Passed: Pre-order #${orderB.pre_order_id} fulfilled successfully.`);

    // Clean up test data
    await db.run('DELETE FROM pre_orders WHERE pre_order_id IN (?, ?)', orderA.pre_order_id, orderB.pre_order_id);
    await db.run('DELETE FROM menu_items WHERE item_id = ?', testItemId);
    console.log('🧹 Cleaned up test records.');

    console.log('\n🎉 ALL NEXT-DAY PRE-ORDER TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPreOrderTests();
