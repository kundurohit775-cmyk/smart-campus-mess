import bcrypt from 'bcryptjs';
import db from './database.js';
import { config } from '../config/config.js';

export async function migrateAdminEmail() {
  console.log('🔄 Running Admin Email Database Migration...');
  const targetAdminEmail = (process.env.ADMIN_EMAIL || config.adminEmail || '').trim().toLowerCase();
  if (!targetAdminEmail) {
    console.warn('⚠️ No ADMIN_EMAIL provided in environment variables. Skipping admin record migration.');
    return;
  }

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Demote or delete old admin accounts in admins table that don't match targetAdminEmail
    await db.pool.query(`
      DELETE FROM admins WHERE role = 'admin' AND LOWER(email) != $1
    `, [targetAdminEmail]);

    // 2. Insert or update the authorized admin in admins table
    await db.pool.query(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES ('Admin Sarah Jenkins', $1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE 
      SET role = 'admin', password_hash = $2, name = 'Admin Sarah Jenkins'
    `, [targetAdminEmail, passwordHash]);

    // 3. Demote old admin accounts in Better Auth "user" table
    await db.pool.query(`
      UPDATE "user" SET role = 'student' 
      WHERE role = 'admin' AND LOWER(email) != $1
    `, [targetAdminEmail]);

    // 4. Provision or update Better Auth "user" and "account" tables for targetAdminEmail
    const adminUserRow = await db.pool.query('SELECT id FROM "user" WHERE LOWER(email) = $1', [targetAdminEmail]);
    let adminUserId;
    if (adminUserRow.rows.length === 0) {
      adminUserId = `adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "roomNumber", phone)
        VALUES ($1, 'Admin Sarah Jenkins', $2, TRUE, NOW(), NOW(), 'admin', 'Administration HQ', '+91-9876500003')
      `, [adminUserId, targetAdminEmail]);
    } else {
      adminUserId = adminUserRow.rows[0].id;
      await db.pool.query(`
        UPDATE "user" SET role = 'admin', name = 'Admin Sarah Jenkins' WHERE id = $1
      `, [adminUserId]);
    }

    // Insert or update credential account
    const accCheck = await db.pool.query('SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = \'credential\'', [adminUserId]);
    if (accCheck.rows.length === 0) {
      const accId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())
      `, [accId, adminUserId, targetAdminEmail, passwordHash]);
    } else {
      await db.pool.query(`
        UPDATE "account" SET password = $1, "updatedAt" = NOW() WHERE id = $2
      `, [passwordHash, accCheck.rows[0].id]);
    }

    console.log(`✅ Admin migration complete! Only "${targetAdminEmail}" has admin access in the database.`);
  } catch (err) {
    console.error('❌ Admin migration error:', err);
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_admin_email.js')) {
  migrateAdminEmail().then(() => process.exit(0));
}
