import { betterAuth } from 'better-auth';
import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure database for Better Auth
let authDatabase;

if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.includes('sample_pass')) {
  // Production / Remote Neon PostgreSQL
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  pool.on('error', (err) => {
    console.warn('⚠️ Better Auth PG pool error (non-fatal):', err.message);
  });
  authDatabase = pool;
} else {
  // Local SQLite database fallback
  const dbFile = path.resolve(__dirname, '../mess_management.db');
  authDatabase = new Database(dbFile);
}

export const auth = betterAuth({
  database: authDatabase,
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5050',
    'http://127.0.0.1:5050'
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'student',
        input: true
      },
      roomNumber: {
        type: 'string',
        required: false,
        input: true
      },
      phone: {
        type: 'string',
        required: false,
        input: true
      }
    }
  }
});
