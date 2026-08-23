const BASE_URL = 'http://127.0.0.1:5050';

async function testLoginRestrictions() {
  console.log('🧪 ============================================================');
  console.log('🧪 TESTING STRICT VIT STUDENT LOGIN RESTRICTIONS');
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
  // TEST 1: Reject Non-VIT Student Email on Better Auth Sign-In
  // -------------------------------------------------------------
  console.log('1️⃣ Testing Non-VIT Student Sign-In via Better Auth (should be rejected)...');
  const nonVitSignIn = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      email: 'hacker@gmail.com',
      password: 'password123'
    })
  });
  const nonVitSignData = await nonVitSignIn.json();
  assert(nonVitSignIn.status === 403, `Expected 403 Forbidden, got ${nonVitSignIn.status}`);
  assert(
    nonVitSignData.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.',
    `Exact error message: "${nonVitSignData.error}"`
  );

  // -------------------------------------------------------------
  // TEST 2: Reject Non-VIT Student on Helper Login Route
  // -------------------------------------------------------------
  console.log('\n2️⃣ Testing Non-VIT Student Login via Auth Helpers (should be rejected)...');
  const nonVitHelper = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      email: 'student@campus.edu',
      password: 'password123'
    })
  });
  const nonVitHelperData = await nonVitHelper.json();
  assert(nonVitHelper.status === 403, `Expected 403 Forbidden, got ${nonVitHelper.status}`);
  assert(
    nonVitHelperData.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.',
    `Exact error message: "${nonVitHelperData.error}"`
  );

  // -------------------------------------------------------------
  // TEST 3: Allow Valid VIT Student Login (@vitstudent.ac.in)
  // -------------------------------------------------------------
  console.log('\n3️⃣ Testing Valid VIT Student Login (student@vitstudent.ac.in)...');
  const vitStudentLogin = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      email: 'student@vitstudent.ac.in',
      password: 'password123'
    })
  });
  const vitStudentData = await vitStudentLogin.json();
  assert(vitStudentLogin.status === 200, `Expected 200 OK, got ${vitStudentLogin.status}`);
  assert(vitStudentData.user?.role === 'student', `Authenticated as student: ${vitStudentData.user?.name}`);
  assert(vitStudentData.user?.email === 'student@vitstudent.ac.in', `Student email verified: ${vitStudentData.user?.email}`);

  // -------------------------------------------------------------
  // TEST 4: Allow Chef Login (chef@campus.edu)
  // -------------------------------------------------------------
  console.log('\n4️⃣ Testing Chef Login (chef@campus.edu)...');
  const chefLogin = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      email: 'chef@campus.edu',
      password: 'password123'
    })
  });
  const chefData = await chefLogin.json();
  assert(chefLogin.status === 200, `Expected 200 OK for Chef, got ${chefLogin.status}`);
  assert(chefData.user?.role === 'chef', `Authenticated role is chef: ${chefData.user?.name}`);

  // -------------------------------------------------------------
  // TEST 5: Allow Admin Login (admin@campus.edu)
  // -------------------------------------------------------------
  console.log('\n5️⃣ Testing Admin Login (admin@campus.edu)...');
  const adminLogin = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({
      email: 'admin@campus.edu',
      password: 'password123'
    })
  });
  const adminData = await adminLogin.json();
  assert(adminLogin.status === 200, `Expected 200 OK for Admin, got ${adminLogin.status}`);
  assert(adminData.user?.role === 'admin', `Authenticated role is admin: ${adminData.user?.name}`);

  console.log('\n============================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

testLoginRestrictions();
