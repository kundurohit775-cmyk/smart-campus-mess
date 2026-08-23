import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../src/db/database.js';
import { creditService } from '../src/services/creditService.js';

dotenv.config();

async function cleanNonVitAccounts() {
  console.log('🧹 Cleaning non-VIT student accounts from database...');

  // 1. Clean in SQLite
  const nonVitStudents = db.prepare(`SELECT student_id, email FROM students WHERE email NOT LIKE '%@vitstudent.ac.in'`).all();
  console.log('Found non-VIT students in SQLite:', nonVitStudents.map(s => s.email));

  db.exec(`DELETE FROM students WHERE email NOT LIKE '%@vitstudent.ac.in'`);
  console.log('✅ Deleted non-VIT student records from SQLite');

  // Ensure default demo VIT student exists in SQLite
  const passwordHash = await bcrypt.hash('password123', 10);
  const vitDemoStudent = db.prepare(`SELECT student_id FROM students WHERE email = 'student@vitstudent.ac.in'`).get();
  let demoId;
  if (!vitDemoStudent) {
    const res = db.prepare(`
      INSERT INTO students (name, email, phone, password_hash, room_number, status)
      VALUES ('Aarav Sharma (VIT)', 'student@vitstudent.ac.in', '+91-9876500001', ?, 'Hostel B-302', 'active')
    `).run(passwordHash);
    demoId = res.lastInsertRowid;
    creditService.getOrCreateMonthlyCredits(demoId);
    console.log('✅ Created demo VIT student in SQLite: student@vitstudent.ac.in (9,000 credits)');
  }

  // 2. Clean in Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      // Find non-VIT students
      const pgNonVit = await pool.query(`SELECT student_id, email FROM students WHERE email NOT LIKE '%@vitstudent.ac.in'`);
      console.log('Found non-VIT students in Neon PG students table:', pgNonVit.rows.map(s => s.email));

      // Delete from students table
      await pool.query(`DELETE FROM students WHERE email NOT LIKE '%@vitstudent.ac.in'`);
      console.log('✅ Deleted non-VIT students from Neon PostgreSQL students table');

      // Delete non-VIT student accounts from Better Auth "user", "session", "account" tables (leave admin & chef untouched)
      const nonVitUsers = await pool.query(`
        SELECT id, email, role FROM "user" 
        WHERE (role = 'student' OR role IS NULL) AND email NOT LIKE '%@vitstudent.ac.in'
      `);
      console.log('Found non-VIT Better Auth student users:', nonVitUsers.rows.map(u => u.email));

      for (const u of nonVitUsers.rows) {
        await pool.query(`DELETE FROM "session" WHERE "userId" = $1`, [u.id]);
        await pool.query(`DELETE FROM "account" WHERE "userId" = $1`, [u.id]);
        await pool.query(`DELETE FROM "user" WHERE id = $1`, [u.id]);
      }
      console.log('✅ Deleted non-VIT Better Auth student sessions/accounts/users');

      // Ensure demo VIT student in Neon PostgreSQL
      const pgVit = await pool.query(`SELECT student_id FROM students WHERE email = 'student@vitstudent.ac.in'`);
      if (pgVit.rows.length === 0) {
        const ins = await pool.query(`
          INSERT INTO students (name, email, phone, password_hash, room_number, status)
          VALUES ('Aarav Sharma (VIT)', 'student@vitstudent.ac.in', '+91-9876500001', $1, 'Hostel B-302', 'active')
          RETURNING student_id
        `, [passwordHash]);
        const sId = ins.rows[0].student_id;
        const now = new Date();
        await pool.query(`
          INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
          VALUES ($1, 9000, 0, 9000, $2, $3)
          ON CONFLICT (student_id, month, year) DO NOTHING
        `, [sId, now.getMonth() + 1, now.getFullYear()]);
        console.log('✅ Created demo VIT student in Neon PostgreSQL: student@vitstudent.ac.in');
      }

      // Ensure demo VIT student in Better Auth
      const betterAuthVit = await pool.query(`SELECT id FROM "user" WHERE email = 'student@vitstudent.ac.in'`);
      if (betterAuthVit.rows.length === 0) {
        const fetchRes = await fetch('http://127.0.0.1:5050/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
          body: JSON.stringify({
            name: 'Aarav Sharma (VIT)',
            email: 'student@vitstudent.ac.in',
            password: 'password123',
            role: 'student',
            roomNumber: 'Hostel B-302'
          })
        });
        const resData = await fetchRes.json();
        console.log('✅ Created Better Auth account for student@vitstudent.ac.in:', fetchRes.status);
      }

      // Check remaining users in Better Auth
      const remainingUsers = await pool.query(`SELECT id, email, role FROM "user"`);
      console.log('Active users in Better Auth:', remainingUsers.rows);

      // Check remaining admins
      const remainingAdmins = await pool.query(`SELECT admin_id, email, role FROM admins`);
      console.log('Active admins in Neon DB:', remainingAdmins.rows);
    } catch (e) {
      console.error('Neon cleanup error:', e);
    } finally {
      await pool.end();
    }
  }
}

cleanNonVitAccounts();
