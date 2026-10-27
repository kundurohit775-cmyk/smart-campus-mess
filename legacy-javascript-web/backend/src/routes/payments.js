import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import db from '../db/database.js';
import { config } from '../config/config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { creditService } from '../services/creditService.js';

const router = express.Router();

// Auto-initialize payments table in PostgreSQL
let tableInitialized = false;
async function ensurePaymentsTable() {
  if (tableInitialized) return;
  try {
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        razorpay_order_id VARCHAR(100) NOT NULL,
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'CREATED',
        credits_added NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
      CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
    `);
    tableInitialized = true;
  } catch (err) {
    console.warn('⚠️ Payments table init warning:', err.message);
  }
}

// In-memory rate limiting map for create-order: max 10 requests per 5 minutes per user
const rateLimitMap = new Map();
function checkOrderRateLimit(userId) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 10;

  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

// Initialize Razorpay instance
function getRazorpayInstance() {
  const envKeyId = process.env.RAZORPAY_KEY_ID;
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const configKeyId = config.razorpayKeyId;
  const configKeySecret = config.razorpayKeySecret;

  // ---------------------------------------------------------------------------
  // Temporary Debug Logging for Razorpay Environment Variables
  // (Logs lengths, defined status, and empty status - NEVER the secret itself)
  // ---------------------------------------------------------------------------
  console.log('🔍 [RAZORPAY DEBUG] Checking Environment Variables:');
  console.log('   - process.env.RAZORPAY_KEY_ID:', {
    isUndefined: envKeyId === undefined,
    isEmptyString: envKeyId === '',
    valueType: typeof envKeyId,
    length: typeof envKeyId === 'string' ? envKeyId.length : null,
    configValueLength: typeof configKeyId === 'string' ? configKeyId.length : null
  });
  console.log('   - process.env.RAZORPAY_KEY_SECRET:', {
    isUndefined: envKeySecret === undefined,
    isEmptyString: envKeySecret === '',
    valueType: typeof envKeySecret,
    length: typeof envKeySecret === 'string' ? envKeySecret.length : null,
    configValueLength: typeof configKeySecret === 'string' ? configKeySecret.length : null
  });

  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    console.warn('⚠️ [RAZORPAY DEBUG] Missing process.env.RAZORPAY_KEY_ID or process.env.RAZORPAY_KEY_SECRET.');
    return null;
  }

  console.log(`✅ [RAZORPAY DEBUG] Creating Razorpay instance (Key ID length: ${config.razorpayKeyId.length}, Secret length: ${config.razorpayKeySecret.length})`);
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret
  });
}

/**
 * POST /api/payments/create-order
 * Body: { amount } (in INR Rupees)
 * Creates a Razorpay order for purchasing mess credits (1 Rupee = 1 Credit)
 */
router.post('/create-order', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    await ensurePaymentsTable();

    const studentId = req.user.id;
    const { amount } = req.body;

    const numericAmount = Math.round(Number(amount));
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 1) {
      return res.status(400).json({ error: 'Minimum top-up amount is ₹1.' });
    }
    if (numericAmount > 50000) {
      return res.status(400).json({ error: 'Maximum single top-up amount is ₹50,000.' });
    }

    // Rate limiting check
    if (!checkOrderRateLimit(studentId)) {
      return res.status(429).json({
        error: 'Too many payment requests created. Please wait 5 minutes before trying again.'
      });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = numericAmount * 100;
    const receiptId = `rcpt_${studentId}_${Date.now()}`;

    let order;
    if (razorpay) {
      // Real Razorpay Order Creation via API
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          studentId: studentId.toString(),
          studentName: req.user.name || '',
          studentEmail: req.user.email || '',
          creditsGranted: numericAmount.toString()
        }
      });
    } else {
      // Graceful fallback for local development without Razorpay keys
      order = {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId
      };
    }

    // Record order initiation in PostgreSQL
    await db.run(`
      INSERT INTO payments (student_id, razorpay_order_id, amount, currency, status)
      VALUES (?, ?, ?, 'INR', 'CREATED')
    `, studentId, order.id, numericAmount);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpayKeyId || 'rzp_test_placeholder',
      credits: numericAmount,
      isSimulated: !razorpay
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    next(err);
  }
});

/**
 * POST /api/payments/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }
 * Verifies Razorpay payment signature (HMAC SHA256) and credits student balance
 */
router.post('/verify', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    await ensurePaymentsTable();

    const studentId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Razorpay order ID and payment ID are required.' });
    }

    const numericAmount = Math.round(Number(amount));
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valid top-up amount is required.' });
    }

    // 1. Signature Verification using HMAC SHA256 (per official Razorpay documentation)
    if (config.razorpayKeySecret) {
      if (!razorpay_signature) {
        return res.status(400).json({ error: 'Razorpay signature is required for verification.' });
      }

      const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(bodyToSign)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Mark payment as FAILED in database
        await db.run(`
          UPDATE payments 
          SET status = 'FAILED', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = NOW()
          WHERE razorpay_order_id = ?
        `, razorpay_payment_id, razorpay_signature, razorpay_order_id);

        return res.status(400).json({ error: 'Payment signature verification failed. No credits added.' });
      }
    }

    // 2. Prevent duplicate/replay processing of the same payment ID
    const existingPayment = await db.get(`
      SELECT * FROM payments 
      WHERE razorpay_payment_id = ? AND status = 'SUCCESS'
    `, razorpay_payment_id);

    if (existingPayment) {
      const currentCredits = await creditService.getOrCreateMonthlyCredits(studentId);
      return res.json({
        success: true,
        message: 'Payment was already verified and credits applied.',
        credits: currentCredits
      });
    }

    // 3. Update payment status in database
    await db.run(`
      INSERT INTO payments (student_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, credits_added)
      VALUES (?, ?, ?, ?, ?, 'INR', 'SUCCESS', ?)
      ON CONFLICT (payment_id) DO NOTHING
    `, studentId, razorpay_order_id, razorpay_payment_id, razorpay_signature || '', numericAmount, numericAmount);

    await db.run(`
      UPDATE payments 
      SET status = 'SUCCESS', razorpay_payment_id = ?, razorpay_signature = ?, credits_added = ?, updated_at = NOW()
      WHERE razorpay_order_id = ?
    `, razorpay_payment_id, razorpay_signature || '', numericAmount, razorpay_order_id);

    // 4. Add purchased credits to student's account (1 Rupee = 1 Credit)
    const updatedCredits = await creditService.addPurchasedCredits(studentId, numericAmount, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    res.json({
      success: true,
      message: `Payment verified! Added ${numericAmount} credits to your account.`,
      credits: updatedCredits,
      transaction: {
        amount: numericAmount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    next(err);
  }
});

/**
 * GET /api/payments/history
 * Returns past top-up payment transactions for the authenticated student
 */
router.get('/history', authenticateToken, requireRole('student'), async (req, res, next) => {
  try {
    await ensurePaymentsTable();

    const studentId = req.user.id;
    const history = await db.all(`
      SELECT payment_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, credits_added, created_at
      FROM payments
      WHERE student_id = ?
      ORDER BY payment_id DESC
      LIMIT 50
    `, studentId);

    res.json({
      success: true,
      history
    });
  } catch (err) {
    next(err);
  }
});

export default router;
