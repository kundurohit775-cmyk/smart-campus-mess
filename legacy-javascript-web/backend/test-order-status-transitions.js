import jwt from 'jsonwebtoken';
import http from 'http';
import app from './src/server.js';
import { config } from './src/config/config.js';
import db from './src/db/database.js';

async function testOrderStatusTransitions() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING ORDER STATUS TRANSITIONS (Pending -> Preparing -> Ready -> Completed)');
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
        VALUES ('Test Student', 'test.student@vitstudent.ac.in', '+919876543210', 'hash', '101', 'active')
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

    // Student & Chef JWTs
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

    // Step 1: Create new order
    console.log('Step 1: Student places new order (Status: Pending)...');
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: item.item_id, quantity: 1 }]
      })
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order?.orderId;
    console.log(`Order created: #${orderId}, Status: ${orderData.order?.orderStatus}`);
    if (!orderId) throw new Error('Order creation failed');

    // Step 2: Chef clicks "Start Cooking" (Sends "Preparing")
    console.log('\nStep 2: Chef clicks "Start Cooking" -> sends status "Preparing"...');
    const prepRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`
      },
      body: JSON.stringify({ status: 'Preparing' })
    });
    const prepData = await prepRes.json();
    console.log('Status code:', prepRes.status);
    console.log('Response:', prepData);
    if (prepRes.status !== 200 || prepData.order?.order_status !== 'Preparing') {
      throw new Error(`Step 2 Failed: Status not Preparing (${prepRes.status})`);
    }
    console.log('✅ Step 2 Passed: Successfully transitioned to "Preparing"!');

    // Step 3: Chef marks "Ready"
    console.log('\nStep 3: Chef clicks "Mark Ready" -> sends status "Ready"...');
    const readyRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`
      },
      body: JSON.stringify({ status: 'Ready' })
    });
    const readyData = await readyRes.json();
    console.log('Status code:', readyRes.status);
    console.log('Response:', readyData);
    if (readyRes.status !== 200 || readyData.order?.order_status !== 'Ready') {
      throw new Error(`Step 3 Failed: Status not Ready (${readyRes.status})`);
    }
    console.log('✅ Step 3 Passed: Successfully transitioned to "Ready"!');

    // Step 4: Chef marks "Completed"
    console.log('\nStep 4: Chef clicks "Complete Order" -> sends status "Completed"...');
    const compRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    const compData = await compRes.json();
    console.log('Status code:', compRes.status);
    console.log('Response:', compData);
    if (compRes.status !== 200 || compData.order?.order_status !== 'Completed') {
      throw new Error(`Step 4 Failed: Status not Completed (${compRes.status})`);
    }
    console.log('✅ Step 4 Passed: Successfully transitioned to "Completed"!');

    // Step 5: Test Normalization fallback if "Cooking" is sent
    console.log('\nStep 5: Test legacy/UI "Cooking" string normalization fallback...');
    // Create second order
    const orderRes2 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        items: [{ itemId: item.item_id, quantity: 1 }]
      })
    });
    const orderData2 = await orderRes2.json();
    const orderId2 = orderData2.order?.orderId;

    const cookingRes = await fetch(`${baseUrl}/api/orders/${orderId2}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`
      },
      body: JSON.stringify({ status: 'Cooking' })
    });
    const cookingData = await cookingRes.json();
    console.log('Status code for "Cooking":', cookingRes.status);
    console.log('Response:', cookingData);
    if (cookingRes.status !== 200 || cookingData.order?.order_status !== 'Preparing') {
      throw new Error(`Step 5 Failed: "Cooking" was not normalized to "Preparing"!`);
    }
    console.log('✅ Step 5 Passed: "Cooking" successfully normalized to "Preparing" with 0 errors!');

    console.log('\n🎉 ALL ORDER STATUS TRANSITION TESTS PASSED WITH 100% SUCCESS! 🚀\n');
  } finally {
    server.close();
  }
}

testOrderStatusTransitions().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test Error:', err);
  process.exit(1);
});
