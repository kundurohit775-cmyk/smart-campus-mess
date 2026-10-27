import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function updateBetterAuthSchema() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('🐘 Updating Better Auth columns in Neon PostgreSQL...');
    await client.query('BEGIN');

    // Add optional columns to account table
    await client.query(`
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;
    `);

    // Add optional columns to user table if missing
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP;
    `);

    // Add optional columns to session table if missing
    await client.query(`
      ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;
    `);

    await client.query('COMMIT');
    console.log('✅ Added missing columns ("issuer", "idToken") to Better Auth tables in Neon PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating columns:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateBetterAuthSchema();
