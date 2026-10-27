import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function initBetterAuthTables() {
  console.log('🐘 Initializing Better Auth schema tables in Neon PostgreSQL...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create "user" table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "role" TEXT DEFAULT 'student',
        "roomNumber" TEXT,
        "phone" TEXT
      );
    `);

    // Create "session" table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "token" TEXT UNIQUE NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create "account" table (for email/password and providers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create "verification" table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Better Auth schema tables ("user", "session", "account", "verification") successfully initialized in Neon!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize Better Auth tables in Neon:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initBetterAuthTables();
