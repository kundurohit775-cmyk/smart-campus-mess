import crypto from 'crypto';
import db from '../db/database.js';
import { config } from '../config/config.js';

// Hostel Block to Warden Contact Mapping Directory
export const HOSTEL_WARDEN_DIRECTORY = {
  "Men's Hostel Block A": { name: "Dr. K. Sharma (Block A Warden)", email: "warden.blocka@vitstudent.ac.in" },
  "Men's Hostel Block B": { name: "Prof. R. Venkat (Block B Warden)", email: "warden.blockb@vitstudent.ac.in" },
  "Men's Hostel Block C": { name: "Dr. S. Reddy (Block C Warden)", email: "warden.blockc@vitstudent.ac.in" },
  "Men's Hostel Block D": { name: "Prof. M. Patel (Block D Warden)", email: "warden.blockd@vitstudent.ac.in" },
  "Ladies Hostel Block A": { name: "Dr. Ananya Iyer (LH-A Warden)", email: "warden.lha@vitstudent.ac.in" },
  "Ladies Hostel Block B": { name: "Prof. P. Lakshmi (LH-B Warden)", email: "warden.lhb@vitstudent.ac.in" },
  "Ladies Hostel Block C": { name: "Dr. S. Nambiar (LH-C Warden)", email: "warden.lhc@vitstudent.ac.in" }
};

export const DEFAULT_WARDEN = {
  name: "Hostel Chief Warden",
  email: process.env.WARDEN_EMAIL || "warden.hostel@vitstudent.ac.in"
};

export function resolveWarden(hostelName) {
  if (!hostelName) return DEFAULT_WARDEN;
  const match = Object.keys(HOSTEL_WARDEN_DIRECTORY).find(k => 
    k.toLowerCase().includes(hostelName.toLowerCase()) || hostelName.toLowerCase().includes(k.toLowerCase())
  );
  return match ? HOSTEL_WARDEN_DIRECTORY[match] : DEFAULT_WARDEN;
}

export const sickLeaveService = {
  /**
   * Submit a new Sick Leave / Health Request from a student
   */
  async createRequest(studentId, { hostelName, roomNumber, reason, requestedDate }) {
    const numStudentId = parseInt(studentId, 10);
    if (!hostelName || !roomNumber || !reason) {
      throw new Error('Hostel name, room number, and reason are required.');
    }

    const dateStr = requestedDate ? String(requestedDate).split('T')[0] : new Date().toISOString().split('T')[0];

    // Check if there is already an active pending or approved request for this date
    const existingRes = await db.query(`
      SELECT * FROM health_requests 
      WHERE student_id = $1 AND requested_date = $2 AND status IN ('pending', 'approved')
      ORDER BY request_id DESC LIMIT 1
    `, [numStudentId, dateStr]);

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      if (existing.status === 'approved') {
        return {
          request: existing,
          message: 'You already have an approved sick leave request for this date. Hostel delivery is unlocked!'
        };
      }
      return {
        request: existing,
        message: 'A sick leave request is already pending Warden approval for this date.'
      };
    }

    // Get student details
    const studentRes = await db.query('SELECT name, email, room_number FROM students WHERE student_id = $1', [numStudentId]);
    const student = studentRes.rows[0] || { name: 'Student', email: '', room_number: roomNumber };

    // Resolve Warden
    const warden = resolveWarden(hostelName);

    // Generate single-use secure crypto token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    const insertRes = await db.query(`
      INSERT INTO health_requests (
        student_id, hostel_name, room_number, reason, requested_date,
        status, warden_email, warden_name, approval_token
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
      RETURNING *
    `, [
      numStudentId,
      hostelName.trim(),
      roomNumber.trim(),
      reason.trim(),
      dateStr,
      warden.email,
      warden.name,
      approvalToken
    ]);

    const createdRequest = insertRes.rows[0];

    // Dispatch Warden Email with one-click Action links
    const baseUrl = process.env.VITE_BACKEND_URL || 'http://localhost:5050';
    const approveUrl = `${baseUrl}/api/sick-leave/action?id=${createdRequest.request_id}&action=approve&token=${approvalToken}`;
    const rejectUrl = `${baseUrl}/api/sick-leave/action?id=${createdRequest.request_id}&action=reject&token=${approvalToken}`;

    console.log('\n======================================================');
    console.log('📧 SICK LEAVE WARDEN APPROVAL EMAIL DISPATCHED');
    console.log(`To: ${warden.name} <${warden.email}>`);
    console.log(`Subject: [ACTION REQUIRED] Sick Leave Hostel Delivery Request - ${student.name} (${hostelName}, Room ${roomNumber})`);
    console.log(`Date Needed: ${dateStr}`);
    console.log(`Reason: ${reason}`);
    console.log('------------------------------------------------------');
    console.log(`👉 APPROVE LINK: ${approveUrl}`);
    console.log(`👉 REJECT LINK:  ${rejectUrl}`);
    console.log('======================================================\n');

    return {
      request: createdRequest,
      warden,
      approveUrl,
      rejectUrl,
      message: `Sick leave request submitted. An approval email has been dispatched to your Warden (${warden.name}).`
    };
  },

  /**
   * Process Warden one-click Approve or Reject action via email link
   */
  async handleWardenAction(requestId, action, token) {
    const numReqId = parseInt(requestId, 10);
    const cleanAction = (action || '').toLowerCase().trim();

    if (cleanAction !== 'approve' && cleanAction !== 'reject') {
      return this.renderHtmlResponse({
        title: 'Invalid Action',
        status: 'error',
        message: 'Action must be either "approve" or "reject".'
      });
    }

    const reqRes = await db.query(`
      SELECT h.*, s.name as student_name, s.email as student_email
      FROM health_requests h
      JOIN students s ON h.student_id = s.student_id
      WHERE h.request_id = $1
    `, [numReqId]);

    if (!reqRes.rows.length) {
      return this.renderHtmlResponse({
        title: 'Request Not Found',
        status: 'error',
        message: 'The requested sick leave application does not exist.'
      });
    }

    const request = reqRes.rows[0];

    // Single-use token verification & replay protection
    if (!request.approval_token || request.approval_token !== token) {
      const respondedDate = request.responded_at ? new Date(request.responded_at).toLocaleString() : 'earlier';
      const statusLabel = request.status === 'approved' ? 'Approved ✅' : request.status === 'rejected' ? 'Rejected ❌' : request.status;

      return this.renderHtmlResponse({
        title: 'Request Already Responded To',
        status: 'info',
        heading: 'Action Already Completed',
        message: `This sick leave request for <strong>${request.student_name}</strong> (${request.hostel_name}, Room ${request.room_number}) has already been responded to.<br/><br/>
                  Current Status: <strong>${statusLabel}</strong> (Recorded on ${respondedDate}).<br/>
                  No further action is required.`
      });
    }

    // Update status & invalidate token atomically
    const newStatus = cleanAction === 'approve' ? 'approved' : 'rejected';

    await db.query(`
      UPDATE health_requests 
      SET status = $1, responded_at = NOW(), approval_token = NULL
      WHERE request_id = $2
    `, [newStatus, numReqId]);

    if (newStatus === 'approved') {
      return this.renderHtmlResponse({
        title: 'Sick Leave Approved',
        status: 'success',
        heading: '✅ Request Approved Successfully',
        message: `Hostel room delivery has been <strong>approved</strong> for <strong>${request.student_name}</strong> in <strong>${request.hostel_name}, Room ${request.room_number}</strong> for <strong>${request.requested_date}</strong>.<br/><br/>
                  The student can now place mess meal orders with hostel room delivery for today.`
      });
    } else {
      return this.renderHtmlResponse({
        title: 'Sick Leave Rejected',
        status: 'rejected',
        heading: '❌ Request Rejected',
        message: `Sick leave hostel delivery request for <strong>${request.student_name}</strong> (${request.hostel_name}, Room ${request.room_number}) has been <strong>rejected</strong>.<br/><br/>
                  Hostel room delivery will remain locked for this date.`
      });
    }
  },

  /**
   * Get active sick leave status for a student on a given date
   */
  async getStudentStatus(studentId, date) {
    const numStudentId = parseInt(studentId, 10);
    const dateStr = date ? String(date).split('T')[0] : new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT * FROM health_requests 
      WHERE student_id = $1 AND requested_date = $2
      ORDER BY request_id DESC LIMIT 1
    `, [numStudentId, dateStr]);

    if (!result.rows.length) {
      return { hasRequest: false, status: null, isApproved: false };
    }

    const req = result.rows[0];
    return {
      hasRequest: true,
      requestId: req.request_id,
      status: req.status,
      isApproved: req.status === 'approved',
      isPending: req.status === 'pending',
      isRejected: req.status === 'rejected',
      hostelName: req.hostel_name,
      roomNumber: req.room_number,
      reason: req.reason,
      requestedDate: req.requested_date,
      wardenName: req.warden_name,
      wardenEmail: req.warden_email,
      rejectionReason: req.rejection_reason,
      createdAt: req.created_at,
      respondedAt: req.responded_at
    };
  },

  /**
   * Render on-brand, mobile-friendly HTML confirmation page for Warden
   */
  renderHtmlResponse({ title, status, heading, message }) {
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isRejected = status === 'rejected';

    const accentColor = isSuccess ? '#16A34A' : isRejected ? '#DC2626' : isError ? '#DC2626' : '#FF6B35';
    const iconBg = isSuccess ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FFF7F0';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - SmartMess Warden Portal</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #FAFAF9;
            color: #1E1B16;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .card {
            background: #FFFFFF;
            border: 1px solid rgba(30, 27, 22, 0.08);
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(30, 27, 22, 0.06);
            max-width: 480px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
          }
          .logo-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #FFF7F0;
            border: 1px solid rgba(255, 107, 53, 0.2);
            color: #FF6B35;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .icon-circle {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: ${iconBg};
            color: ${accentColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin: 0 auto 20px;
            border: 1px solid ${accentColor}30;
          }
          h1 {
            font-size: 20px;
            font-weight: 800;
            color: #1E1B16;
            margin-bottom: 12px;
            line-height: 1.3;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #6B6560;
            margin-bottom: 24px;
          }
          .footer {
            font-size: 11px;
            color: #9B9590;
            border-top: 1px solid rgba(30, 27, 22, 0.06);
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-badge">
            🏢 SmartMess Campus Dining • Warden Dispatch
          </div>
          <div class="icon-circle">
            ${isSuccess ? '✓' : isRejected ? '✕' : 'ℹ'}
          </div>
          <h1>${heading || title}</h1>
          <p>${message}</p>
          <div class="footer">
            VIT Campus Food & Credit Platform • Automatic Authorization Dispatch
          </div>
        </div>
      </body>
      </html>
    `;
  }
};
