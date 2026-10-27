import db from './src/db/database.js';
import { sickLeaveService } from './src/services/sickLeaveService.js';
import { orderService } from './src/services/orderService.js';
import { creditService } from './src/services/creditService.js';
import { migrateSickLeave } from './src/db/migrate_sick_leave.js';

async function runSickLeaveTests() {
  console.log('🧪 Starting Sick Leave Hostel Delivery End-to-End Tests...\n');

  try {
    // 1. Run migration check
    await migrateSickLeave();

    // 2. Fetch or create a test student
    let student = await db.get("SELECT student_id, name, email, room_number FROM students WHERE email = 'test_student_sick@vitstudent.ac.in'");
    if (!student) {
      const res = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Test Sick Student', 'test_student_sick@vitstudent.ac.in', '9876543210', 'hash', 'Room 204', 'active')
      `);
      student = await db.get('SELECT * FROM students WHERE student_id = ?', res.lastInsertRowid);
    }
    const studentId = student.student_id;

    // Ensure student has credits
    await creditService.getOrCreateMonthlyCredits(studentId);

    // Ensure a test menu item exists
    let item = await db.get("SELECT item_id, price FROM menu_items WHERE is_active = 1 LIMIT 1");
    if (!item) {
      const itemRes = await db.run(`
        INSERT INTO menu_items (item_name, category, price, available_quantity, is_active)
        VALUES ('Sick Leave Herbal Soup', 'Lunch', 80, 50, 1)
      `);
      item = { item_id: itemRes.lastInsertRowid, price: 80 };
    }

    // Clean up prior test health requests for today
    await db.run('DELETE FROM health_requests WHERE student_id = ?', studentId);

    // 3. Test 1: Submit Sick Leave Request
    const reqRes = await sickLeaveService.createRequest(studentId, {
      hostelName: "Men's Hostel Block B",
      roomNumber: "Room 204",
      reason: "High fever and viral fatigue, bed rest advised",
      requestedDate: new Date().toISOString().split('T')[0]
    });

    const requestId = reqRes.request.request_id;
    const approvalToken = reqRes.request.approval_token;
    console.log(`📋 Created Sick Leave Request #${requestId} for Student #${studentId} (Token: ${approvalToken?.slice(0, 12)}...)`);
    console.log(`📧 Warden Email Link: ${reqRes.approveUrl}`);

    if (reqRes.request.status !== 'pending') {
      throw new Error(`Expected status 'pending', got: ${reqRes.request.status}`);
    }
    console.log('✅ Test 1 Passed: Sick leave request submitted in pending status with approval token.');

    // 4. Test 2: Order Guard: Attempting hostel-delivery order while pending must FAIL
    let guardBlocked = false;
    try {
      await orderService.placeOrder(studentId, [{ itemId: item.item_id, quantity: 1 }], {
        deliveryType: 'hostel-delivery',
        hostelName: "Men's Hostel Block B",
        roomNumber: "Room 204"
      });
    } catch (err) {
      guardBlocked = true;
      console.log(`🛡️ Correctly blocked unapproved delivery order: "${err.message}"`);
    }

    if (!guardBlocked) {
      throw new Error('Hostel delivery order was placed without warden approval!');
    }
    console.log('✅ Test 2 Passed: Unapproved hostel delivery order rejected server-side.');

    // 5. Test 3: Warden One-Click Approve Action
    const approveHtml = await sickLeaveService.handleWardenAction(requestId, 'approve', approvalToken);
    if (!approveHtml.includes('Approved Successfully')) {
      throw new Error('Warden approval HTML did not contain success message');
    }

    const approvedStatus = await sickLeaveService.getStudentStatus(studentId);
    if (approvedStatus.status !== 'approved' || !approvedStatus.isApproved) {
      throw new Error(`Expected status 'approved', got: ${approvedStatus.status}`);
    }
    console.log('✅ Test 3 Passed: Warden approved request via token, status updated to "approved".');

    // 6. Test 4: Replay Protection: Re-clicking the token must return "already responded"
    const replayHtml = await sickLeaveService.handleWardenAction(requestId, 'approve', approvalToken);
    if (!replayHtml.includes('Action Already Completed') && !replayHtml.includes('Already Responded')) {
      throw new Error('Replay protection failed — token was not invalidated');
    }
    console.log('✅ Test 4 Passed: Replay protection verified (single-use token invalidated).');

    // 7. Test 5: Place Approved Hostel-Delivery Order
    const placedOrder = await orderService.placeOrder(studentId, [{ itemId: item.item_id, quantity: 1 }], {
      deliveryType: 'hostel-delivery',
      hostelName: "Men's Hostel Block B",
      roomNumber: "Room 204"
    });

    console.log(`📦 Placed Hostel Delivery Order #${placedOrder.orderId} (Token: ${placedOrder.pickupToken})`);
    if (placedOrder.deliveryType !== 'hostel-delivery' || placedOrder.approvalStatus !== 'approved') {
      throw new Error(`Invalid order delivery fields: ${JSON.stringify(placedOrder)}`);
    }
    console.log(`🏠 Delivery Address: ${placedOrder.deliveryAddress}`);
    console.log('✅ Test 5 Passed: Approved student successfully placed hostel room delivery order.');

    // 8. Test 6: Chef View shows delivery flag and address
    const chefOrders = await orderService.getAllOrders();
    const targetOrder = chefOrders.find(o => o.order_id === placedOrder.orderId);
    if (!targetOrder || targetOrder.delivery_type !== 'hostel-delivery') {
      throw new Error('Chef orders queue did not include delivery_type');
    }
    console.log(`👨‍🍳 Chef Order #${targetOrder.order_id} tagged with: delivery_type=${targetOrder.delivery_type}, address=${targetOrder.delivery_address}`);
    console.log('✅ Test 6 Passed: Kitchen orders queue correctly flags hostel delivery orders.');

    // 9. Clean up test order
    await db.run('DELETE FROM orders WHERE order_id = ?', placedOrder.orderId);
    await db.run('DELETE FROM health_requests WHERE request_id = ?', requestId);
    console.log('🧹 Cleaned up test records.');

    console.log('\n🎉 ALL SICK LEAVE HOSTEL DELIVERY TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('\n❌ Sick Leave Tests Failed:', err);
    process.exit(1);
  }
}

runSickLeaveTests().then(() => process.exit(0));
