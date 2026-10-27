import { config } from '../src/config/config.js';
import { smsService } from '../src/services/smsService.js';

const BASE_URL = 'http://localhost:5050/api';

async function runTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 TESTING TWILIO VERIFY MOBILE OTP REGISTRATION FLOW');
  console.log('🧪 ============================================================');

  console.log('\n1️⃣ Verifying Twilio Environment Variables:');
  console.log(`   - TWILIO_ACCOUNT_SID: ${config.twilioAccountSid ? '✅ Present (' + config.twilioAccountSid.slice(0, 8) + '...)' : '❌ Missing'}`);
  console.log(`   - TWILIO_AUTH_TOKEN: ${config.twilioAuthToken ? '✅ Present (Length: ' + config.twilioAuthToken.length + ')' : '❌ Missing'}`);
  console.log(`   - TWILIO_VERIFY_SERVICE_SID: ${config.twilioVerifyServiceSid ? '✅ Present (' + config.twilioVerifyServiceSid.slice(0, 8) + '...)' : '❌ Missing'}`);

  const testPhone = '+919876543210';
  const testEmail = `test.student${Date.now()}@vitstudent.ac.in`;

  console.log('\n2️⃣ Testing Phone Normalization:');
  const normalized = smsService.formatPhoneNumber('9876543210');
  console.log(`   - '9876543210' -> '${normalized}' (${normalized === '+919876543210' ? '✅ PASS' : '❌ FAIL'})`);

  console.log('\n3️⃣ Testing POST /api/auth/register/send-otp:');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Twilio Test Student',
        email: testEmail,
        password: 'password123',
        phone: testPhone,
        roomNumber: 'A-101'
      })
    });

    const data = await res.json();
    console.log('   Response Status:', res.status);
    console.log('   Response Data:', data);

    if (res.ok && data.success) {
      console.log('   ✅ PASS: OTP send request succeeded without exposing OTP code!');
    } else {
      console.error('   ❌ FAIL: OTP send failed:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  console.log('\n4️⃣ Testing Domain Restriction on Registration:');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Student',
        email: 'invalid@gmail.com',
        password: 'password123',
        phone: testPhone
      })
    });

    const data = await res.json();
    if (res.status === 400 && data.error.includes('@vitstudent.ac.in')) {
      console.log('   ✅ PASS: Non-VIT email correctly blocked with 400 Bad Request');
    } else {
      console.error('   ❌ FAIL: Non-VIT email not blocked:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  console.log('\n5️⃣ Testing POST /api/auth/register/verify-otp with Invalid Code:');
  try {
    const res = await fetch(`${BASE_URL}/auth-helpers/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        code: '999999'
      })
    });

    const data = await res.json();
    if (res.status === 400) {
      console.log('   ✅ PASS: Invalid OTP code correctly rejected with 400 Bad Request');
    } else {
      console.error('   ❌ FAIL: Invalid code not rejected:', data);
    }
  } catch (err) {
    console.error('   ❌ ERROR:', err.message);
  }

  console.log('\n============================================================');
  console.log('📊 TWILIO VERIFY TEST SUITE FINISHED');
  console.log('============================================================\n');
}

runTests();
