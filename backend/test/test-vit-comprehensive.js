const BASE_URL = 'http://127.0.0.1:5050';

async function runComprehensiveTests() {
  console.log('🧪 ============================================================');
  console.log('🧪 COMPREHENSIVE TEST: STRICT @vitstudent.ac.in VALIDATION');
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
    // Can be 201 (created) or 400 (already exists if re-run)
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
    'attacker@vitstudent.com', // wrong TLD
    'student@vit.ac.in'         // not @vitstudent.ac.in
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
  // 3. Reject Non-VIT Login Attempts
  // -------------------------------------------------------------
  console.log('\n3️⃣ Testing Non-VIT Login Rejection (403 Forbidden)...');
  const invalidLoginEmails = [
    'student@gmail.com',
    'priya@campus.edu',
    'student@campus.edu',
    'alex@outlook.com'
  ];

  for (const badEmail of invalidLoginEmails) {
    // Test on Better Auth endpoint
    const baRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: badEmail, password: 'password123' })
    });
    const baData = await baRes.json();
    assert(baRes.status === 403, `Better Auth login blocked for ${badEmail} (Status 403)`);
    assert(
      baData.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.',
      `Exact error on Better Auth endpoint for ${badEmail}`
    );

    // Test on helper login endpoint
    const helperRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: badEmail, password: 'password123' })
    });
    const helperData = await helperRes.json();
    assert(helperRes.status === 403, `Helper login blocked for ${badEmail} (Status 403)`);
    assert(
      helperData.error === 'Only VIT student email addresses (@vitstudent.ac.in) are allowed to sign in.',
      `Exact error on helper endpoint for ${badEmail}`
    );
  }

  // -------------------------------------------------------------
  // 4. Confirm Chef & Admin Logins Still Work
  // -------------------------------------------------------------
  console.log('\n4️⃣ Testing Chef & Admin Login (Unrestricted)...');
  const chefRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: 'chef@campus.edu', password: 'password123' })
  });
  const chefData = await chefRes.json();
  assert(chefRes.status === 200, `Chef login succeeds with chef@campus.edu (Status 200)`);
  assert(chefData.user?.role === 'chef', `Chef role verified: ${chefData.user?.name}`);

  const adminRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: 'admin@campus.edu', password: 'password123' })
  });
  const adminData = await adminRes.json();
  assert(adminRes.status === 200, `Admin login succeeds with admin@campus.edu (Status 200)`);
  assert(adminData.user?.role === 'admin', `Admin role verified: ${adminData.user?.name}`);

  console.log('\n============================================================');
  console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runComprehensiveTests();
