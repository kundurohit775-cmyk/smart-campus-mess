import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sickLeaveService, HOSTEL_WARDEN_DIRECTORY } from '../services/sickLeaveService.js';
import db from '../db/database.js';

const router = express.Router();

/**
 * GET /api/sick-leave/action
 * Public one-click endpoint for Hostel Warden to Approve or Reject a sick leave request.
 * Does not require app login. Validates single-use approval_token.
 */
router.get('/action', async (req, res, next) => {
  try {
    const { id, action, token } = req.query;

    if (!id || !action || !token) {
      return res.status(400).send(
        sickLeaveService.renderHtmlResponse({
          title: 'Invalid Request',
          status: 'error',
          heading: 'Missing Authorization Parameters',
          message: 'The link you clicked is incomplete or missing required parameters.'
        })
      );
    }

    const html = await sickLeaveService.handleWardenAction(id, action, token);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/sick-leave/request
 * Authenticated student submits a sick leave request for hostel room delivery.
 */
router.post('/request', authenticateToken, async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { hostelName, roomNumber, reason, requestedDate } = req.body;

    const result = await sickLeaveService.createRequest(studentId, {
      hostelName: hostelName || req.user.hostelName || "Men's Hostel Block A",
      roomNumber: roomNumber || req.user.roomNumber,
      reason,
      requestedDate
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to submit sick leave request.' });
  }
});

/**
 * GET /api/sick-leave/my-status
 * Authenticated student checks active sick leave request status for today or a specific date.
 */
router.get('/my-status', authenticateToken, async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const date = req.query.date;

    const status = await sickLeaveService.getStudentStatus(studentId, date);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sick-leave/hostels
 * Returns list of supported hostel blocks and warden mappings
 */
router.get('/hostels', (req, res) => {
  res.json({
    hostels: Object.keys(HOSTEL_WARDEN_DIRECTORY),
    directory: HOSTEL_WARDEN_DIRECTORY
  });
});

/**
 * GET /api/sick-leave/admin/all
 * Admin / Chef overview of all sick leave applications
 */
router.get('/admin/all', authenticateToken, requireRole('admin', 'chef'), async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT h.*, s.name as student_name, s.email as student_email, s.phone as student_phone
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      ORDER BY h.request_id DESC
      LIMIT 100
    `);
    res.json({ requests: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
