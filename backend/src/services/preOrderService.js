import db from '../db/database.js';
import { creditService } from './creditService.js';

export const preOrderService = {
  /**
   * Helper: Get formatted date string (YYYY-MM-DD) for tomorrow
   */
  getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  },

  /**
   * Calculate live remaining stock for a special item on a given date.
   * Can pass an active transaction client if inside a transaction.
   */
  async getRemainingStock(itemId, scheduledDate, client = db.pool) {
    const itemRes = await client.query(`
      SELECT item_id, item_name, is_special, special_stock_limit, special_available_date 
      FROM menu_items 
      WHERE item_id = $1
    `, [itemId]);

    if (!itemRes.rows.length) return 0;
    const item = itemRes.rows[0];
    if (!item.is_special || item.special_stock_limit == null) return 0;

    const targetDate = scheduledDate || item.special_available_date;
    if (!targetDate) return 0;

    const bookedRes = await client.query(`
      SELECT COALESCE(SUM(quantity), 0) as booked_qty
      FROM pre_orders
      WHERE item_id = $1 AND scheduled_date = $2 AND status = 'confirmed'
    `, [itemId, targetDate]);

    const bookedQty = parseInt(bookedRes.rows[0].booked_qty, 10);
    const limit = parseInt(item.special_stock_limit, 10);
    return Math.max(0, limit - bookedQty);
  },

  /**
   * Get all active special items available for pre-order "for tomorrow"
   */
  async getTomorrowSpecials() {
    const result = await db.query(`
      SELECT m.item_id, m.item_name, m.category, m.price, m.calories, m.healthy_override,
             m.is_special, m.special_stock_limit, m.special_available_date,
             m.description, m.image_url, m.available_quantity, m.is_active,
             COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.quantity ELSE 0 END), 0) as booked_stock
      FROM menu_items m
      LEFT JOIN pre_orders p ON m.item_id = p.item_id AND p.scheduled_date = m.special_available_date
      WHERE m.is_active = 1 
        AND m.is_special = TRUE 
        AND m.special_available_date = (CURRENT_DATE + INTERVAL '1 day')
      GROUP BY m.item_id
      ORDER BY m.item_name ASC
    `);

    return result.rows.map(item => {
      const limit = item.special_stock_limit != null ? parseInt(item.special_stock_limit, 10) : 0;
      const booked = parseInt(item.booked_stock, 10);
      const remaining = Math.max(0, limit - booked);
      const isSoldOut = remaining <= 0;

      return {
        ...item,
        special_stock_limit: limit,
        booked_stock: booked,
        remaining_stock: remaining,
        remaining_count: remaining,
        is_sold_out: isSoldOut ? 1 : 0
      };
    });
  },

  /**
   * Atomically place a next-day pre-order for a special item.
   * Concurrency safe via PostgreSQL row-level lock (FOR UPDATE).
   */
  async placePreOrder(studentId, itemId, quantity) {
    const numStudentId = parseInt(studentId, 10);
    const numItemId = parseInt(itemId, 10);
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive integer.');
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock and select special menu item
      const itemRes = await client.query(`
        SELECT item_id, item_name, price, calories, is_special, special_stock_limit, special_available_date, is_active
        FROM menu_items
        WHERE item_id = $1
        FOR UPDATE
      `, [numItemId]);

      if (!itemRes.rows.length) {
        throw new Error('Special menu item not found.');
      }

      const item = itemRes.rows[0];
      if (!item.is_active) {
        throw new Error(`Item "${item.item_name}" is currently inactive.`);
      }
      if (!item.is_special || !item.special_stock_limit) {
        throw new Error(`Item "${item.item_name}" is not marked as a pre-order special.`);
      }

      const scheduledDate = item.special_available_date;
      if (!scheduledDate) {
        throw new Error('Special item has no scheduled availability date.');
      }

      // 2. Check live booked quantity and compute remaining stock
      const bookedRes = await client.query(`
        SELECT COALESCE(SUM(quantity), 0) as booked_qty
        FROM pre_orders
        WHERE item_id = $1 AND scheduled_date = $2 AND status = 'confirmed'
      `, [numItemId, scheduledDate]);

      const bookedQty = parseInt(bookedRes.rows[0].booked_qty, 10);
      const limit = parseInt(item.special_stock_limit, 10);
      const remainingStock = Math.max(0, limit - bookedQty);

      if (remainingStock <= 0) {
        throw new Error(`Sorry, "${item.item_name}" is completely sold out for ${scheduledDate}.`);
      }

      if (qty > remainingStock) {
        throw new Error(`Cannot reserve ${qty} units. Only ${remainingStock} unit${remainingStock > 1 ? 's' : ''} left for ${scheduledDate}.`);
      }

      // 3. Check and lock student credits
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const totalAmount = parseInt(item.price, 10) * qty;

      let creditRes = await client.query(`
        SELECT * FROM credits
        WHERE student_id = $1 AND month = $2 AND year = $3
        FOR UPDATE
      `, [numStudentId, currentMonth, currentYear]);

      let creditRecord = creditRes.rows[0];
      if (!creditRecord) {
        // Fallback: create credits for this month if missing
        await client.query(`
          INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
          VALUES ($1, 9000, 0, 9000, $2, $3)
          ON CONFLICT (student_id, month, year) DO NOTHING
        `, [numStudentId, currentMonth, currentYear]);

        creditRes = await client.query(`
          SELECT * FROM credits
          WHERE student_id = $1 AND month = $2 AND year = $3
          FOR UPDATE
        `, [numStudentId, currentMonth, currentYear]);
        creditRecord = creditRes.rows[0];
      }

      if (creditRecord.remaining_credits < totalAmount) {
        throw new Error(`Insufficient credits. Required: ${totalAmount} Credits, Available: ${creditRecord.remaining_credits} Credits.`);
      }

      // 4. Deduct student credits
      const newRemaining = creditRecord.remaining_credits - totalAmount;
      const newUsed = creditRecord.used_credits + totalAmount;

      await client.query(`
        UPDATE credits
        SET remaining_credits = $1, used_credits = $2, updated_at = NOW()
        WHERE credit_id = $3
      `, [newRemaining, newUsed, creditRecord.credit_id]);

      // 5. Generate unique pickup token (e.g. PRE-7482)
      const token = `PRE-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Create pre_order record
      const preOrderRes = await client.query(`
        INSERT INTO pre_orders (
          student_id, item_id, quantity, price_per_item, 
          total_amount, pickup_token, scheduled_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
        RETURNING *
      `, [numStudentId, numItemId, qty, item.price, totalAmount, token, scheduledDate]);

      const createdPreOrder = preOrderRes.rows[0];

      // 7. Record ledger transaction
      await client.query(`
        INSERT INTO transactions (
          student_id, transaction_type, amount, balance_after, notes
        ) VALUES ($1, 'DEBIT_ORDER', $2, $3, $4)
      `, [
        numStudentId,
        totalAmount,
        newRemaining,
        `Next-Day Pre-Order: ${qty}x ${item.item_name} for ${scheduledDate} (Token: ${token})`
      ]);

      await client.query('COMMIT');

      return {
        ...createdPreOrder,
        item_name: item.item_name,
        remaining_stock_after: remainingStock - qty
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Cancel an upcoming pre-order and refund credits back to student.
   * Releases stock back to the pool immediately.
   */
  async cancelPreOrder(preOrderId, studentId) {
    const numPreOrderId = parseInt(preOrderId, 10);
    const numStudentId = parseInt(studentId, 10);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const preOrderRes = await client.query(`
        SELECT p.*, m.item_name
        FROM pre_orders p
        JOIN menu_items m ON p.item_id = m.item_id
        WHERE p.pre_order_id = $1
        FOR UPDATE
      `, [numPreOrderId]);

      if (!preOrderRes.rows.length) {
        throw new Error('Pre-order not found.');
      }

      const preOrder = preOrderRes.rows[0];
      if (preOrder.student_id !== numStudentId) {
        throw new Error('You are not authorized to cancel this pre-order.');
      }

      if (preOrder.status !== 'confirmed') {
        throw new Error(`Cannot cancel pre-order in "${preOrder.status}" status.`);
      }

      // Update pre-order status to cancelled
      await client.query(`
        UPDATE pre_orders
        SET status = 'cancelled', updated_at = NOW()
        WHERE pre_order_id = $1
      `, [numPreOrderId]);

      // Refund credits
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const creditRes = await client.query(`
        SELECT * FROM credits
        WHERE student_id = $1 AND month = $2 AND year = $3
        FOR UPDATE
      `, [numStudentId, currentMonth, currentYear]);

      if (creditRes.rows.length) {
        const creditRecord = creditRes.rows[0];
        const refundAmount = preOrder.total_amount;
        const newRemaining = creditRecord.remaining_credits + refundAmount;
        const newUsed = Math.max(0, creditRecord.used_credits - refundAmount);

        await client.query(`
          UPDATE credits
          SET remaining_credits = $1, used_credits = $2, updated_at = NOW()
          WHERE credit_id = $3
        `, [newRemaining, newUsed, creditRecord.credit_id]);

        // Record refund in transactions
        await client.query(`
          INSERT INTO transactions (
            student_id, transaction_type, amount, balance_after, notes
          ) VALUES ($1, 'CREDIT_ADJUSTMENT', $2, $3, $4)
        `, [
          numStudentId,
          refundAmount,
          newRemaining,
          `Pre-Order Cancelled Refund: #${numPreOrderId} (${preOrder.item_name})`
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: `Pre-order #${numPreOrderId} cancelled and ${preOrder.total_amount} Credits refunded.`,
        refundedAmount: preOrder.total_amount
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get all pre-orders for a specific student
   */
  async getStudentPreOrders(studentId) {
    const numStudentId = parseInt(studentId, 10);
    const result = await db.query(`
      SELECT p.*, m.item_name, m.category, m.image_url, m.calories,
             (CASE WHEN p.scheduled_date > CURRENT_DATE AND p.status = 'confirmed' THEN TRUE ELSE FALSE END) as is_cancellable
      FROM pre_orders p
      JOIN menu_items m ON p.item_id = m.item_id
      WHERE p.student_id = $1
      ORDER BY p.scheduled_date DESC, p.pre_order_id DESC
    `, [numStudentId]);

    return result.rows;
  },

  /**
   * Chef / Admin: Get all pre-orders with optional date or item filters
   */
  async getAllPreOrders(filterDate, itemId) {
    let query = `
      SELECT p.*, m.item_name, m.category, m.image_url, m.calories,
             s.name as student_name, s.email as student_email, s.room_number, s.phone as student_phone
      FROM pre_orders p
      JOIN menu_items m ON p.item_id = m.item_id
      JOIN students s ON p.student_id = s.student_id
      WHERE 1=1
    `;
    const params = [];

    if (filterDate) {
      params.push(filterDate);
      query += ` AND p.scheduled_date = $${params.length}`;
    }

    if (itemId) {
      params.push(parseInt(itemId, 10));
      query += ` AND p.item_id = $${params.length}`;
    }

    query += ` ORDER BY p.scheduled_date ASC, p.pre_order_id ASC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Chef / Admin: Mark a pre-order as fulfilled when student picks up the dish
   */
  async fulfillPreOrder(preOrderId) {
    const numPreOrderId = parseInt(preOrderId, 10);
    const result = await db.query(`
      UPDATE pre_orders
      SET status = 'fulfilled', updated_at = NOW()
      WHERE pre_order_id = $1
      RETURNING *
    `, [numPreOrderId]);

    if (!result.rows.length) {
      throw new Error('Pre-order not found.');
    }

    return result.rows[0];
  }
};
