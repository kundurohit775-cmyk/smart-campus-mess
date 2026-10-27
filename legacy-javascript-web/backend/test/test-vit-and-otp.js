import pg from 'pg';
import dotenv from 'dotenv';
import db from '../src/db/database.js';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:5050';

async function runTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 TESTING VIT EMAIL RESTRICTION & MOBILE OTP AUTHENTICATION');
  console.log('🧪 ============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`   ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Block Non-VIT Student Registration
  // -------------------------------------------------------------
  console.log('1️⃣ Testing Non-VIT Email Registration (should be rejected)...');
  const nonVitRes = await fetch(`${BASE_URL}/api/auth-helpers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'johndoe@gmail.com',
      password: 'password123',
      phone: '+91-9111111111'
    })
  });
  const nonVitData = await nonVitRes.json();
  assert(nonVitRes.status === 400, `Expected 400 Bad Request, got ${nonVitRes.status}`);
  assert(
    nonVitData.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.',
    `Exact error message: "${nonVitData.error}"`
  );

  // -------------------------------------------------------------
  // TEST 2: Allow Valid VIT Student Registration (@vitstudent.ac.in)
  // -------------------------------------------------------------
  console.log('\n2️⃣ Testing Valid VIT Email Registration (@vitstudent.ac.in)...');
  const randomSuffix = Date.now().toString().slice(-6);
  const vitEmail = `student.${randomSuffix}@vitstudent.ac.in`;
  const vitRes = await fetch(`${BASE_URL}/api/auth-helpers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      name: 'Aarav Sharma',
      email: vitEmail,
      password: 'password123',
      phone: `+91-9876${randomSuffix}`,
      roomNumber: 'Hostel D-401'
    })
  });
  const vitData = await vitRes.json();
  assert(vitRes.status === 201, `Expected 201 Created, got ${vitRes.status}`);
  assert(vitData.user?.email === vitEmail, `Registered email matches: ${vitData.user?.email}`);
  assert(vitData.user?.credits?.remaining === 9000, `Automatic 9,000 credits allocated: ${vitData.user?.credits?.remaining}`);

  // -------------------------------------------------------------
  // TEST 3: Mobile OTP Dispatch & Hashing in Database
  // -------------------------------------------------------------
  console.log('\n3️⃣ Testing Mobile OTP Request & Secure Hashing...');
  const testPhone = `+9199999${Date.now().toString().slice(-5)}`;
  const otpSendRes = await fetch(`${BASE_URL}/api/auth-helpers/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: testPhone })
  });
  const otpSendData = await otpSendRes.json();
  assert(otpSendRes.status === 200, `Expected 200 OK, got ${otpSendRes.status}`);
  assert(otpSendData.success === true, `OTP dispatch success: ${otpSendData.message}`);

  const devCode = otpSendData.devCode;
  console.log(`   🔑 Generated OTP Code: ${devCode}`);

  // Check database for hash
  const otpRecord = db.prepare('SELECT * FROM otps WHERE phone_number = ? ORDER BY otp_id DESC LIMIT 1').get(testPhone);
  assert(!!otpRecord, 'OTP record saved in database');
  assert(otpRecord.otp_hash.startsWith('$2a$') || otpRecord.otp_hash.startsWith('$2b$'), `OTP is securely hashed with bcrypt: ${otpRecord.otp_hash.slice(0, 15)}...`);
  assert(otpRecord.otp_hash !== devCode, 'OTP is NOT stored in plain text');

  // -------------------------------------------------------------
  // TEST 4: Rate Limiting Enforcement (Max 3 reqs / 10 min)
  // -------------------------------------------------------------
  console.log('\n4️⃣ Testing OTP Rate Limiter (Max 3 reqs / 10 min)...');
  // Send 2nd request
  await fetch(`${BASE_URL}/api/auth-helpers/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: testPhone })
  });
  // Send 3rd request
  await fetch(`${BASE_URL}/api/auth-helpers/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: testPhone })
  });
  // Send 4th request (MUST FAIL 429)
  const rateLimitRes = await fetch(`${BASE_URL}/api/auth-helpers/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: testPhone })
  });
  const rateLimitData = await rateLimitRes.json();
  assert(rateLimitRes.status === 429, `Expected 429 Too Many Requests, got ${rateLimitRes.status}`);
  assert(rateLimitData.error.includes('limit reached'), `Rate limit error message: "${rateLimitData.error}"`);

  // -------------------------------------------------------------
  // TEST 5: Mobile OTP Verification & Login
  // -------------------------------------------------------------
  console.log('\n5️⃣ Testing OTP Verification & Student Login...');
  const verifyPhone = `+9188888${Date.now().toString().slice(-5)}`;
  const sendRes2 = await fetch(`${BASE_URL}/api/auth-helpers/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: verifyPhone })
  });
  const sendData2 = await sendRes2.json();
  const codeToVerify = sendData2.devCode;

  // Test with invalid code
  const invalidVerify = await fetch(`${BASE_URL}/api/auth-helpers/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: verifyPhone, otp: '000000' })
  });
  assert(invalidVerify.status === 400, `Invalid OTP rejected with status 400`);

  // Test with valid code
  const validVerify = await fetch(`${BASE_URL}/api/auth-helpers/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ phone: verifyPhone, otp: codeToVerify })
  });
  const validVerifyData = await validVerify.json();
  assert(validVerify.status === 200, `Valid OTP accepted with status 200`);
  assert(!!validVerifyData.token, 'Issued JWT session token on OTP login');
  assert(validVerifyData.user?.role === 'student', `Authenticated user role: ${validVerifyData.user?.role}`);
  assert(validVerifyData.user?.credits?.remaining === 9000, `Student credited with 9,000 monthly credits: ${validVerifyData.user?.credits?.remaining}`);

  console.log('\n============================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runTests();
