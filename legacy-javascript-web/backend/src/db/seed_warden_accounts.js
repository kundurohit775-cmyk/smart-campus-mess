import bcrypt from 'bcryptjs';
import db from './database.js';

export const WARDEN_ACCOUNTS = [
  {
    name: "Warden Block A",
    email: "warden.blocka@vitstudent.ac.in",
    password: "WardenA@2026!",
    assignedBlock: "Block A",
    phone: "9876500001"
  },
  {
    name: "Warden Block B",
    email: "warden.blockb@vitstudent.ac.in",
    password: "WardenB@2026!",
    assignedBlock: "Block B",
    phone: "9876500002"
  },
  {
    name: "Warden Block C",
    email: "warden.blockc@vitstudent.ac.in",
    password: "WardenC@2026!",
    assignedBlock: "Block C",
    phone: "9876500003"
  },
  {
    name: "Warden Block D",
    email: "warden.blockd@vitstudent.ac.in",
    password: "WardenD@2026!",
    assignedBlock: "Block D",
    phone: "9876500004"
  }
];

export async function seedWardenAccounts() {
  console.log('🔄 Creating & Provisioning Hostel Block Warden Accounts...\n');

  try {
    // 1. Ensure wardens table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS wardens (
        warden_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        assigned_hostel_block VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Insert or update each requested warden account
    for (const w of WARDEN_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(w.password, 10);

      await db.query(`
        INSERT INTO wardens (name, email, password_hash, phone, assigned_hostel_block)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          assigned_hostel_block = EXCLUDED.assigned_hostel_block,
          phone = EXCLUDED.phone
      `, [w.name, w.email.toLowerCase(), passwordHash, w.phone, w.assignedBlock]);

      console.log(`✅ Provisioned: ${w.email} (Block: ${w.assignedBlock})`);
    }

    // 3. Verify accounts in database
    console.log('\n🔍 Verifying Password Hashes & Login Authentication...');
    for (const w of WARDEN_ACCOUNTS) {
      const row = await db.get('SELECT warden_id, name, email, password_hash, assigned_hostel_block FROM wardens WHERE email = ?', w.email.toLowerCase());
      if (!row) {
        throw new Error(`Failed to find warden ${w.email} in database after seeding.`);
      }
      const isMatch = await bcrypt.compare(w.password, row.password_hash);
      if (!isMatch) {
        throw new Error(`Password verification failed for ${w.email}`);
      }
      console.log(`   ✓ ${w.email} -> Verified with bcrypt (ID: ${row.warden_id}, Block: ${row.assigned_hostel_block})`);
    }

    console.log('\n🎉 ALL 4 WARDEN ACCOUNTS SUCCESSFULLY CREATED & VERIFIED! 🚀\n');
  } catch (err) {
    console.error('❌ Error seeding warden accounts:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed_warden_accounts.js')) {
  seedWardenAccounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
