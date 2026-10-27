import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testNeon() {
  console.log('🐘 Testing live connection to Neon PostgreSQL...');
  console.log(`URL Host: ${process.env.DATABASE_URL.split('@')[1]}`);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT NOW() as now, current_database() as db_name, version() as ver');
    console.log('✅ Connected to Neon successfully!');
    console.log(`   Database: ${res.rows[0].db_name}`);
    console.log(`   Server Time: ${res.rows[0].now}`);
    console.log(`   PostgreSQL Version: ${res.rows[0].ver.split(' ')[0]} ${res.rows[0].ver.split(' ')[1]}`);

    // Apply mess schema (CREATE TABLE IF NOT EXISTS)
    console.log('\n📄 Initializing Postgres schema (CREATE TABLE IF NOT EXISTS)...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../src/db/postgres_schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Schema tables verified in Neon database!');

    // Check menu items count in Neon
    const menuCount = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    console.log(`   Menu items in Neon DB: ${menuCount.rows[0].count}`);

    await pool.end();
    console.log('\n🎉 Neon PostgreSQL connection & initialization verified successfully!');
  } catch (err) {
    console.error('❌ Neon connection error:', err);
    process.exit(1);
  }
}

testNeon();
