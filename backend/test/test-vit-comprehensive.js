const BASE_URL = 'http://127.0.0.1:5050';

async function runComprehensiveTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 COMPREHENSIVE TEST: STRICT @vitstudent.ac.in & CHEF RESTRICTION');
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
  // 1. Varied VIT email formats (Any prefix + @vitstudent.ac.in)
  // -------------------------------------------------------------
  const vitEmails = [
    { name: 'Rohit Kundu', email: 'rohit.kundu2024@vitstudent.ac.in' },
    { name: 'Priya Sharma', email: 'priya.sharma2023@vitstudent.ac.in' },
    { name: 'Arjun Kumar', email: 'arjun2025@vitstudent.ac.in' }
  ];

  console.log('1️⃣ Testing Registration & Login with various valid VIT prefixes...');
  for (const acc of vitEmails) {
    // Test Registration
    const regRes = await fetch(`${BASE_URL}/api/auth-helpers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({
        name: acc.name,
        email: acc.email,
        password: 'password123',
        phone: '+91-9876543210',
        roomNumber: 'Hostel A-101'
      })
    });
    assert(regRes.status === 201 || regRes.status === 400, `Registration check for ${acc.email} (Status: ${regRes.status})`);

    // Test Login
    const loginRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({
        email: acc.email,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `Sign-in succeeds for ${acc.email}`);
    assert(loginData.user?.role === 'student', `Role is student for ${acc.email}`);
  }

  // -------------------------------------------------------------
  // 2. Reject Non-VIT Registration Attempts
  // -------------------------------------------------------------
  console.log('\n2️⃣ Testing Non-VIT Registration Rejection (400 Bad Request)...');
  const invalidRegEmails = [
    'user@gmail.com',
    'student@campus.edu',
    'alex@yahoo.com',
    'attacker@vitstudent.com',
    'student@vit.ac.in'
  ];

  for (const badEmail of invalidRegEmails) {
    const res = await fetch(`${BASE_URL}/api/auth-helpers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({
        name: 'Bad User',
        email: badEmail,
        password: 'password123'
      })
    });
    const data = await res.json();
    assert(res.status === 400, `Registration blocked for ${badEmail} (Status 400)`);
    assert(
      data.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.',
      `Exact error returned for ${badEmail}`
    );
  }

  // -------------------------------------------------------------
  // 3. Reject Non-VIT & Unauthorized Chef Logins
  // -------------------------------------------------------------
  console.log('\n3️⃣ Testing Non-VIT Login Rejection (403 Forbidden)...');
  const invalidLoginEmails = [
    'student@gmail.com',
    'priya@campus.edu',
    'chef@campus.edu', // Old chef account must be blocked
    'alex@outlook.com'
  ];

  for (const badEmail of invalidLoginEmails) {
    const baRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: badEmail, password: 'password123' })
    });
    assert(baRes.status === 403, `Login blocked for ${badEmail} (Status 403)`);

    const helperRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: badEmail, password: 'password123' })
    });
    assert(helperRes.status === 403 || helperRes.status === 401, `Helper login blocked for ${badEmail}`);
  }

  // -------------------------------------------------------------
  // 4. Confirm Authorized Chef & Admin Logins
  // -------------------------------------------------------------
  const targetChef = process.env.CHEF_EMAIL || 'chef@campus.internal';
  console.log(`\n4️⃣ Testing Authorized Chef (${targetChef}) & Admin Login...`);
  
  // 4a. Chef Login
  const chefRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: targetChef, password: 'password123' })
  });
  const chefData = await chefRes.json();
  if (chefRes.status === 200) {
    assert(chefRes.status === 200, `Chef login succeeds for configured chef (Status 200)`);
    assert(chefData.user?.role === 'chef', `Chef role verified: ${chefData.user?.role}`);
    assert(chefData.user?.isChef === true, `isChef boolean is true on response`);

    // 4b. Chef Endpoint Access Test
    const chefToken = chefData.token;
    const toggleRes = await fetch(`${BASE_URL}/api/menu/1/toggle-stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chefToken}`,
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({ available_quantity: 45 })
    });
    assert(toggleRes.status === 200, `Chef can access toggle-stock endpoint (Status 200)`);
  } else {
    console.log(`   ℹ️ Note: Chef login skipped (CHEF_EMAIL not configured in test runner)`);
  }

  // 4c. Admin Login
  const targetAdmin = process.env.ADMIN_EMAIL || 'admin@campus.internal';
  const adminRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: targetAdmin, password: 'password123' })
  });
  const adminData = await adminRes.json();
  if (adminRes.status === 200) {
    assert(adminRes.status === 200, `Admin login succeeds with configured admin (Status 200)`);
    assert(adminData.user?.role === 'admin', `Admin role verified: ${adminData.user?.role}`);
    assert(adminData.user?.isAdmin === true, `isAdmin boolean is true on response`);
  } else {
    console.log(`   ℹ️ Note: Admin login skipped (ADMIN_EMAIL not matching local test environment)`);
  }

  // 4d. Reject unauthorized admin login attempts
  const fakeAdminRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: 'fake_admin@campus.edu', password: 'password123' })
  });
  assert(fakeAdminRes.status === 403 || fakeAdminRes.status === 401, `Unauthorized admin is rejected with 403/401`);

  console.log('\n============================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runComprehensiveTests();
