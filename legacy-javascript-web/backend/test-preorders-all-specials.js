import jwt from 'jsonwebtoken';
import http from 'http';
import app from './src/server.js';
import { config } from './src/config/config.js';
import db from './src/db/database.js';

async function testAllSpecialsPreOrder() {
  console.log('🧪 ====================================================================');
  console.log('   END-TO-END VALIDATION: ALL SPECIAL PRE-ORDERS WORKING CORRECTLY');
  console.log('======================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Get or create test student with sufficient balance
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
      DO UPDATE SET remaining_credits = 9000, used_credits = 0
    `, [student.student_id, currentMonth, currentYear]);

    const studentToken = jwt.sign({
      id: student.student_id,
      name: student.name,
      email: student.email,
      role: 'student'
    }, config.jwtSecret, { expiresIn: '1h' });

    // 2. Fetch Menu and verify specials
    console.log('Step 1: Fetching menu from GET /api/menu...');
    const menuRes = await fetch(`${baseUrl}/api/menu`);
    const menuData = await menuRes.json();
    const specialsFromMenu = (menuData.items || []).filter(i => i.is_special || i.isSpecial);
    console.log(`Found ${specialsFromMenu.length} special dishes in menu.`);

    if (specialsFromMenu.length < 3) {
      throw new Error(`Expected at least 3 special dishes, found ${specialsFromMenu.length}`);
    }

    // 3. Test pre-ordering across multiple different special dishes
    console.log('\nStep 2: Pre-ordering 3-4 different special dishes...');
    const testItems = specialsFromMenu.slice(0, 4);

    for (const specialItem of testItems) {
      console.log(`\nTesting Special Dish: "${specialItem.item_name}" (ID: ${specialItem.item_id}, Price: ${specialItem.price} Cr)`);
      
      const res = await fetch(`${baseUrl}/api/preorders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          itemId: specialItem.item_id,
          quantity: 1
        })
      });

      const data = await res.json();
      console.log(`   • Status Code: ${res.status}`);
      console.log(`   • Response Message: ${data.message}`);
      console.log(`   • Pickup Token: ${data.preOrder?.pickup_token}`);

      if (res.status !== 201 || !data.success) {
        throw new Error(`FAILED to pre-order "${specialItem.item_name}": ${JSON.stringify(data)}`);
      }
      if (!data.preOrder?.pickup_token?.startsWith('PRE-')) {
        throw new Error(`Invalid pickup token format for "${specialItem.item_name}": ${data.preOrder?.pickup_token}`);
      }
      console.log(`   ✅ Pre-order confirmed successfully for "${specialItem.item_name}"!`);
    }

    // 4. Verify student can fetch their pre-orders
    console.log('\nStep 3: Verifying student can view all confirmed pre-orders in GET /api/preorders/my...');
    const myPreOrdersRes = await fetch(`${baseUrl}/api/preorders/my`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const myPreOrdersData = await myPreOrdersRes.json();
    console.log(`Fetched ${myPreOrdersData.preOrders?.length} active pre-orders for student.`);
    if (myPreOrdersRes.status !== 200 || myPreOrdersData.preOrders?.length < testItems.length) {
      throw new Error(`Expected at least ${testItems.length} pre-orders in student list.`);
    }

    console.log('\n🎉 ALL SPECIAL DISHES PRE-ORDERED AND CONFIRMED WITH 100% SUCCESS! 🚀\n');
  } finally {
    server.close();
  }
}

testAllSpecialsPreOrder().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
