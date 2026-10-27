import bcrypt from 'bcryptjs';
import db from './database.js';
import { config } from '../config/config.js';

export async function migrateChefEmail() {
  console.log('🔄 Running Chef Email Database Migration...');
  const targetChefEmail = (process.env.CHEF_EMAIL || config.chefEmail || '').trim().toLowerCase();
  if (!targetChefEmail) {
    console.warn('⚠️ No CHEF_EMAIL provided in environment variables. Skipping chef record migration.');
    return;
  }

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Demote or delete old chef accounts in admins table
    await db.pool.query(`
      DELETE FROM admins WHERE role = 'chef' AND LOWER(email) != $1
    `, [targetChefEmail]);

    // 2. Insert or update the authorized chef in admins table
    await db.pool.query(`
      INSERT INTO admins (name, email, password_hash, role)
      VALUES ('Head Chef Marco Rossi', $1, $2, 'chef')
      ON CONFLICT (email) DO UPDATE 
      SET role = 'chef', password_hash = $2, name = 'Head Chef Marco Rossi'
    `, [targetChefEmail, passwordHash]);

    // 3. Demote or delete old chef accounts in Better Auth "user" table
    await db.pool.query(`
      UPDATE "user" SET role = 'student' 
      WHERE role = 'chef' AND LOWER(email) != $1
    `, [targetChefEmail]);

    // 4. Provision or update Better Auth "user" and "account" tables for targetChefEmail
    const chefUserRow = await db.pool.query('SELECT id FROM "user" WHERE LOWER(email) = $1', [targetChefEmail]);
    let chefUserId;
    if (chefUserRow.rows.length === 0) {
      chefUserId = `chef_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "roomNumber", phone)
        VALUES ($1, 'Head Chef Marco Rossi', $2, TRUE, NOW(), NOW(), 'chef', 'Kitchen HQ', '+91-9876500000')
      `, [chefUserId, targetChefEmail]);
    } else {
      chefUserId = chefUserRow.rows[0].id;
      await db.pool.query(`
        UPDATE "user" SET role = 'chef', name = 'Head Chef Marco Rossi' WHERE id = $1
      `, [chefUserId]);
    }

    // Insert or update credential account
    const accCheck = await db.pool.query('SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = \'credential\'', [chefUserId]);
    if (accCheck.rows.length === 0) {
      const accId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.pool.query(`
        INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())
      `, [accId, chefUserId, targetChefEmail, passwordHash]);
    } else {
      await db.pool.query(`
        UPDATE "account" SET password = $1, "updatedAt" = NOW() WHERE id = $2
      `, [passwordHash, accCheck.rows[0].id]);
    }

    console.log(`✅ Chef migration complete! Only "${targetChefEmail}" has chef access in the database.`);
  } catch (err) {
    console.error('❌ Chef migration error:', err);
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_chef_email.js')) {
  migrateChefEmail().then(() => process.exit(0));
}
