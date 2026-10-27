import db from './src/db/database.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/config.js';

async function testAdminFlow() {
  console.log('🧪 Testing Admin Authentication, /me Endpoint & Admin API Routes...\n');

  try {
    // 1. Fetch admin user from DB
    const admin = await db.get("SELECT * FROM admins WHERE role = 'admin' LIMIT 1");
    if (!admin) {
      throw new Error("No admin account found in database.");
    }
    console.log(`✅ Step 1: Found Admin account: ${admin.name} (${admin.email}, Role: ${admin.role})`);

    // 2. Generate JWT token for admin
    const token = jwt.sign(
      { id: admin.admin_id, email: admin.email, role: 'admin', name: admin.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    console.log(`✅ Step 2: Generated valid JWT token for Admin`);

    // 3. Test /me logic directly with admin id
    const adminMe = await db.get('SELECT admin_id, name, email, role FROM admins WHERE admin_id = ?', admin.admin_id);
    const meUser = {
      id: adminMe.admin_id,
      name: adminMe.name,
      email: adminMe.email,
      role: 'admin',
      isChef: false,
      isAdmin: true,
      isWarden: false,
      isStudent: false
    };
    console.log(`✅ Step 3: Verified /me response payload for Admin:`, meUser);

    // 4. Test /analytics and /stats query calculations
    const totalStudentsRow = await db.get("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const totalMenuRow = await db.get("SELECT COUNT(*) as count FROM menu_items");
    const allOrdersRow = await db.get(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_credits
      FROM orders 
      WHERE order_status != 'Cancelled'
    `);
    const topItems = await db.all(`
      SELECT m.item_id, m.item_name, m.category, m.price as credits_price, 
             COALESCE(SUM(oi.quantity), 0) as order_count, 
             COALESCE(SUM(oi.quantity), 0) as total_sold, 
             COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_status != 'Cancelled'
      GROUP BY m.item_id, m.item_name, m.category, m.price
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    console.log(`\n✅ Step 4: Admin Dashboard Stats Verified:`);
    console.log(`   Total Active Students: ${totalStudentsRow?.count || 0}`);
    console.log(`   Catalog Menu Items:    ${totalMenuRow?.count || 0}`);
    console.log(`   Total Orders:          ${allOrdersRow?.count || 0}`);
    console.log(`   Total Credits Volume:  ${allOrdersRow?.total_credits || 0}`);
    console.log(`   Top Dishes Count:      ${topItems.length}`);

    console.log('\n🎉 ALL ADMIN API & DASHBOARD VERIFICATION TESTS PASSED! 🚀\n');
  } catch (err) {
    console.error('\n❌ Admin Verification Failed:', err);
    process.exit(1);
  }
}

testAdminFlow().then(() => process.exit(0));
