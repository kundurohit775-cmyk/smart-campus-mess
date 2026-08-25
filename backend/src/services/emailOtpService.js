import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { sendOtpEmail } from './emailService.js';

let tableReady = false;
async function ensureEmailOtpsTable() {
  if (tableReady) return;
  try {
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        purpose VARCHAR(50) DEFAULT 'login',
        attempts INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
    `);
    tableReady = true;
  } catch (err) {
    console.warn('⚠️ email_otps table init warning:', err.message);
  }
}

export const emailOtpService = {
  /**
   * Generates and emails a 6-digit OTP code to the student.
   * Enforces 3 requests per 10 minutes rate limit.
   */
  async requestEmailOtp(email, purpose = 'login') {
    await ensureEmailOtpsTable();

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Rate Limiting Check: Max 3 requests per email in last 10 minutes
    const rateCheck = await db.get(`
      SELECT COUNT(*) as count 
      FROM email_otps 
      WHERE LOWER(email) = ? AND created_at >= (NOW() - INTERVAL '10 minutes')
    `, cleanEmail);
    const recentRequestsCount = rateCheck ? parseInt(rateCheck.count, 10) : 0;

    if (recentRequestsCount >= 3) {
      throw new Error('Maximum OTP request limit reached (3 requests per 10 minutes). Please try again later.');
    }

    // Invalidate any existing active OTPs for this email to ensure only latest code works
    await db.run(`
      UPDATE email_otps 
      SET verified = TRUE 
      WHERE LOWER(email) = ? AND verified = FALSE
    `, cleanEmail);

    // 2. Generate random 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiryMinutes = config.otpExpiryMinutes || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // 3. Store Hashed OTP in Database
    await db.run(`
      INSERT INTO email_otps (email, otp_hash, purpose, attempts, expires_at, verified)
      VALUES (?, ?, ?, 0, ?, FALSE)
    `, cleanEmail, otpHash, purpose, expiresAt);

    // 4. Send Email via Resend
    await sendOtpEmail(cleanEmail, otpCode, purpose);

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}. Valid for ${expiryMinutes} minutes.`,
      expiresAt,
      email: cleanEmail
    };
  },

  /**
   * Verifies the 6-digit OTP code against the database.
   * Invalidates OTP after 5 failed attempts.
   */
  async verifyEmailOtp(email, otpCode, purpose = 'login') {
    await ensureEmailOtpsTable();

    if (!email || !otpCode) {
      throw new Error('Email address and 6-digit verification code are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.toString().trim();

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    // 1. Fetch active unexpired OTP record
    const otpRecord = await db.get(`
      SELECT * FROM email_otps 
      WHERE LOWER(email) = ? AND verified = FALSE AND expires_at > NOW()
      ORDER BY id DESC
      LIMIT 1
    `, cleanEmail);

    if (!otpRecord) {
      throw new Error('No active verification code found or code has expired. Please request a new one.');
    }

    // 2. Check if attempts exceeded max (5)
    if (otpRecord.attempts >= 5) {
      await db.run('DELETE FROM email_otps WHERE id = ?', otpRecord.id);
      throw new Error('Too many failed attempts. This OTP has been invalidated for security. Please request a new code.');
    }

    // 3. Compare hashed OTP
    const isMatch = await bcrypt.compare(cleanCode, otpRecord.otp_hash);

    if (!isMatch) {
      const updatedAttempts = (otpRecord.attempts || 0) + 1;
      await db.run('UPDATE email_otps SET attempts = ? WHERE id = ?', updatedAttempts, otpRecord.id);

      const remainingAttempts = 5 - updatedAttempts;
      if (remainingAttempts <= 0) {
        await db.run('DELETE FROM email_otps WHERE id = ?', otpRecord.id);
        throw new Error('Too many failed attempts. This verification code has been invalidated. Please request a new code.');
      }

      throw new Error(`Invalid verification code. ${remainingAttempts} attempt(s) remaining.`);
    }

    // 4. On successful match: delete/invalidate record (one-time use)
    await db.run('DELETE FROM email_otps WHERE id = ?', otpRecord.id);

    return {
      verified: true,
      email: cleanEmail,
      purpose: otpRecord.purpose
    };
  }
};
