import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { smsService } from './smsService.js';
import { creditService } from './creditService.js';

let pgPool = null;
if (config.databaseUrl && config.databaseUrl.startsWith('postgresql://') && !config.databaseUrl.includes('sample_pass')) {
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  pgPool.on('error', (err) => {
    console.warn('⚠️ OTP service PG pool error (non-fatal):', err.message);
  });
}

export const otpService = {
  /**
   * Generates and dispatches a 6-digit OTP to the phone number.
   * Enforces 3 requests per 10 minutes rate limit.
   */
  async requestOtp(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      throw new Error('Please provide a valid mobile phone number.');
    }

    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

    // 1. Rate Limiting Check: Max 3 OTP requests per phone number in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let recentRequestsCount = 0;

    if (pgPool) {
      try {
        const rateCheck = await pgPool.query(`
          SELECT COUNT(*) as count 
          FROM otps 
          WHERE phone_number = $1 AND created_at >= NOW() - INTERVAL '10 minutes'
        `, [formattedPhone]);
        recentRequestsCount = parseInt(rateCheck.rows[0].count, 10);
      } catch (e) {
        console.warn('PG rate check warning:', e.message);
      }
    }

    if (recentRequestsCount === 0) {
      const row = db.prepare(`
        SELECT COUNT(*) as count 
        FROM otps 
        WHERE phone_number = ? AND created_at >= datetime('now', '-10 minutes')
      `).get(formattedPhone);
      recentRequestsCount = row ? row.count : 0;
    }

    if (recentRequestsCount >= 3) {
      throw new Error('Maximum OTP request limit reached (3 requests per 10 minutes). Please try again later.');
    }

    // 2. Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 3. Store OTP in Database (Hashed, with Expiry)
    if (pgPool) {
      try {
        await pgPool.query(`
          INSERT INTO otps (phone_number, otp_hash, expires_at, verified)
          VALUES ($1, $2, $3, FALSE)
        `, [formattedPhone, otpHash, expiresAt]);
      } catch (pgErr) {
        console.warn('PG OTP save warning:', pgErr.message);
      }
    }

    db.prepare(`
      INSERT INTO otps (phone_number, otp_hash, expires_at, verified)
      VALUES (?, ?, ?, 0)
    `).run(formattedPhone, otpHash, expiresAt.toISOString());

    // 4. Send SMS via Twilio / MSG91
    await smsService.sendOtpSms(formattedPhone, otpCode);

    return {
      success: true,
      message: `OTP sent successfully to ${formattedPhone}. Valid for 5 minutes.`,
      phone: formattedPhone,
      expiresAt
    };
  },

  /**
   * Verifies the OTP, marks it verified, and logs in the student.
   */
  async verifyOtpAndLogin(phoneNumber, otpCode) {
    if (!phoneNumber || !otpCode) {
      throw new Error('Phone number and 6-digit OTP code are required.');
    }

    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    const cleanCode = otpCode.trim();

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      throw new Error('Please enter a valid 6-digit OTP code.');
    }

    // 1. Check Twilio Verify Service directly or DB hash records
    let isVerified = false;

    if (config.twilioVerifyServiceSid) {
      isVerified = await smsService.checkTwilioVerify(formattedPhone, cleanCode);
    }

    let matchingRecord = null;

    if (!isVerified) {
      if (pgPool) {
        try {
          const pgRows = await pgPool.query(`
            SELECT * FROM otps 
            WHERE phone_number = $1 AND verified = FALSE AND expires_at > NOW()
            ORDER BY otp_id DESC
            LIMIT 5
          `, [formattedPhone]);

          for (const row of pgRows.rows) {
            const isMatch = await bcrypt.compare(cleanCode, row.otp_hash);
            if (isMatch) {
              matchingRecord = row;
              isVerified = true;
              // Mark verified in PG
              await pgPool.query('UPDATE otps SET verified = TRUE WHERE otp_id = $1', [row.otp_id]);
              break;
            }
          }
        } catch (e) {
          console.warn('PG OTP verification lookup warning:', e.message);
        }
      }

      if (!matchingRecord) {
        const sqliteRows = db.prepare(`
          SELECT * FROM otps 
          WHERE phone_number = ? AND verified = 0 AND datetime(expires_at) > datetime('now')
          ORDER BY otp_id DESC
          LIMIT 5
        `).all(formattedPhone);

        for (const row of sqliteRows) {
          const isMatch = await bcrypt.compare(cleanCode, row.otp_hash);
          if (isMatch) {
            matchingRecord = row;
            isVerified = true;
            // Mark verified in SQLite
            db.prepare('UPDATE otps SET verified = 1 WHERE otp_id = ?').run(row.otp_id);
            break;
          }
        }
      }
    }

    if (!isVerified) {
      throw new Error('Invalid or expired OTP. Please request a new code.');
    }

    // 2. Find or associate student by phone number in DB
    let student = null;
    if (pgPool) {
      try {
        const sRes = await pgPool.query(`
          SELECT * FROM students 
          WHERE phone = $1 OR phone = $2
          LIMIT 1
        `, [formattedPhone, phoneNumber.replace(/\D/g, '')]);
        if (sRes.rows.length > 0) student = sRes.rows[0];
      } catch (e) {
        console.warn('PG student lookup warning:', e.message);
      }
    }

    if (!student) {
      student = db.prepare(`
        SELECT * FROM students 
        WHERE phone = ? OR phone = ?
        LIMIT 1
      `).get(formattedPhone, phoneNumber.replace(/\D/g, ''));
    }

    // If not found, look in Better Auth users or create a verified student profile
    if (!student) {
      // Auto-provision student with verified phone number
      const phoneDigits = formattedPhone.replace(/\D/g, '').slice(-4);
      const studentEmail = `student.${phoneDigits}@vitstudent.ac.in`;
      const dummyPassword = await bcrypt.hash('otp-auth-' + crypto.randomBytes(8).toString('hex'), 10);

      const ins = db.prepare(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES (?, ?, ?, ?, 'Hostel', 'active')
      `).run(`VIT Student (${phoneDigits})`, studentEmail, formattedPhone, dummyPassword);

      student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(ins.lastInsertRowid);

      // Allocate 9,000 credits
      creditService.getOrCreateMonthlyCredits(student.student_id);
    }

    // Fetch credits
    const credits = creditService.getOrCreateMonthlyCredits(student.student_id);

    // 3. Issue signed JWT session token
    const token = jwt.sign(
      {
        id: student.student_id,
        email: student.email,
        name: student.name,
        role: 'student',
        phone: student.phone
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      message: 'Mobile OTP verified successfully!',
      token,
      user: {
        id: student.student_id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        roomNumber: student.room_number || 'Hostel',
        role: 'student',
        credits: {
          remaining: credits.remaining_credits,
          used: credits.used_credits,
          limit: credits.monthly_limit,
          isLowBalance: credits.is_low_balance
        }
      }
    };
  }
};
