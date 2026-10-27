import db from './src/db/database.js';
import { orderService } from './src/services/orderService.js';
import { creditService } from './src/services/creditService.js';

async function runHealthModeTests() {
  console.log('🧪 Starting Health Mode & Calorie Tracking End-to-End Tests...');

  try {
    // 1. Ensure test student exists
    let student = await db.get("SELECT student_id, name, email, daily_calorie_goal FROM students WHERE email = 'test_health_student@vitstudent.ac.in'");
    if (!student) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, daily_calorie_goal, status)
        VALUES ('Health Test Student', 'test_health_student@vitstudent.ac.in', '9876543210', 'hash123', 'Block A - 101', 2000, 'active')
      `);
      student = await db.get("SELECT student_id, name, email, daily_calorie_goal FROM students WHERE student_id = ?", res.lastInsertRowid);
    }

    const studentId = student.student_id;
    console.log(`👤 Using Test Student ID #${studentId} (${student.email})`);

    // 2. Set student daily calorie goal
    const testGoal = 1800;
    await db.run("UPDATE students SET daily_calorie_goal = ? WHERE student_id = ?", testGoal, studentId);
    const updatedStudent = await db.get("SELECT daily_calorie_goal FROM students WHERE student_id = ?", studentId);
    if (updatedStudent.daily_calorie_goal !== testGoal) {
      throw new Error(`Failed to set daily calorie goal. Expected ${testGoal}, got ${updatedStudent.daily_calorie_goal}`);
    }
    console.log(`✅ Test 1 Passed: Set daily calorie goal to ${testGoal} kcal.`);

    // 3. Ensure test student has adequate credits for testing
    await creditService.getOrCreateMonthlyCredits(studentId);
    await db.run("UPDATE credits SET remaining_credits = 9000, used_credits = 0 WHERE student_id = ?", studentId);

    // 4. Fetch menu items with calories
    const menuItems = await db.all("SELECT item_id, item_name, price, calories, available_quantity FROM menu_items WHERE is_active = 1 AND available_quantity > 5 LIMIT 2");
    if (menuItems.length < 2) {
      throw new Error("Need at least 2 active menu items with stock for testing.");
    }

    const item1 = menuItems[0];
    const item2 = menuItems[1];
    console.log(`🍽️ Selected test dishes: "${item1.item_name}" (${item1.calories} kcal) and "${item2.item_name}" (${item2.calories} kcal)`);

    // Record initial consumed calories today
    const initialIntakeRow = await db.get("SELECT calories FROM student_daily_intake WHERE student_id = ? AND date = CURRENT_DATE", studentId);
    const initialConsumed = initialIntakeRow ? parseInt(initialIntakeRow.calories, 10) : 0;
    console.log(`📊 Initial intake today: ${initialConsumed} kcal`);

    // 5. Place an order with 2x item1 and 1x item2
    const expectedOrderCalories = (Number(item1.calories) * 2) + (Number(item2.calories) * 1);
    const orderResult = await orderService.placeOrder(studentId, [
      { itemId: item1.item_id, quantity: 2 },
      { itemId: item2.item_id, quantity: 1 }
    ]);

    console.log(`📦 Order placed: Order #${orderResult.orderId} (Token: ${orderResult.pickupToken}, Calories: ${orderResult.totalCalories} kcal)`);

    if (orderResult.totalCalories !== expectedOrderCalories) {
      throw new Error(`Order totalCalories mismatch! Expected ${expectedOrderCalories}, got ${orderResult.totalCalories}`);
    }
    console.log(`✅ Test 2 Passed: Order total calories correctly computed (${expectedOrderCalories} kcal).`);

    // 6. Verify student_daily_intake table updated
    const afterOrderIntakeRow = await db.get("SELECT calories FROM student_daily_intake WHERE student_id = ? AND date = CURRENT_DATE", studentId);
    const afterOrderConsumed = afterOrderIntakeRow ? parseInt(afterOrderIntakeRow.calories, 10) : 0;
    const expectedConsumed = initialConsumed + expectedOrderCalories;

    if (afterOrderConsumed !== expectedConsumed) {
      throw new Error(`Daily intake mismatch! Expected ${expectedConsumed}, got ${afterOrderConsumed}`);
    }
    console.log(`✅ Test 3 Passed: Daily intake accumulated correctly to ${afterOrderConsumed} kcal.`);

    // 7. Verify order details query returns item calories
    const fullOrder = await orderService.getOrderById(orderResult.orderId);
    if (!fullOrder || fullOrder.total_calories !== expectedOrderCalories || fullOrder.items.length !== 2) {
      throw new Error("Order details query failed to include total_calories or items.");
    }
    console.log(`✅ Test 4 Passed: Order details query returned full calorie metadata.`);

    // 8. Test order cancellation & calorie deduction
    const cancelRes = await orderService.cancelOrder(orderResult.orderId, studentId);
    console.log(`❌ Cancelled Order #${orderResult.orderId}. Refunded: ${cancelRes.refundedAmount} credits.`);

    const afterCancelIntakeRow = await db.get("SELECT calories FROM student_daily_intake WHERE student_id = ? AND date = CURRENT_DATE", studentId);
    const afterCancelConsumed = afterCancelIntakeRow ? parseInt(afterCancelIntakeRow.calories, 10) : 0;

    if (afterCancelConsumed !== initialConsumed) {
      throw new Error(`Daily intake after cancellation mismatch! Expected ${initialConsumed}, got ${afterCancelConsumed}`);
    }
    console.log(`✅ Test 5 Passed: Order cancellation deducted calories correctly back to ${afterCancelConsumed} kcal.`);

    console.log('\n🎉 ALL HEALTH MODE TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runHealthModeTests();
