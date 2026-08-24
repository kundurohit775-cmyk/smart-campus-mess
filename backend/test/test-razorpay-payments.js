import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5050';

async function testRazorpayPayments() {
  console.log('🧪 Starting Razorpay Payment & Credit Top-Up Tests...');
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

  try {
    // 1. Student Login
    console.log('\n1️⃣ Logging in as Student...');
    const loginRes = await fetch(`${BASE_URL}/api/auth-helpers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@vitstudent.ac.in', password: 'password123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `Student login succeeded (Status 200)`);
    const studentToken = loginData.token;
    const studentId = loginData.user.id;

    // 2. Fetch Initial Balance
    console.log('\n2️⃣ Fetching Initial Credit Balance...');
    const initialCreditsRes = await fetch(`${BASE_URL}/api/credits/${studentId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const initialCreditsData = await initialCreditsRes.json();
    const initialRemaining = Number(initialCreditsData.credits.remaining_credits);
    console.log(`   ℹ️ Current Balance: ${initialRemaining} Credits`);

    // 3. Test Create Order with Invalid Amount (₹0 or negative)
    console.log('\n3️⃣ Testing Validation on Create Order (Invalid Amounts)...');
    const invalidAmtRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ amount: 0 })
    });
    assert(invalidAmtRes.status === 400, `Rejects ₹0 amount with 400 Bad Request`);

    // 4. Test Create Order with Valid Amount (₹150)
    console.log('\n4️⃣ Testing Valid Order Creation (₹150)...');
    const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ amount: 150 })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200 && orderData.success === true, `Order created successfully: ${orderData.orderId}`);
    assert(orderData.amount === 15000, `Amount in paise is 15000 (₹150)`);
    assert(orderData.currency === 'INR', `Currency is INR`);

    // 5. Test Payment Verification (Signature Verification & Balance Credit)
    console.log('\n5️⃣ Testing Payment Verification & Balance Credit...');
    const testPaymentId = `pay_test_${Date.now()}`;
    const testSecret = process.env.RAZORPAY_KEY_SECRET || '';
    let testSignature = 'simulated_sig';
    if (testSecret) {
      testSignature = crypto
        .createHmac('sha256', testSecret)
        .update(`${orderData.orderId}|${testPaymentId}`)
        .digest('hex');
    }

    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: testSignature,
        amount: 150
      })
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.success === true, `Payment verified successfully`);
    assert(Number(verifyData.credits.remaining_credits) === initialRemaining + 150, `Credits balance increased by exactly 150 (New: ${verifyData.credits.remaining_credits})`);

    // 6. Test Replay Attack Prevention
    console.log('\n6️⃣ Testing Duplicate Payment Replay Prevention...');
    const replayRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: testSignature,
        amount: 150
      })
    });
    const replayData = await replayRes.json();
    assert(replayRes.status === 200, `Handles duplicate payment gracefully without double-crediting`);
    assert(Number(replayData.credits.remaining_credits) === initialRemaining + 150, `Balance remains unchanged on replay`);

    // 7. Verify Transaction History
    console.log('\n7️⃣ Verifying Transaction Ledger contains TOPUP record...');
    const ledgerRes = await fetch(`${BASE_URL}/api/credits/${studentId}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const ledgerData = await ledgerRes.json();
    const topupTx = ledgerData.transactions.find(t => t.transaction_type === 'TOPUP');
    assert(Boolean(topupTx), `TOPUP transaction recorded in student credit ledger`);
    assert(Number(topupTx?.amount) === 150, `Recorded top-up amount matches ₹150`);

    console.log('\n============================================================');
    console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('============================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  }
}

testRazorpayPayments();
