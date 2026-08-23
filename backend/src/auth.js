import { betterAuth } from 'better-auth';
import pg from 'pg';
import { config } from './config/config.js';

// Configure PostgreSQL pool for Better Auth
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.warn('⚠️ Better Auth PG pool error (non-fatal):', err.message);
});

export const auth = betterAuth({
  database: pool,
  secret: config.betterAuthSecret,
  baseURL: process.env.BETTER_AUTH_URL || config.betterAuthUrl || 'http://localhost:5050',
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5050',
    'http://127.0.0.1:5050',
    'https://smart-campus-mess.onrender.com',
    'https://*.onrender.com',
    'https://*.vercel.app',
    'https://*.netlify.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/+$/, '')] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL.replace(/\/+$/, '')] : [])
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
