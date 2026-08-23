import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { config } from './config/config.js';
import db from './db/database.js';
import { seedPostgres } from './db/seed_postgres.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import creditsRoutes from './routes/credits.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middlewares & CORS
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
      callback(null, true); // Permissive for production & preview domains
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
  const configuredChef = (config.chefEmail || '').trim().toLowerCase();
  if (role === 'chef' && (!configuredChef || email !== configuredChef)) {
    return res.status(403).json({
      error: 'Forbidden: Chef registration is restricted.'
    });
  }
  if (role === 'student' && !email.endsWith('@vitstudent.ac.in')) {
    return res.status(400).json({
      error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.'
    });
  }
  next();
});

// Validate VIT student email for student sign-in before Better Auth processing
app.post('/api/auth/sign-in/email', express.json(), async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const configuredChef = (config.chefEmail || '').trim().toLowerCase();
    const isChef = Boolean(configuredChef) && email === configuredChef;
    
    // Exempt admin and authorized chef accounts
    const admin = await db.get('SELECT admin_id, role FROM admins WHERE LOWER(email) = ?', email);
    if (admin) {
      if (admin.role === 'chef' && !isChef) {
        return res.status(403).json({
          error: 'Forbidden: Chef access is restricted.'
        });
      }
      return next();
    }

    if (isChef) {
      return next();
    }

    // Student accounts MUST end with @vitstudent.ac.in
    if (!email.endsWith('@vitstudent.ac.in')) {
      return res.status(403).json({
        error: 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.'
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Mount Better Auth handler for /api/auth routes
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let neonStatus = 'disconnected';
  let neonInfo = null;

  try {
    const check = await db.query('SELECT current_database() as db, version() as ver, COUNT(*) as dishes FROM menu_items');
    neonStatus = 'connected';
    neonInfo = {
      database: check.rows[0].db,
      postgresVersion: check.rows[0].ver.split(' ')[0] + ' ' + check.rows[0].ver.split(' ')[1],
      menuItemsCount: parseInt(check.rows[0].dishes, 10)
    };
  } catch (e) {
    neonStatus = `error: ${e.message}`;
  }

  res.json({
    status: 'online',
    app: 'Smart Campus Mess Management System',
    authProvider: 'Better Auth',
    database: 'Neon PostgreSQL',
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

    // 1. Verify Live Neon PostgreSQL Connection
    const res = await db.query('SELECT NOW() as now, current_database() as db, version() as ver');
    const dishCount = await db.query('SELECT COUNT(*) as count FROM menu_items');
    console.log('🐘 Live Neon PostgreSQL: ✅ CONNECTED');
    console.log(`   Database: ${res.rows[0].db}`);
    console.log(`   Version: ${res.rows[0].ver.split(' ')[0]} ${res.rows[0].ver.split(' ')[1]}`);
    console.log(`   Menu Dishes in DB: ${dishCount.rows[0].count}`);

    // 2. Ensure initial seed data exists in Neon PostgreSQL
    if (parseInt(dishCount.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial Neon PostgreSQL dishes and demo accounts...');
      await seedPostgres();
    }

    const port = process.env.PORT || config.port || 5050;
    const server = app.listen(port, () => {
      console.log(`🚀 API Server listening on: http://localhost:${port}`);
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
