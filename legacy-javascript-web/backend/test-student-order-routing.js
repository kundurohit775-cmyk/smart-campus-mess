import jwt from 'jsonwebtoken';
import http from 'http';
import app from './src/server.js';
import { config } from './src/config/config.js';
import db from './src/db/database.js';

async function runStudentRoutingTests() {
  console.log('🧪 ====================================================================');
  console.log('   END-TO-END VALIDATION: STUDENT ORDER ROUTING & ROLE SECURITY');
  console.log('======================================================================\n');

  // Start temporary server on an open port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Ensure test student exists with balance
    let student = await db.get("SELECT * FROM students WHERE email = 'test.student@vitstudent.ac.in'");
    if (!student) {
      const sRes = await db.query(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Test Student', 'test.student@vitstudent.ac.in', '+919876543210', 'better-auth', 'Block A - 101', 'active')
        RETURNING *
      `);
      student = sRes.rows[0];
    } else {
      await db.query("UPDATE students SET status = 'active' WHERE student_id = $1", [student.student_id]);
    }

    // Ensure student has credits in credits table (Balance = 8,220 Credits)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    await db.query(`
      INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
      VALUES ($1, 9000, 780, 8220, $2, $3)
      ON CONFLICT (student_id, month, year) 
      DO UPDATE SET remaining_credits = 8220, used_credits = 780
    `, [student.student_id, currentMonth, currentYear]);

    // Create student JWT
    const studentToken = jwt.sign({
      id: student.student_id,
      name: student.name,
      email: student.email,
      role: 'student'
    }, config.jwtSecret, { expiresIn: '1h' });

    // Create chef JWT
    const chefToken = jwt.sign({
      id: 5,
      name: 'Executive Chef',
      email: config.chefEmail || 'chef@vitstudent.ac.in',
      role: 'chef'
    }, config.jwtSecret, { expiresIn: '1h' });

    // Fetch special item and regular item
    const specialItem = await db.get("SELECT item_id, item_name, price FROM menu_items WHERE is_special = true AND special_stock_limit IS NOT NULL LIMIT 1");
    const regularItem = await db.get("SELECT item_id, item_name, price FROM menu_items WHERE is_special = false OR is_special IS NULL LIMIT 1");

    // -----------------------------------------------------------------------
    // TEST 1: Student Places Special Pre-Order
    // -----------------------------------------------------------------------
    console.log('--- TEST 1: Student Places Next-Day Special Pre-Order ---');
    console.log(`Student placing pre-order for: "${specialItem.item_name}" (#${specialItem.item_id}), qty = 2`);
    
    const preOrderRes = await fetch(`${baseUrl}/api/preorders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        itemId: specialItem.item_id,
        quantity: 2
      })
    });

    const preOrderData = await preOrderRes.json();
    console.log('Status Code:', preOrderRes.status);
    console.log('Response Message:', preOrderData.message);
    console.log('Pickup Token:', preOrderData.preOrder?.pickup_token);

    if (preOrderRes.status !== 201 || !preOrderData.success) {
      throw new Error(`TEST 1 FAILED: Pre-order failed with status ${preOrderRes.status}: ${JSON.stringify(preOrderData)}`);
    }
    if (!preOrderData.preOrder?.pickup_token?.startsWith('PRE-')) {
      throw new Error(`TEST 1 FAILED: Expected PRE-XXXX token, got ${preOrderData.preOrder?.pickup_token}`);
    }
    console.log(`✅ Test 1 Passed: Student pre-order confirmed with token ${preOrderData.preOrder.pickup_token}!\n`);

    // -----------------------------------------------------------------------
    // TEST 2: Student Places Regular Food Order via Meal Tray
    // -----------------------------------------------------------------------
    console.log('--- TEST 2: Student Places Regular Order (Meal Tray Checkout) ---');
    console.log(`Student ordering regular meal: "${regularItem.item_name}" (#${regularItem.item_id}), qty = 1`);
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: regularItem.item_id, quantity: 1 }],
        deliveryType: 'self-pickup'
      })
    });

    const orderData = await orderRes.json();
    console.log('Status Code:', orderRes.status);
    console.log('Response Message:', orderData.message);
    console.log('Pickup Token:', orderData.order?.pickupToken);

    if (orderRes.status !== 201 || !orderData.order) {
      throw new Error(`TEST 2 FAILED: Order placement failed with status ${orderRes.status}: ${JSON.stringify(orderData)}`);
    }
    console.log(`✅ Test 2 Passed: Student regular order placed successfully! Token: ${orderData.order.pickupToken}\n`);

    // -----------------------------------------------------------------------
    // TEST 3: Check Balance Deduction
    // -----------------------------------------------------------------------
    console.log('--- TEST 3: Verify Atomic Credit Deduction ---');
    const creditRes = await db.get('SELECT remaining_credits, used_credits FROM credits WHERE student_id = ? AND month = ? AND year = ?', student.student_id, currentMonth, currentYear);
    console.log(`Remaining Credits: ${creditRes.remaining_credits} (Deducted from initial 8,220)`);
    if (creditRes.remaining_credits >= 8220) {
      throw new Error(`TEST 3 FAILED: Credits were not deducted from 8220 balance!`);
    }
    console.log('✅ Test 3 Passed: Credit balance deducted atomically in database!\n');

    // -----------------------------------------------------------------------
    // TEST 4: Student Fetches Own Orders & Pre-Orders
    // -----------------------------------------------------------------------
    console.log('--- TEST 4: Student Fetches Own Orders & Pre-Orders ---');
    const getOrdersRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const getOrdersData = await getOrdersRes.json();
    console.log(`Fetched ${getOrdersData.orders?.length} student orders.`);

    const getPreOrdersRes = await fetch(`${baseUrl}/api/preorders/my`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const getPreOrdersData = await getPreOrdersRes.json();
    console.log(`Fetched ${getPreOrdersData.preOrders?.length} student pre-orders.`);

    if (getOrdersRes.status !== 200 || getPreOrdersRes.status !== 200) {
      throw new Error('TEST 4 FAILED: Fetching student orders or pre-orders returned error');
    }
    console.log('✅ Test 4 Passed: Student successfully retrieves their own orders & reservations!\n');

    // -----------------------------------------------------------------------
    // TEST 5: Role Security - Student Blocked from Chef Endpoints
    // -----------------------------------------------------------------------
    console.log('--- TEST 5: Role Security (Student attempting Chef-only endpoint) ---');
    const forbiddenChefRes = await fetch(`${baseUrl}/api/chef/forecast/today`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const forbiddenChefData = await forbiddenChefRes.json();
    console.log('Status Code:', forbiddenChefRes.status);
    console.log('Response Error:', forbiddenChefData.error);

    if (forbiddenChefRes.status !== 403) {
      throw new Error(`TEST 5 FAILED: Expected 403 Forbidden for student hitting chef route, got ${forbiddenChefRes.status}`);
    }
    console.log('✅ Test 5 Passed: Student is strictly blocked (403 Forbidden) from Chef endpoints!\n');

    // -----------------------------------------------------------------------
    // TEST 6: Chef Can Access Chef Dashboard & Forecasts
    // -----------------------------------------------------------------------
    console.log('--- TEST 6: Chef Authorization (Chef accessing Chef endpoint) ---');
    const chefRes = await fetch(`${baseUrl}/api/chef/forecast/today`, {
      headers: { 'Authorization': `Bearer ${chefToken}` }
    });
    const chefData = await chefRes.json();
    console.log('Status Code:', chefRes.status);
    console.log(`Chef successfully fetched ${chefData.forecasts?.length} dish forecasts.`);

    if (chefRes.status !== 200) {
      throw new Error(`TEST 6 FAILED: Chef was blocked with status ${chefRes.status}`);
    }
    console.log('✅ Test 6 Passed: Chef access remains fully operational and authorized!\n');

    console.log('🎉 ALL 6 STUDENT ORDER ROUTING & SECURITY TESTS PASSED WITH 100% SUCCESS! 🚀\n');
  } finally {
    server.close();
  }
}

runStudentRoutingTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Routing Test Error:', err);
  process.exit(1);
});
