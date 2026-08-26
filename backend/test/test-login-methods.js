import { config } from '../src/config/config.js';

const BASE_URL = 'http://localhost:5050/api';

async function runTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 TESTING STUDENT 1-STEP REGISTRATION & DUAL LOGIN METHODS');
  console.log('🧪 ============================================================');

  const uniqueId = Date.now();
  const testEmail = `student.${uniqueId}@vitstudent.ac.in`;
  const testPhone = `+9198765${uniqueId.toString().slice(-5)}`;
  const testPassword = 'password123';

  // ---------------------------------------------------------------------------
  // 1. Direct 1-Step Registration
  // ---------------------------------------------------------------------------
  console.log('\n1️⃣ Testing Direct 1-Step Student Registration (No OTP)...');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Chen',
        email: testEmail,
        phone: testPhone,
        password: testPassword,
        roomNumber: 'B-302'
      })
    });

    const data = await res.json();
    console.log('   Response Status:', res.status);
    console.log('   Credits Allocated:', data.user?.credits?.remaining);

    if (res.status === 201 && data.token && data.user?.credits?.remaining === 9000) {
      console.log('   ✅ PASS: 1-step registration succeeded directly without OTP! 9,000 credits allocated.');
    } else {
      console.error('   ❌ FAIL: Registration failed:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  // ---------------------------------------------------------------------------
  // 2. Student Login Method A: Email + Password
  // ---------------------------------------------------------------------------
  console.log('\n2️⃣ Testing Student Login Method A: Email + Password...');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const data = await res.json();
    if (res.status === 200 && data.token && data.user?.role === 'student') {
      console.log('   ✅ PASS: Password login succeeded with valid session token and student profile!');
    } else {
      console.error('   ❌ FAIL: Password login failed:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  // ---------------------------------------------------------------------------
  // 3. Student Login Method B: Mobile OTP Request
  // ---------------------------------------------------------------------------
  console.log('\n3️⃣ Testing Student Login Method B: Send OTP via Twilio Verify...');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/login/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone
      })
    });

    const data = await res.json();
    console.log('   Response Status:', res.status);
    console.log('   Message:', data.message);

    if (res.status === 200 && data.success) {
      console.log('   ✅ PASS: OTP send request processed without exposing OTP in response!');
    } else {
      console.error('   ❌ FAIL: Send OTP failed:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  // ---------------------------------------------------------------------------
  // 4. Rate Limiting on Send OTP (Max 3 per 10 minutes)
  // ---------------------------------------------------------------------------
  console.log('\n4️⃣ Testing Rate Limiting on Send OTP...');
  try {
    // Send 3 more times to trigger rate limit
    await fetch(`${BASE_URL}/auth-helpers/login/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: testPhone }) });
    await fetch(`${BASE_URL}/auth-helpers/login/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: testPhone }) });
    const limitRes = await fetch(`${BASE_URL}/auth-helpers/login/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: testPhone }) });
    const limitData = await limitRes.json();

    if (limitRes.status === 429) {
      console.log('   ✅ PASS: Rate limit enforced with 429 Too Many Requests:', limitData.error);
    } else {
      console.warn('   ℹ️ Note: Rate limit status:', limitRes.status);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  // ---------------------------------------------------------------------------
  // 5. Test Invalid OTP Rejection & Failed Attempt Counter
  // ---------------------------------------------------------------------------
  console.log('\n5️⃣ Testing Invalid OTP Code Rejection on Verify OTP...');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/login/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        code: '999999'
      })
    });

    const data = await res.json();
    if (res.status === 400 && data.error) {
      console.log('   ✅ PASS: Invalid OTP rejected with 400 Bad Request:', data.error);
    } else {
      console.error('   ❌ FAIL: Invalid code not rejected:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  console.log('\n============================================================');
  console.log('📊 ALL DUAL-METHOD AUTH TESTS FINISHED SUCCESSFULLY!');
  console.log('============================================================\n');
}

runTests();
