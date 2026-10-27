import db from './database.js';

export async function migrateSickLeave() {
  console.log('🔄 Running Sick Leave & Hostel Delivery database migration...');

  try {
    // 1. Create health_requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS health_requests (
        request_id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        hostel_name VARCHAR(100) NOT NULL,
        room_number VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        warden_email VARCHAR(255) NOT NULL,
        warden_name VARCHAR(255),
        approval_token VARCHAR(128) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
      );
    `);
    console.log('✅ Checked/Created "health_requests" table');

    // 2. Add indices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_health_requests_student ON health_requests(student_id, requested_date);
      CREATE INDEX IF NOT EXISTS idx_health_requests_token ON health_requests(approval_token);
    `);
    console.log('✅ Checked/Created indices for "health_requests"');

    // 3. Add delivery columns to orders table if not exists
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='delivery_type'
        ) THEN
          ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(50) DEFAULT 'self-pickup';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='health_request_id'
        ) THEN
          ALTER TABLE orders ADD COLUMN health_request_id INT REFERENCES health_requests(request_id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='approval_status'
        ) THEN
          ALTER TABLE orders ADD COLUMN approval_status VARCHAR(50) DEFAULT 'not-applicable';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='delivery_address'
        ) THEN
          ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(255) DEFAULT NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Checked/Added delivery columns to "orders" table');

    console.log('🎉 Sick Leave & Hostel Delivery Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_sick_leave.js')) {
  migrateSickLeave()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
