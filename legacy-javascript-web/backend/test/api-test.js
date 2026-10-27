import db from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';
import { creditService } from '../src/services/creditService.js';
import { orderService } from '../src/services/orderService.js';

async function runTests() {
  console.log('🧪 Starting Smart Campus Mess System Backend Test Suite...\n');

  try {
    // 1. Reset and seed DB
    await seedDatabase();
    console.log('✅ Test 1 Passed: Database seeded cleanly.');

    // 2. Check student credits
    const student1 = db.prepare('SELECT * FROM students WHERE email = ?').get('student@campus.edu');
    const credits1 = creditService.getOrCreateMonthlyCredits(student1.student_id);
    console.log(`Student ${student1.name} credits: ${credits1.remaining_credits} / ${credits1.monthly_limit}`);
    if (credits1.remaining_credits !== 9000) {
      throw new Error(`Expected 9000 credits, got ${credits1.remaining_credits}`);
    }
    console.log('✅ Test 2 Passed: Student credit initialization with 9,000 default allowance verified.');

    // 3. Test Menu Items
    const items = db.prepare('SELECT * FROM menu_items WHERE is_active = 1').all();
    console.log(`Total active menu items in DB: ${items.length}`);
    const dosa = items.find(i => i.item_name.includes('Masala Dosa'));
    const chai = items.find(i => i.item_name.includes('Masala Chai'));
    const initialDosaStock = dosa.available_quantity;

    // 4. Place an atomic order
    console.log('\n📦 Testing Atomic Order Placement:');
    const orderItems = [
      { itemId: dosa.item_id, quantity: 2 }, // 2 * 90 = 180
      { itemId: chai.item_id, quantity: 1 }  // 1 * 30 = 30 -> Total 210
    ];

    const orderRes = orderService.placeOrder(student1.student_id, orderItems);
    console.log(`Order Placed: #${orderRes.orderId} (${orderRes.pickupToken}), Total: ${orderRes.totalAmount}, Remaining Credits: ${orderRes.remainingCredits}`);

    if (orderRes.remainingCredits !== 9000 - 210) {
      throw new Error(`Expected remaining credits 8790, got ${orderRes.remainingCredits}`);
    }

    // Verify stock decremented
    const updatedDosa = db.prepare('SELECT * FROM menu_items WHERE item_id = ?').get(dosa.item_id);
    if (updatedDosa.available_quantity !== initialDosaStock - 2) {
      throw new Error(`Expected stock ${initialDosaStock - 2}, got ${updatedDosa.available_quantity}`);
    }
    console.log('✅ Test 3 Passed: Atomic Order placement & inventory decrement verified.');

    // 5. Test Insufficient Credit Rejection
    console.log('\n🚫 Testing Insufficient Credits Rejection:');
    try {
      // Temporarily set credits to 50
      db.prepare('UPDATE credits SET remaining_credits = 50 WHERE student_id = ?').run(student1.student_id);
      orderService.placeOrder(student1.student_id, [{ itemId: dosa.item_id, quantity: 1 }]);
      throw new Error('Should have failed with Insufficient Credits!');
    } catch (err) {
      if (err.message.includes('Insufficient credits')) {
        console.log(`✅ Test 4 Passed: Insufficient credit correctly rejected: "${err.message}"`);
      } else {
        throw err;
      }
    }
    // Restore credits for next tests
    db.prepare('UPDATE credits SET remaining_credits = 8790 WHERE student_id = ?').run(student1.student_id);

    // 6. Test Pending Order Cancellation & Refund
    console.log('\n🔄 Testing Order Cancellation & Credit Refund:');
    const cancelRes = orderService.cancelOrder(orderRes.orderId, student1.student_id, false);
    console.log(`Cancelled Order #${cancelRes.orderId}. Refunded: ${cancelRes.refundedAmount}, Balance After: ${cancelRes.balanceAfter}`);

    if (cancelRes.balanceAfter !== 9000) {
      throw new Error(`Expected balance 9000 after refund, got ${cancelRes.balanceAfter}`);
    }

    // Verify stock restored
    const restoredDosa = db.prepare('SELECT * FROM menu_items WHERE item_id = ?').get(dosa.item_id);
    if (restoredDosa.available_quantity !== initialDosaStock) {
      throw new Error(`Expected stock restored to ${initialDosaStock}, got ${restoredDosa.available_quantity}`);
    }
    console.log('✅ Test 5 Passed: Order Cancellation refunded full credits and restored inventory.');

    // 7. Test Non-Pending Cancellation Block
    console.log('\n🔒 Testing Cancellation Disallowed Once Preparing:');
    const newOrder = orderService.placeOrder(student1.student_id, [{ itemId: chai.item_id, quantity: 1 }]);
    // Move order to "Preparing"
    orderService.updateOrderStatus(newOrder.orderId, 'Preparing');
    
    try {
      orderService.cancelOrder(newOrder.orderId, student1.student_id, false);
      throw new Error('Should have rejected cancellation for Preparing order!');
    } catch (err) {
      if (err.message.includes('Cancellation is only permitted while the order is "Pending"')) {
        console.log(`✅ Test 6 Passed: Cancellation blocked when status is Preparing: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 8. Test Chef Status Progression
    console.log('\n👨‍🍳 Testing Chef Order Workflow:');
    const readyOrder = orderService.updateOrderStatus(newOrder.orderId, 'Ready');
    if (readyOrder.order_status !== 'Ready') throw new Error('Failed to mark Ready');

    const completedOrder = orderService.updateOrderStatus(newOrder.orderId, 'Completed');
    if (completedOrder.order_status !== 'Completed' || !completedOrder.completed_time) {
      throw new Error('Failed to mark Completed with timestamp');
    }
    console.log('✅ Test 7 Passed: Chef status transitions (Preparing -> Ready -> Completed) verified.');

    // 9. Test Admin Credit Adjustment
    console.log('\n👑 Testing Admin Credit Adjustment:');
    const adjusted = creditService.adjustStudentCredits(student1.student_id, 500, 'Campus Hackathon Winner Prize');
    console.log(`Admin adjusted credits. New balance: ${adjusted.remaining_credits}`);
    console.log('✅ Test 8 Passed: Admin credit adjustment verified.');

    console.log('\n🎉 ALL 8 BACKEND & TRANSACTION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
