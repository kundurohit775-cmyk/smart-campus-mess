import jwt from 'jsonwebtoken';
import { auth } from '../auth.js';
import { config } from '../config/config.js';
import db from '../db/database.js';

/**
 * Normalizes role to ensure ONLY the environment-configured CHEF_EMAIL can ever have the 'chef' role.
 */
function sanitizeRole(role, email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const configuredChefEmail = (config.chefEmail || '').trim().toLowerCase();
  const isChef = Boolean(configuredChefEmail) && cleanEmail === configuredChefEmail;

  if (isChef) {
    return 'chef';
  }
  // If role is set to chef on an unauthorized email, demote to student
  if (role === 'chef') {
    return 'student';
  }
  return role || 'student';
}

export async function authenticateToken(req, res, next) {
  try {
    // 1. Try Better Auth Session retrieval via headers
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });

      if (session && session.user) {
        const effectiveRole = sanitizeRole(session.user.role, session.user.email);
        req.user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: effectiveRole,
          isChef: effectiveRole === 'chef',
          isAdmin: effectiveRole === 'admin',
          isStudent: effectiveRole === 'student',
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
      try {
        const sessionQuery = `
          SELECT s."userId", s."expiresAt", u.name, u.email, u.role, u."roomNumber", u.phone
          FROM "session" s
          JOIN "user" u ON s."userId" = u.id
          WHERE s.token = $1 AND s."expiresAt" > NOW()
        `;
        const sRes = await db.pool.query(sessionQuery, [token]);
        if (sRes.rows.length > 0) {
          const user = sRes.rows[0];
          const effectiveRole = sanitizeRole(user.role, user.email);
          req.user = {
            id: user.userId,
            name: user.name,
            email: user.email,
            role: effectiveRole,
            isChef: effectiveRole === 'chef',
            isAdmin: effectiveRole === 'admin',
            isStudent: effectiveRole === 'student',
            roomNumber: user.roomNumber || '',
            phone: user.phone || ''
          };
          return next();
        }
      } catch {
        // continue
      }

      // 3. Try JWT verification
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        if (decoded && (decoded.role || decoded.email)) {
          const effectiveRole = sanitizeRole(decoded.role, decoded.email);
          req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: effectiveRole,
            isChef: effectiveRole === 'chef',
            isAdmin: effectiveRole === 'admin',
            isStudent: effectiveRole === 'student',
            roomNumber: decoded.roomNumber || ''
          };
          return next();
        }
      } catch {
        // continue
      }

      // 4. Try looking up in admins table
      const admin = await db.get('SELECT admin_id, name, email, role FROM admins WHERE admin_id = ? OR email = ?', token, token);
      if (admin) {
        const effectiveRole = sanitizeRole(admin.role, admin.email);
        req.user = {
          id: admin.admin_id,
          name: admin.name,
          email: admin.email,
          role: effectiveRole,
          isChef: effectiveRole === 'chef',
          isAdmin: effectiveRole === 'admin',
          isStudent: effectiveRole === 'student'
        };
        return next();
      }

      // 5. Try looking up student in PostgreSQL
      const student = await db.get('SELECT student_id, name, email, room_number, status FROM students WHERE student_id = ? OR email = ?', token, token);
      if (student && student.status === 'active') {
        req.user = {
          id: student.student_id,
          name: student.name,
          email: student.email,
          roomNumber: student.room_number,
          role: 'student',
          isChef: false,
          isAdmin: false,
          isStudent: true
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

/**
 * Role-gating middleware with strict single-email enforcement for chef role.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }

    const cleanEmail = (req.user.email || '').trim().toLowerCase();
    const configuredChefEmail = (config.chefEmail || '').trim().toLowerCase();
    const isChef = Boolean(configuredChefEmail) && cleanEmail === configuredChefEmail;

    // If endpoint requires chef access:
    if (allowedRoles.includes('chef')) {
      const isAdmin = req.user.role === 'admin';
      if (isChef || (allowedRoles.includes('admin') && isAdmin)) {
        return next();
      }
      return res.status(403).json({
        error: 'Forbidden: Chef access is restricted to authorized chef accounts.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
}
