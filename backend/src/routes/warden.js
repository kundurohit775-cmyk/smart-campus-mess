import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import db from '../db/database.js';

const router = express.Router();

// Middleware: Require Warden role
const requireWarden = (req, res, next) => {
  if (req.user?.role !== 'warden') {
    return res.status(403).json({ error: 'Access denied: Warden authorization required.' });
  }
  next();
};

// Helper to build accurate block SQL conditions
const buildBlockFilter = (selectedBlock, fieldPrefix = '', startParamIdx = 1) => {
  const cleanBlock = selectedBlock.trim();
  const isLadies = /ladies/i.test(cleanBlock) || /^lh/i.test(cleanBlock);
  const blockLetterMatch = cleanBlock.match(/(?:Block|LH)[\s-]*([A-Z0-9]+)/i) || cleanBlock.match(/\b([A-D])\b/i);
  const letter = blockLetterMatch ? blockLetterMatch[1].toLowerCase() : null;

  if (letter && isLadies) {
    const p1 = `$${startParamIdx}`;
    const p2 = `$${startParamIdx + 1}`;
    return {
      sql: `(LOWER(${fieldPrefix}hostel_name) = LOWER(${p1}) OR (LOWER(${fieldPrefix}hostel_name) LIKE '%ladies%' AND LOWER(${fieldPrefix}hostel_name) LIKE ${p2}))`,
      params: [cleanBlock, `%${letter}%`]
    };
  } else if (letter) {
    const p1 = `$${startParamIdx}`;
    const p2 = `$${startParamIdx + 1}`;
    const p3 = `$${startParamIdx + 2}`;
    return {
      sql: `(LOWER(${fieldPrefix}hostel_name) = LOWER(${p1}) OR (LOWER(${fieldPrefix}hostel_name) NOT LIKE '%ladies%' AND (LOWER(${fieldPrefix}hostel_name) LIKE ${p2} OR LOWER(${fieldPrefix}hostel_name) LIKE ${p3})))`,
      params: [cleanBlock, `%block ${letter}%`, `%block-${letter}%`]
    };
  } else {
    const p1 = `$${startParamIdx}`;
    return {
      sql: `LOWER(${fieldPrefix}hostel_name) LIKE ${p1}`,
      params: [`%${cleanBlock.toLowerCase()}%`]
    };
  }
};

/**
 * GET /api/warden/stats
 * Summary stats for the selected hostel block (or all blocks)
 * Query: ?block=Men's Hostel Block A or ?block=ALL
 */
router.get('/stats', authenticateToken, requireWarden, async (req, res, next) => {
  try {
    const wardenId = req.user.id;
    const warden = await db.get('SELECT name FROM wardens WHERE warden_id = ?', wardenId);
    
    // Query param block takes precedence over user default
    const selectedBlock = req.query.block || req.query.hostel_block || req.query.hostelName;

    let whereClause = '';
    let params = [];

    if (selectedBlock && selectedBlock !== 'ALL' && selectedBlock !== 'all') {
      const filter = buildBlockFilter(selectedBlock, '', 1);
      whereClause = `WHERE ${filter.sql}`;
      params = filter.params;
    }

    const statsRes = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' AND requested_date = CURRENT_DATE THEN 1 END) as approved_today_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(request_id) as total_count
      FROM health_requests
      ${whereClause}
    `, params);

    const row = statsRes.rows[0] || {};
    res.json({
      selectedBlock: selectedBlock || 'ALL',
      wardenName: warden?.name || req.user.name,
      pendingCount: parseInt(row.pending_count || 0, 10),
      approvedTodayCount: parseInt(row.approved_today_count || 0, 10),
      rejectedCount: parseInt(row.rejected_count || 0, 10),
      totalCount: parseInt(row.total_count || 0, 10)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/warden/requests
 * Requests for the selected hostel block (or all blocks)
 * Query: ?block=Men's Hostel Block A&status=pending
 */
router.get('/requests', authenticateToken, requireWarden, async (req, res, next) => {
  try {
    const selectedBlock = req.query.block || req.query.hostel_block || req.query.hostelName;
    const { status } = req.query; // 'pending' | 'reviewed' | 'approved' | 'rejected' | undefined
    
    const conditions = [];
    let params = [];

    if (selectedBlock && selectedBlock !== 'ALL' && selectedBlock !== 'all') {
      const filter = buildBlockFilter(selectedBlock, 'h.', params.length + 1);
      conditions.push(filter.sql);
      params.push(...filter.params);
    }

    if (status === 'pending') {
      conditions.push("h.status = 'pending'");
    } else if (status === 'reviewed') {
      conditions.push("h.status IN ('approved', 'rejected')");
    } else if (status === 'approved' || status === 'rejected') {
      params.push(status);
      conditions.push(`h.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        h.request_id,
        h.student_id,
        h.hostel_name,
        h.room_number,
        h.reason,
        h.requested_date,
        h.status,
        h.reviewed_by,
        h.reviewed_at,
        h.rejection_reason,
        h.created_at,
        h.responded_at,
        s.name as student_name,
        s.email as student_email,
        s.phone as student_phone
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      ${whereClause}
      ORDER BY 
        CASE WHEN h.status = 'pending' THEN 0 ELSE 1 END,
        h.request_id DESC
    `;

    const result = await db.query(query, params);
    res.json({
      selectedBlock: selectedBlock || 'ALL',
      requests: result.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/warden/requests/:id/approve
 * Approves student sick leave request and unlocks hostel room delivery
 */
router.post('/requests/:id/approve', authenticateToken, requireWarden, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const wardenId = req.user.id;

    // Check request exists
    const checkRes = await db.query(`
      SELECT h.*, s.name as student_name, s.email as student_email
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE h.request_id = $1
    `, [requestId]);

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Sick leave request not found.' });
    }

    const request = checkRes.rows[0];

    // Update status to approved
    const updateRes = await db.query(`
      UPDATE health_requests
      SET 
        status = 'approved',
        reviewed_by = $1,
        reviewed_at = NOW(),
        responded_at = NOW()
      WHERE request_id = $2
      RETURNING *
    `, [wardenId, requestId]);

    console.log(`\n✅ SICK LEAVE APPROVED IN-APP: Request #${requestId} for ${request.student_name} approved by Warden #${wardenId}`);

    res.json({
      message: `Sick leave delivery request for ${request.student_name} has been approved!`,
      request: updateRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/warden/requests/:id/reject
 * Rejects student sick leave request with reason
 */
router.post('/requests/:id/reject', authenticateToken, requireWarden, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const wardenId = req.user.id;
    const { reason } = req.body;

    const rejectionReason = reason && reason.trim() ? reason.trim() : 'Request not approved by hostel warden.';

    // Check request exists
    const checkRes = await db.query(`
      SELECT h.*, s.name as student_name, s.email as student_email
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE h.request_id = $1
    `, [requestId]);

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Sick leave request not found.' });
    }

    const request = checkRes.rows[0];

    // Update status to rejected
    const updateRes = await db.query(`
      UPDATE health_requests
      SET 
        status = 'rejected',
        reviewed_by = $1,
        reviewed_at = NOW(),
        responded_at = NOW(),
        rejection_reason = $2
      WHERE request_id = $3
      RETURNING *
    `, [wardenId, rejectionReason, requestId]);

    console.log(`\n❌ SICK LEAVE REJECTED IN-APP: Request #${requestId} for ${request.student_name} rejected by Warden #${wardenId}. Reason: "${rejectionReason}"`);

    res.json({
      message: `Sick leave delivery request for ${request.student_name} has been rejected.`,
      request: updateRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

export default router;
