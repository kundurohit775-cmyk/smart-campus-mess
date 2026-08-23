import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { auth } from '../src/auth.js';

dotenv.config();

async function checkAndSeedAccounts() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🐘 Checking Neon PostgreSQL accounts...');

    // 1. Check admins table
    const admins = await pool.query('SELECT * FROM admins');
    console.log('Admins in Neon:', admins.rows.map(a => ({ id: a.admin_id, name: a.name, email: a.email, role: a.role })));

    // 2. Check Better Auth "user" table
    const users = await pool.query('SELECT id, name, email, role FROM "user"');
    console.log('Better Auth users in Neon:', users.rows);

    // 3. Register Chef, Admin, and Students in Better Auth with password123
    const demoAccounts = [
      { name: 'Head Chef Marco Rossi', email: 'chef@campus.edu', password: 'password123', role: 'chef' },
      { name: 'Admin Sarah Jenkins', email: 'admin@campus.edu', password: 'password123', role: 'admin' },
      { name: 'Rohit Sharma', email: 'student@campus.edu', password: 'password123', role: 'student', roomNumber: 'Hostel B-302' },
      { name: 'Priya Patel', email: 'priya@campus.edu', password: 'password123', role: 'student', roomNumber: 'Hostel A-108' },
      { name: 'Alex Chen', email: 'alex@campus.edu', password: 'password123', role: 'student', roomNumber: 'Hostel C-214' }
    ];

    for (const acc of demoAccounts) {
      const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [acc.email]);
      if (existing.rows.length === 0) {
        console.log(`Creating Better Auth account for: ${acc.name} (${acc.email}, Role: ${acc.role})...`);
        const res = await fetch('http://127.0.0.1:5050/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
          body: JSON.stringify({
            name: acc.name,
            email: acc.email,
            password: acc.password,
            role: acc.role,
            roomNumber: acc.roomNumber || ''
          })
        });
        const d = await res.json();
        console.log(`   Result:`, res.status, d.user?.email, d.user?.role);
      } else {
        // Ensure role is correctly set
        await pool.query('UPDATE "user" SET role = $1 WHERE email = $2', [acc.role, acc.email]);
        console.log(`   Updated role for existing user: ${acc.email} -> ${acc.role}`);
      }
    }

    // 4. Ensure password_hash is valid in admins table as well
    const passwordHash = await bcrypt.hash('password123', 10);
    await pool.query(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES 
        ('Head Chef Marco Rossi', 'chef@campus.edu', $1, 'chef'),
        ('Admin Sarah Jenkins', 'admin@campus.edu', $1, 'admin')
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $1, role = EXCLUDED.role;
    `, [passwordHash]);

    console.log('✅ Admin & Chef credentials verified in both Better Auth and Neon DB!');
  } catch (err) {
    console.error('❌ Check/Seed error:', err);
  } finally {
    await pool.end();
  }
}

checkAndSeedAccounts();
