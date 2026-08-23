import db from '../db/database.js';
import { creditService } from './creditService.js';

export const orderService = {
  /**
   * ATOMIC ORDER PLACEMENT IN POSTGRESQL
   */
  async placeOrder(studentId, items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    const numericStudentId = parseInt(studentId, 10);

    // 1. Fetch current student credits
    const creditRecord = await creditService.getOrCreateMonthlyCredits(numericStudentId);

    // 2. Fetch and validate all ordered menu items from DB
    const itemIds = items.map(i => parseInt(i.itemId || i.item_id || i.id, 10)).filter(id => !isNaN(id));
    
    if (itemIds.length === 0) {
      throw new Error('Invalid item IDs in order request.');
    }

    const placeholders = itemIds.map((_, idx) => `$${idx + 1}`).join(',');
    const dbItemsRes = await db.pool.query(`
      SELECT item_id, item_name, price, available_quantity, is_active 
      FROM menu_items 
      WHERE item_id IN (${placeholders})
    `, itemIds);
    const dbItems = dbItemsRes.rows;

    const itemMap = new Map();
    for (const item of dbItems) {
      itemMap.set(parseInt(item.item_id, 10), item);
      itemMap.set(String(item.item_id), item);
    }

    let totalAmount = 0;
    const orderItemsToInsert = [];

    for (const itemReq of items) {
      const rawId = itemReq.itemId ?? itemReq.item_id ?? itemReq.id;
      const lookupId = parseInt(rawId, 10);
      const dbItem = itemMap.get(lookupId) || itemMap.get(rawId);
      const qty = parseInt(itemReq.quantity, 10);

      if (!dbItem) {
        throw new Error(`Item ID #${rawId || 'Unknown'} was not found in the menu.`);
      }

      const isActive = dbItem.is_active === 1 || dbItem.is_active === true || dbItem.is_active === '1' || dbItem.is_active === 'true';
      if (!isActive) {
        throw new Error(`Item "${dbItem.item_name}" is currently inactive or not available.`);
      }

      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for item "${dbItem.item_name}".`);
      }

      const stock = dbItem.available_quantity ?? dbItem.availability ?? 0;
      if (stock < qty) {
        throw new Error(`Item "${dbItem.item_name}" is sold out or only ${stock} left in stock.`);
      }

      const subtotal = Number(dbItem.price) * qty;
      totalAmount += subtotal;

      orderItemsToInsert.push({
        itemId: parseInt(dbItem.item_id, 10),
        name: dbItem.item_name,
        quantity: qty,
        price: Number(dbItem.price),
        subtotal
      });
    }

    // 3. Verify student credit balance
    if (creditRecord.remaining_credits < totalAmount) {
      throw new Error(`Insufficient credits. Required: ${totalAmount} credits, Available: ${creditRecord.remaining_credits} credits.`);
    }

    // 4. Deduct student credits
    const newRemaining = creditRecord.remaining_credits - totalAmount;
    const newUsed = creditRecord.used_credits + totalAmount;

    await db.run(`
      UPDATE credits 
      SET remaining_credits = ?, used_credits = ?, updated_at = NOW()
      WHERE credit_id = ?
    `, newRemaining, newUsed, creditRecord.credit_id);

    // 5. Decrement available_quantity for each menu item in PostgreSQL
    for (const item of orderItemsToInsert) {
      await db.run(`
        UPDATE menu_items 
        SET available_quantity = available_quantity - ? 
        WHERE item_id = ?
      `, item.quantity, item.itemId);
    }

    // 6. Generate order token & insert order record
    const tokenNumber = Math.floor(1000 + Math.random() * 9000);
    const pickupToken = `TK-${tokenNumber}`;

    const orderResult = await db.run(`
      INSERT INTO orders (student_id, total_amount, order_status, pickup_token, order_time)
      VALUES (?, ?, 'Pending', ?, NOW())
    `, numericStudentId, totalAmount, pickupToken);
    const orderId = orderResult.lastInsertRowid;

    // 7. Insert order items
    for (const item of orderItemsToInsert) {
      await db.run(`
        INSERT INTO order_items (order_id, item_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, orderId, item.itemId, item.quantity, item.price, item.subtotal);
    }

    // 8. Log the debit transaction
    await db.run(`
      INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
      VALUES (?, ?, ?, 'DEBIT_ORDER', ?, ?)
    `, numericStudentId, orderId, totalAmount, newRemaining, `Order #${orderId} (${pickupToken}) - ${orderItemsToInsert.length} item(s)`);

    return {
      orderId,
      pickupToken,
      totalAmount,
      orderStatus: 'Pending',
      remainingCredits: newRemaining,
      items: orderItemsToInsert
    };
  },

  /**
   * ATOMIC ORDER CANCELLATION & REFUND
   * Allowed ONLY if status is 'Pending'.
   */
  async cancelOrder(orderId, studentId, isStaffOrAdmin = false) {
    const numericOrderId = parseInt(orderId, 10);
    const numericStudentId = parseInt(studentId, 10);

    const order = await db.get(`
      SELECT order_id, student_id, total_amount, order_status, pickup_token 
      FROM orders 
      WHERE order_id = ?
    `, numericOrderId);

    if (!order) {
      throw new Error(`Order #${numericOrderId} not found.`);
    }

    if (!isStaffOrAdmin && order.student_id !== numericStudentId) {
      throw new Error('Unauthorized to cancel this order.');
    }

    if (order.order_status !== 'Pending') {
      throw new Error(
        `Cannot cancel order #${numericOrderId}. Current status is "${order.order_status}". Cancellation is only permitted while the order is "Pending".`
      );
    }

    // Mark order as Cancelled
    await db.run(`
      UPDATE orders 
      SET order_status = 'Cancelled', completed_time = NOW() 
      WHERE order_id = ?
    `, numericOrderId);

    // Restore menu item stock
    const orderItems = await db.all(`
      SELECT item_id, quantity FROM order_items WHERE order_id = ?
    `, numericOrderId);

    for (const item of orderItems) {
      await db.run(`
        UPDATE menu_items 
        SET available_quantity = available_quantity + ? 
        WHERE item_id = ?
      `, item.quantity, item.item_id);
    }

    // Refund credits to student
    const creditRecord = await creditService.getOrCreateMonthlyCredits(order.student_id);
    const refundedRemaining = creditRecord.remaining_credits + Number(order.total_amount);
    const refundedUsed = Math.max(0, creditRecord.used_credits - Number(order.total_amount));

    await db.run(`
      UPDATE credits 
      SET remaining_credits = ?, used_credits = ?, updated_at = NOW()
      WHERE credit_id = ?
    `, refundedRemaining, refundedUsed, creditRecord.credit_id);

    await db.run(`
      INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
      VALUES (?, ?, ?, 'CREDIT_REFUND', ?, ?)
    `, order.student_id, numericOrderId, order.total_amount, refundedRemaining, `Refund for cancelled Order #${numericOrderId} (${order.pickup_token})`);

    return {
      orderId: numericOrderId,
      orderStatus: 'Cancelled',
      refundedAmount: order.total_amount,
      balanceAfter: refundedRemaining
    };
  },

  /**
   * Update Order Status (Chef / Staff)
   */
  async updateOrderStatus(orderId, newStatus) {
    const validStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
    }

    const numericOrderId = parseInt(orderId, 10);
    const order = await db.get('SELECT * FROM orders WHERE order_id = ?', numericOrderId);
    if (!order) {
      throw new Error(`Order #${numericOrderId} not found.`);
    }

    const isCompleted = newStatus === 'Completed' || newStatus === 'Cancelled';
    const completedTime = isCompleted ? new Date().toISOString() : null;

    await db.run(`
      UPDATE orders 
      SET order_status = ?, completed_time = COALESCE(?, completed_time) 
      WHERE order_id = ?
    `, newStatus, completedTime, numericOrderId);

    return await this.getOrderById(numericOrderId);
  },

  /**
   * Fetch single order with items
   */
  async getOrderById(orderId) {
    const numericOrderId = parseInt(orderId, 10);
    const order = await db.get(`
      SELECT o.*, s.name as student_name, s.email as student_email, s.room_number
      FROM orders o
      JOIN students s ON o.student_id = s.student_id
      WHERE o.order_id = ?
    `, numericOrderId);

    if (!order) return null;

    const items = await db.all(`
      SELECT oi.*, m.item_name, m.category, m.image_url
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      WHERE oi.order_id = ?
    `, numericOrderId);

    return {
      ...order,
      items
    };
  },

  /**
   * Fetch all orders for a student
   */
  async getOrdersByStudentId(studentId) {
    const numericStudentId = parseInt(studentId, 10);
    const orders = await db.all(`
      SELECT * FROM orders 
      WHERE student_id = ? 
      ORDER BY order_id DESC
    `, numericStudentId);

    const fullOrders = [];
    for (const order of orders) {
      const items = await db.all(`
        SELECT oi.*, m.item_name, m.category, m.image_url
        FROM order_items oi
        JOIN menu_items m ON oi.item_id = m.item_id
        WHERE oi.order_id = ?
      `, order.order_id);
      fullOrders.push({ ...order, items });
    }

    return fullOrders;
  },

  /**
   * Fetch all orders (Chef & Admin)
   */
  async getAllOrders(statusFilter = null) {
    let query = `
      SELECT o.*, s.name as student_name, s.email as student_email, s.room_number
      FROM orders o
      JOIN students s ON o.student_id = s.student_id
    `;
    const params = [];

    if (statusFilter && statusFilter !== 'All') {
      query += ` WHERE o.order_status = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY o.order_id DESC`;

    const orders = await db.all(query, ...params);

    const fullOrders = [];
    for (const order of orders) {
      const items = await db.all(`
        SELECT oi.*, m.item_name, m.category, m.image_url
        FROM order_items oi
        JOIN menu_items m ON oi.item_id = m.item_id
        WHERE oi.order_id = ?
      `, order.order_id);
      fullOrders.push({ ...order, items });
    }

    return fullOrders;
  }
};
