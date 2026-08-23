import jwt from 'jsonwebtoken';
import pg from 'pg';
import { auth } from '../auth.js';
import { config } from '../config/config.js';
import db from '../db/database.js';

let pgPool = null;
if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.includes('sample_pass')) {
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
}

export async function authenticateToken(req, res, next) {
  try {
    // 1. Try Better Auth Session retrieval via headers
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });

      if (session && session.user) {
        req.user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || 'student',
          roomNumber: session.user.roomNumber || '',
          phone: session.user.phone || ''
        };
        return next();
      }
    } catch {
      // continue to next method
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // 2. Try looking up Better Auth session in PostgreSQL
      if (pgPool) {
        try {
          const sessionQuery = `
            SELECT s."userId", s."expiresAt", u.name, u.email, u.role, u."roomNumber", u.phone
            FROM "session" s
            JOIN "user" u ON s."userId" = u.id
            WHERE s.token = $1 AND s."expiresAt" > NOW()
          `;
          const sRes = await pgPool.query(sessionQuery, [token]);
          if (sRes.rows.length > 0) {
            const user = sRes.rows[0];
            req.user = {
              id: user.userId,
              name: user.name,
              email: user.email,
              role: user.role || 'student',
              roomNumber: user.roomNumber || '',
              phone: user.phone || ''
            };
            return next();
          }
        } catch (e) {
          // ignore and continue
        }
      }

      // 3. Try JWT verification
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        if (decoded && decoded.role) {
          req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            roomNumber: decoded.roomNumber || ''
          };
          return next();
        }
      } catch {
        // continue
      }

      // 4. Try looking up student in local DB
      const student = db.prepare('SELECT student_id, name, email, room_number, status FROM students WHERE student_id = ? OR email = ?').get(token, token);
      if (student && student.status === 'active') {
        req.user = {
          id: student.student_id,
          name: student.name,
          email: student.email,
          roomNumber: student.room_number,
          role: 'student'
        };
        return next();
      }

      const admin = db.prepare('SELECT admin_id, name, email, role FROM admins WHERE admin_id = ? OR email = ?').get(token, token);
      if (admin) {
        req.user = {
          id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        };
        return next();
      }
    }

    return res.status(401).json({ error: 'Unauthorized: Valid authentication required.' });
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
    }
    next();
  };
}
