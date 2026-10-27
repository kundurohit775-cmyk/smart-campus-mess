import axios from 'axios';
import assert from 'assert';

const API = 'http://127.0.0.1:5050/api';

async function runTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 TESTING DIRECT 1-STEP STUDENT REGISTRATION (NO OTP)');
  console.log('🧪 ============================================================\n');

  const timestamp = Date.now();
  const testStudent = {
    name: `Direct Student ${timestamp}`,
    email: `student.${timestamp}@vitstudent.ac.in`,
    password: 'password123',
    phone: '+91-9876543210',
    roomNumber: 'D-404'
  };

  // 1. Direct Registration with @vitstudent.ac.in
  console.log('1️⃣ Testing Direct Registration with valid @vitstudent.ac.in email...');
  const regRes = await axios.post(`${API}/auth-helpers/register`, testStudent);
  assert.strictEqual(regRes.status, 201, 'Registration should return 201 Created');
  assert.ok(regRes.data.token, 'Registration should return JWT session token');
  assert.strictEqual(regRes.data.user.email, testStudent.email, 'User email should match');
  assert.strictEqual(regRes.data.user.role, 'student', 'Role should be student');
  assert.strictEqual(regRes.data.user.credits.remaining, 9000, 'Student should receive 9,000 credits');
  console.log('   ✅ PASS: Student registered directly without OTP! Token & 9,000 credits received.\n');

  // 2. Immediate Login with newly registered student
  console.log('2️⃣ Testing immediate login with new credentials...');
  const loginRes = await axios.post(`${API}/auth-helpers/login`, {
    email: testStudent.email,
    password: testStudent.password
  });
  assert.strictEqual(loginRes.status, 200, 'Login should succeed');
  assert.ok(loginRes.data.token, 'Login should return token');
  assert.strictEqual(loginRes.data.user.credits.remaining, 9000, 'Credits should be 9,000');
  console.log('   ✅ PASS: Login succeeded with email + password!\n');

  // 3. Rejection of Non-VIT Email Domain
  console.log('3️⃣ Testing Non-VIT Email Domain Rejection (@gmail.com, @campus.edu)...');
  try {
    await axios.post(`${API}/auth-helpers/register`, {
      name: 'Invalid Student',
      email: 'attacker@gmail.com',
      password: 'password123'
    });
    assert.fail('Should have rejected non-VIT email');
  } catch (err) {
    assert.strictEqual(err.response.status, 400, 'Should return 400 Bad Request');
    assert.ok(err.response.data.error.includes('@vitstudent.ac.in'), 'Error should mention @vitstudent.ac.in requirement');
    console.log('   ✅ PASS: Non-VIT email rejected with 400 Bad Request:', err.response.data.error);
  }

  // 4. Rejection of Duplicate Email
  console.log('\n4️⃣ Testing Duplicate Email Rejection...');
  try {
    await axios.post(`${API}/auth-helpers/register`, testStudent);
    assert.fail('Should have rejected duplicate email');
  } catch (err) {
    assert.strictEqual(err.response.status, 400, 'Should return 400 Bad Request for duplicate');
    assert.ok(err.response.data.error.includes('already exists'), 'Error should state account already exists');
    console.log('   ✅ PASS: Duplicate registration rejected with 400 Bad Request:', err.response.data.error);
  }

  console.log('\n============================================================');
  console.log('📊 ALL 4 DIRECT REGISTRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
