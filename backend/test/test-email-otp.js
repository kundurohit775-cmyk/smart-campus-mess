import assert from 'assert';
import db from '../src/db/database.js';
import { emailOtpService } from '../src/services/emailOtpService.js';
import { sendOtpEmail } from '../src/services/emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/config.js';

async function runEmailOtpTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 COMPREHENSIVE TEST: EMAIL OTP REGISTRATION & LOGIN (RESEND)');
  console.log('🧪 ============================================================');

  const testEmail = `test.student.${Date.now()}@vitstudent.ac.in`;

  try {
    // 1. Test Resend Email Dispatch function
    console.log('\n1️⃣ Testing sendOtpEmail function...');
    const emailResult = await sendOtpEmail(testEmail, '123456', 'register');
    assert.strictEqual(emailResult.success, true, 'Email dispatch must succeed');
    console.log('   ✅ PASS: sendOtpEmail returns success');

    // 2. Test requestEmailOtp with DB hashing & Rate Limiting
    console.log('\n2️⃣ Testing requestEmailOtp (Hashing & DB Storage)...');
    const req1 = await emailOtpService.requestEmailOtp(testEmail, 'register');
    assert.strictEqual(req1.success, true, 'First OTP request succeeds');
    assert.strictEqual(req1.email, testEmail, 'Email matches');
    assert.strictEqual(req1.otp, undefined, 'CRITICAL: OTP code must NEVER be returned in response');
    console.log('   ✅ PASS: requestEmailOtp succeeds without leaking OTP');

    // Check DB record
    const otpRow = await db.get('SELECT * FROM email_otps WHERE LOWER(email) = ? AND verified = FALSE ORDER BY id DESC LIMIT 1', testEmail);
    assert.ok(otpRow, 'OTP record saved in database');
    assert.ok(otpRow.otp_hash.startsWith('$2'), 'OTP must be securely hashed with bcrypt');
    assert.strictEqual(otpRow.attempts, 0, 'Initial attempts count is 0');
    console.log('   ✅ PASS: OTP is securely hashed in database');

    // 3. Test Rate Limiting (Max 3 in 10 minutes)
    console.log('\n3️⃣ Testing Rate Limiting (Max 3 requests per 10 minutes)...');
    const req2 = await emailOtpService.requestEmailOtp(testEmail, 'register');
    assert.strictEqual(req2.success, true);
    const req3 = await emailOtpService.requestEmailOtp(testEmail, 'register');
    assert.strictEqual(req3.success, true);

    let rateLimitTriggered = false;
    try {
      await emailOtpService.requestEmailOtp(testEmail, 'register');
    } catch (err) {
      rateLimitTriggered = err.message.includes('limit reached');
    }
    assert.strictEqual(rateLimitTriggered, true, '4th OTP request within 10m must be rejected');
    console.log('   ✅ PASS: Rate limiting triggers on 4th OTP request');

    // 4. Test Invalid OTP Code and Attempt Counter
    console.log('\n4️⃣ Testing Invalid OTP verification & attempt increment...');
    // Create fresh test email for OTP verification tests
    const verifyTestEmail = `verify.${Date.now()}@vitstudent.ac.in`;
    await emailOtpService.requestEmailOtp(verifyTestEmail, 'register');

    let wrongCodeError = '';
    try {
      await emailOtpService.verifyEmailOtp(verifyTestEmail, '000000', 'register');
    } catch (err) {
      wrongCodeError = err.message;
    }
    assert.ok(wrongCodeError.includes('attempt(s) remaining'), 'Error indicates attempts remaining');
    console.log('   ✅ PASS: Wrong OTP returns clear error with remaining attempts:', wrongCodeError);

    // 5. Test Brute-force Invalidation (5 failed attempts)
    console.log('\n5️⃣ Testing 5-Attempt Lockout / Invalidation...');
    const bruteForceEmail = `brute.${Date.now()}@vitstudent.ac.in`;
    await emailOtpService.requestEmailOtp(bruteForceEmail, 'register');

    for (let i = 1; i <= 4; i++) {
      try {
        await emailOtpService.verifyEmailOtp(bruteForceEmail, '999999', 'register');
      } catch (err) {
        // Expected failures
      }
    }

    let lockoutError = '';
    try {
      await emailOtpService.verifyEmailOtp(bruteForceEmail, '999999', 'register');
    } catch (err) {
      lockoutError = err.message;
    }
    assert.ok(lockoutError.includes('invalidated') || lockoutError.includes('Too many failed attempts'), '5th failure invalidates OTP');
    console.log('   ✅ PASS: 5th failed attempt invalidates the OTP code');

    // 6. Test Successful OTP Verification and Single-Use deletion
    console.log('\n6️⃣ Testing Successful Verification & Single-Use Deletion...');
    const validEmail = `valid.${Date.now()}@vitstudent.ac.in`;
    
    // Insert a known OTP hash for testing
    const knownOtp = '742918';
    const knownHash = await bcrypt.hash(knownOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.run('INSERT INTO email_otps (email, otp_hash, purpose, attempts, expires_at, verified) VALUES (?, ?, ?, 0, ?, FALSE)',
      validEmail, knownHash, 'register', expiresAt
    );

    const verifyResult = await emailOtpService.verifyEmailOtp(validEmail, knownOtp, 'register');
    assert.strictEqual(verifyResult.verified, true, 'OTP verified successfully');
    console.log('   ✅ PASS: Valid OTP successfully verified');

    // Confirm it cannot be reused (one-time use)
    let reuseError = false;
    try {
      await emailOtpService.verifyEmailOtp(validEmail, knownOtp, 'register');
    } catch (err) {
      reuseError = true;
    }
    assert.strictEqual(reuseError, true, 'OTP cannot be reused after verification');
    console.log('   ✅ PASS: OTP record deleted after single use');

    console.log('\n============================================================');
    console.log('📊 ALL 6 EMAIL OTP SUITE ASSERTIONS PASSED!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runEmailOtpTests();
