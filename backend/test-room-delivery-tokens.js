import jwt from 'jsonwebtoken';
import http from 'http';
import app from './src/server.js';
import { config } from './src/config/config.js';
import db from './src/db/database.js';

async function testRoomDeliveryTokens() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING ROOM DELIVERY TOKEN GENERATION & CHEF PORTAL UPDATES');
  console.log('======================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Get or create test student
    let student = await db.get("SELECT student_id, name, email FROM students WHERE email = 'test.student@vitstudent.ac.in'");
    if (!student) {
      const sRes = await db.query(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES ('Test Student', 'test.student@vitstudent.ac.in', '+919876543210', 'hash', 'Block B - 204', 'active')
        RETURNING *
      `);
      student = sRes.rows[0];
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    await db.query(`
      INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
      VALUES ($1, 9000, 0, 9000, $2, $3)
      ON CONFLICT (student_id, month, year) 
      DO UPDATE SET remaining_credits = 9000
    `, [student.student_id, currentMonth, currentYear]);

    // Insert approved health request for student to permit room delivery
    await db.query(`
      INSERT INTO health_requests (student_id, requested_date, reason, status, hostel_name, room_number, warden_email)
      VALUES ($1, CURRENT_DATE, 'Fever', 'approved', 'Block B', '204', 'warden.blockb@vitstudent.ac.in')
    `, [student.student_id]);

    const studentToken = jwt.sign({
      id: student.student_id,
      name: student.name,
      email: student.email,
      role: 'student'
    }, config.jwtSecret, { expiresIn: '1h' });

    const chefToken = jwt.sign({
      id: 5,
      name: 'Executive Chef',
      email: config.chefEmail || 'chef@vitstudent.ac.in',
      role: 'chef'
    }, config.jwtSecret, { expiresIn: '1h' });

    const item = await db.get("SELECT item_id, price FROM menu_items WHERE is_active = 1 LIMIT 1");

    // TEST 1: Place an order directly for room delivery
    console.log('Step 1: Placing order for Hostel Room Delivery...');
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: item.item_id, quantity: 1 }],
        deliveryType: 'hostel-delivery',
        deliveryAddress: 'Block B - Room 204'
      })
    });
    const orderData = await orderRes.json();
    console.log('Order Placement Response:', orderData);
    const orderId = orderData.order?.orderId;
    const token = orderData.order?.pickupToken;

    if (!token?.startsWith('ROOM-TK-')) {
      throw new Error(`Expected token to start with ROOM-TK-, got "${token}"`);
    }
    console.log(`✅ Step 1 Passed: Order #${orderId} token generated with ROOM prefix: "${token}"!`);

    // TEST 2: Chef fetches queue and verifies room delivery token & destination
    console.log('\nStep 2: Chef fetches queue to verify order in chef portal...');
    const chefOrdersRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { 'Authorization': `Bearer ${chefToken}` }
    });
    const chefOrdersData = await chefOrdersRes.json();
    const fetchedOrder = chefOrdersData.orders?.find(o => o.order_id === orderId);

    if (!fetchedOrder) {
      throw new Error(`Order #${orderId} not found in chef orders list.`);
    }
    if (!fetchedOrder.pickup_token.startsWith('ROOM-TK-')) {
      throw new Error(`Fetched order token does not start with ROOM-TK-: "${fetchedOrder.pickup_token}"`);
    }
    if (fetchedOrder.delivery_type !== 'hostel-delivery' || !fetchedOrder.delivery_address) {
      throw new Error(`Delivery details missing on fetched order: ${JSON.stringify(fetchedOrder)}`);
    }
    console.log(`✅ Step 2 Passed: Chef portal receives Token "${fetchedOrder.pickup_token}" with delivery to "${fetchedOrder.delivery_address}"!`);

    // TEST 3: Place a counter-pickup order, then Chef enters/marks it for room delivery in Chef Portal
    console.log('\nStep 3: Placing standard counter pickup order, then Chef enters room delivery in portal...');
    const counterOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: item.item_id, quantity: 1 }],
        deliveryType: 'self-pickup'
      })
    });
    const counterOrderData = await counterOrderRes.json();
    const counterOrderId = counterOrderData.order?.orderId;
    console.log(`Placed counter order #${counterOrderId} with initial token "${counterOrderData.order?.pickupToken}"`);

    // Chef enters room delivery for this order
    console.log(`Chef enters in portal that food for #${counterOrderId} will be delivered to "Block D - Room 412"...`);
    const updateRes = await fetch(`${baseUrl}/api/orders/${counterOrderId}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`
      },
      body: JSON.stringify({
        deliveryType: 'hostel-delivery',
        deliveryAddress: 'Block D - Room 412'
      })
    });
    const updateData = await updateRes.json();
    console.log('Chef Delivery Update Response:', updateData);

    if (!updateData.order?.pickup_token?.startsWith('ROOM-TK-')) {
      throw new Error(`Expected updated token to have ROOM-TK-, got: "${updateData.order?.pickup_token}"`);
    }
    if (updateData.order?.delivery_address !== 'Block D - Room 412') {
      throw new Error(`Delivery address mismatch: "${updateData.order?.delivery_address}"`);
    }
    console.log(`✅ Step 3 Passed: Token for #${counterOrderId} updated to "${updateData.order?.pickup_token}" mentioning food will be delivered to "${updateData.order?.delivery_address}"!`);

    console.log('\n🎉 ALL ROOM DELIVERY TOKEN & CHEF PORTAL TESTS PASSED WITH 100% SUCCESS! 🚀\n');
  } finally {
    server.close();
  }
}

testRoomDeliveryTokens().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
