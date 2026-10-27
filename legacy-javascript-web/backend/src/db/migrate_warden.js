import bcrypt from 'bcryptjs';
import db from './database.js';

export async function migrateWardens() {
  console.log('🔄 Running Warden role & schema database migration...');

  try {
    // 1. Create wardens table
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
    console.log('✅ Checked/Created "wardens" table');

    // 2. Add reviewed_by, reviewed_at, rejection_reason to health_requests if missing
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='health_requests' AND column_name='reviewed_by'
        ) THEN
          ALTER TABLE health_requests ADD COLUMN reviewed_by INT DEFAULT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='health_requests' AND column_name='reviewed_at'
        ) THEN
          ALTER TABLE health_requests ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='health_requests' AND column_name='rejection_reason'
        ) THEN
          ALTER TABLE health_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Updated "health_requests" columns (reviewed_by, reviewed_at, rejection_reason)');

    // 3. Seed Default Wardens
    const initialWardens = [
      { name: "Warden Block A", email: "warden.blocka@vitstudent.ac.in", password: "WardenA@2026!", block: "Block A", phone: "9876500001" },
      { name: "Warden Block B", email: "warden.blockb@vitstudent.ac.in", password: "WardenB@2026!", block: "Block B", phone: "9876500002" },
      { name: "Warden Block C", email: "warden.blockc@vitstudent.ac.in", password: "WardenC@2026!", block: "Block C", phone: "9876500003" },
      { name: "Warden Block D", email: "warden.blockd@vitstudent.ac.in", password: "WardenD@2026!", block: "Block D", phone: "9876500004" }
    ];

    for (const w of initialWardens) {
      const passwordHash = await bcrypt.hash(w.password, 10);
      await db.query(`
        INSERT INTO wardens (name, email, password_hash, phone, assigned_hostel_block)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          assigned_hostel_block = EXCLUDED.assigned_hostel_block,
          password_hash = EXCLUDED.password_hash
      `, [w.name, w.email.toLowerCase(), passwordHash, w.phone, w.block]);
    }
    console.log(`✅ Seeded ${initialWardens.length} block wardens`);

    // 4. Create indices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wardens_email ON wardens(email);
      CREATE INDEX IF NOT EXISTS idx_health_requests_hostel ON health_requests(hostel_name);
      CREATE INDEX IF NOT EXISTS idx_health_requests_status ON health_requests(status);
    `);
    console.log('✅ Checked/Created indices for "wardens" and "health_requests"');

    console.log('🎉 Warden Schema Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Warden Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_warden.js')) {
  migrateWardens()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
