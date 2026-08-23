import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pg from 'pg';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { config } from './config/config.js';
import db from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { syncSqliteFromNeon } from './db/sync_sqlite_from_neon.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import creditsRoutes from './routes/credits.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5050',
  'http://127.0.0.1:5050'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

// Validate VIT student email for student registration before Better Auth processing
app.post('/api/auth/sign-up/email', express.json(), (req, res, next) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const role = req.body?.role || 'student';
  if (role === 'student' && !email.endsWith('@vitstudent.ac.in')) {
    return res.status(400).json({
      error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
    });
  }
  next();
});

// Validate VIT student email for student sign-in before Better Auth processing
app.post('/api/auth/sign-in/email', express.json(), (req, res, next) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  
  // Exempt admin and chef accounts
  const admin = db.prepare('SELECT admin_id FROM admins WHERE LOWER(email) = ?').get(email);
  if (admin) {
    return next();
  }

  // Student accounts MUST end with @vitstudent.ac.in
  if (!email.endsWith('@vitstudent.ac.in')) {
    return res.status(403).json({
      error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.'
    });
  }
  next();
});

// Mount Better Auth handler for /api/auth routes
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let neonStatus = 'disconnected';
  let neonInfo = null;

  if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://')) {
    try {
      const pool = new pg.Pool({
        connectionString: config.databaseUrl,
        ssl: { rejectUnauthorized: false }
      });
      const check = await pool.query('SELECT current_database() as db, version() as ver, COUNT(*) as dishes FROM menu_items');
      neonStatus = 'connected';
      neonInfo = {
        database: check.rows[0].db,
        postgresVersion: check.rows[0].ver.split(' ')[0] + ' ' + check.rows[0].ver.split(' ')[1],
        menuItemsCount: parseInt(check.rows[0].dishes, 10)
      };
      await pool.end();
    } catch (e) {
      neonStatus = `error: ${e.message}`;
    }
  }

  res.json({
    status: 'online',
    app: 'Smart Campus Mess Management System',
    authProvider: 'Better Auth',
    neonPostgreSQL: {
      status: neonStatus,
      info: neonInfo
    },
    betterAuthUrl: config.betterAuthUrl,
    timestamp: new Date().toISOString()
  });
});

// Mount Application Routes
app.use('/api/auth-helpers', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Central Error Handler
app.use(errorHandler);

// Database initialization and Startup
async function initializeAndStart() {
  try {
    console.log('----------------------------------------------------');
    console.log('🔄 INITIALIZING SMART CAMPUS MESS API SERVER...');
    console.log('----------------------------------------------------');

    // 1. Check & Verify Live Neon PostgreSQL Connection and sync
    if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://')) {
      try {
        const pool = new pg.Pool({
          connectionString: config.databaseUrl,
          ssl: { rejectUnauthorized: false }
        });
        const res = await pool.query('SELECT NOW() as now, current_database() as db, version() as ver');
        const dishCount = await pool.query('SELECT COUNT(*) as count FROM menu_items');
        console.log('🐘 Live Neon PostgreSQL Connection: ✅ CONNECTED');
        console.log(`   Database: ${res.rows[0].db}`);
        console.log(`   PostgreSQL Version: ${res.rows[0].ver.split(' ')[0]} ${res.rows[0].ver.split(' ')[1]}`);
        console.log(`   Neon Menu Dishes Loaded: ${dishCount.rows[0].count}`);
        await pool.end();

        // Sync Neon items to local SQLite for instant cross-compatibility
        await syncSqliteFromNeon();
      } catch (neonErr) {
        console.warn('⚠️ Neon PostgreSQL connection check error:', neonErr.message);
      }
    }

    // 2. Initialize Local Storage Fallback & Seed if needed
    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    if (studentCount === 0) {
      console.log('📦 Database is empty. Running initial seed...');
      await seedDatabase();
    }

    const server = app.listen(config.port, () => {
      console.log(`🚀 API Server listening on: http://localhost:${config.port}`);
      console.log(`🛡️ Better Auth URL: ${config.betterAuthUrl}`);
      console.log('----------------------------------------------------');
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

initializeAndStart();

export default app;
