import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { smsService } from './smsService.js';
import { creditService } from './creditService.js';

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
    const rateCheck = await db.get(`
      SELECT COUNT(*) as count 
      FROM otps 
      WHERE phone_number = ? AND created_at >= (NOW() - INTERVAL '10 minutes')
    `, formattedPhone);
    const recentRequestsCount = rateCheck ? parseInt(rateCheck.count, 10) : 0;

    if (recentRequestsCount >= 3) {
      throw new Error('Maximum OTP request limit reached (3 requests per 10 minutes). Please try again later.');
    }

    // 2. Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 3. Store OTP in Database (Hashed, with Expiry)
    await db.run(`
      INSERT INTO otps (phone_number, otp_hash, expires_at, verified)
      VALUES (?, ?, ?, FALSE)
    `, formattedPhone, otpHash, expiresAt);

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

    if (!isVerified) {
      const pgRows = await db.all(`
        SELECT * FROM otps 
        WHERE phone_number = ? AND verified = FALSE AND expires_at > NOW()
        ORDER BY otp_id DESC
        LIMIT 5
      `, formattedPhone);

      for (const row of pgRows) {
        const isMatch = await bcrypt.compare(cleanCode, row.otp_hash);
        if (isMatch) {
          isVerified = true;
          await db.run('UPDATE otps SET verified = TRUE WHERE otp_id = ?', row.otp_id);
          break;
        }
      }
    }

    if (!isVerified) {
      throw new Error('Invalid or expired OTP. Please request a new code.');
    }

    // 2. Find or associate student by phone number in DB
    let student = await db.get(`
      SELECT * FROM students 
      WHERE phone = ? OR phone = ?
      LIMIT 1
    `, formattedPhone, phoneNumber.replace(/\D/g, ''));

    // If not found, create a verified student profile
    if (!student) {
      const phoneDigits = formattedPhone.replace(/\D/g, '').slice(-4);
      const studentEmail = `student.${phoneDigits}@vitstudent.ac.in`;
      const dummyPassword = await bcrypt.hash('otp-auth-' + crypto.randomBytes(8).toString('hex'), 10);

      const ins = await db.run(`
        INSERT INTO students (name, email, phone, password_hash, room_number, status)
        VALUES (?, ?, ?, ?, 'Hostel', 'active')
      `, `VIT Student (${phoneDigits})`, studentEmail, formattedPhone, dummyPassword);

      student = await db.get('SELECT * FROM students WHERE student_id = ?', ins.lastInsertRowid);
    }

    // Fetch / allocate credits
    const credits = await creditService.getOrCreateMonthlyCredits(student.student_id);

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
