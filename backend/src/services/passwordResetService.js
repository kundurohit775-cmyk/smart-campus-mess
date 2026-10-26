import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { emailService } from './emailService.js';

export const passwordResetService = {
  /**
   * Identifies user by email across all roles (Student, Chef, Admin, Warden).
   */
  async findUserByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return null;

    // 1. Check in Admins / Chefs
    const admin = await db.get('SELECT * FROM admins WHERE LOWER(email) = ?', cleanEmail);
    if (admin) {
      return {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: admin.role, // 'admin' or 'chef'
        userType: 'admin'
      };
    }

    // 2. Check in Wardens
    const warden = await db.get('SELECT * FROM wardens WHERE LOWER(email) = ?', cleanEmail);
    if (warden) {
      return {
        id: warden.warden_id,
        name: warden.name,
        email: warden.email,
        role: 'warden',
        userType: 'warden'
      };
    }

    // 3. Check in Students
    const student = await db.get('SELECT * FROM students WHERE LOWER(email) = ?', cleanEmail);
    if (student) {
      return {
        id: student.student_id,
        name: student.name,
        email: student.email,
        role: 'student',
        userType: 'student'
      };
    }

    return null;
  },

  /**
   * Generates a 6-digit password reset verification code and sends it via email.
   */
  async requestReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your registered email address.');
    }

    // Find account
    const user = await this.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error(`No SmartMess account found matching "${cleanEmail}". Please check your email address.`);
    }

    // Rate Limiting: Max 4 requests in last 15 minutes
    const rateCheck = await db.get(`
      SELECT COUNT(*) as count 
      FROM password_resets 
      WHERE LOWER(email) = ? AND created_at >= (NOW() - INTERVAL '15 minutes')
    `, cleanEmail);
    const count = rateCheck ? parseInt(rateCheck.count, 10) : 0;
    if (count >= 4) {
      throw new Error('Too many password reset requests. Please wait 15 minutes before requesting again.');
    }

    // Generate 6-digit code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save in database
    await db.run(`
      INSERT INTO password_resets (email, otp_hash, user_type, user_id, expires_at, used)
      VALUES (?, ?, ?, ?, ?, FALSE)
    `, cleanEmail, otpHash, user.userType, user.id, expiresAt);

    // Send email
    const emailResult = await emailService.sendPasswordResetEmail({
      toEmail: cleanEmail,
      recipientName: user.name,
      resetCode
    });

    return {
      success: true,
      message: emailResult.message || `Password reset code sent to ${cleanEmail}. Please check your inbox.`,
      email: cleanEmail,
      expiresInMinutes: 15
    };
  },

  /**
   * Verifies the 6-digit reset code and sets the new password.
   */
  async verifyAndResetPassword({ email, resetCode, newPassword }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (resetCode || '').toString().trim();
    const password = (newPassword || '').trim();

    if (!cleanEmail || !cleanCode || !password) {
      throw new Error('Email, verification code, and new password are required.');
    }

    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      throw new Error('Verification code must be a 6-digit number.');
    }

    if (password.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // Fetch unexpired, unused reset requests for this email
    const candidates = await db.all(`
      SELECT * FROM password_resets 
      WHERE LOWER(email) = ? AND used = FALSE AND expires_at > NOW()
      ORDER BY reset_id DESC
      LIMIT 5
    `, cleanEmail);

    if (!candidates || candidates.length === 0) {
      throw new Error('Invalid or expired verification code. Please request a new password reset code.');
    }

    let matchedRecord = null;
    for (const record of candidates) {
      const isMatch = await bcrypt.compare(cleanCode, record.otp_hash);
      if (isMatch) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      throw new Error('Incorrect verification code. Please check your email or request a new code.');
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Update password in the target table
    if (matchedRecord.user_type === 'admin') {
      await db.run('UPDATE admins SET password_hash = ? WHERE admin_id = ?', newPasswordHash, matchedRecord.user_id);
    } else if (matchedRecord.user_type === 'warden') {
      await db.run('UPDATE wardens SET password_hash = ? WHERE warden_id = ?', newPasswordHash, matchedRecord.user_id);
    } else if (matchedRecord.user_type === 'student') {
      await db.run('UPDATE students SET password_hash = ? WHERE student_id = ?', newPasswordHash, matchedRecord.user_id);
    } else {
      throw new Error('Unknown user type for password update.');
    }

    // Mark reset record as used
    await db.run('UPDATE password_resets SET used = TRUE WHERE reset_id = ?', matchedRecord.reset_id);

    console.log(`🔐 [Password Reset] Password updated successfully for ${cleanEmail} (${matchedRecord.user_type} #${matchedRecord.user_id})`);

    return {
      success: true,
      message: 'Your password has been reset successfully! You can now sign in with your new password.'
    };
  }
};
