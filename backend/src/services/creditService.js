import db from '../db/database.js';
import { config } from '../config/config.js';

export const creditService = {
  /**
   * Get or automatically initialize monthly credits for a student in PostgreSQL.
   * Auto-refreshes to 9,000 allowance at the beginning of each new month.
   */
  async getOrCreateMonthlyCredits(studentId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const selectStmt = db.prepare(`
      SELECT * FROM credits 
      WHERE student_id = ? AND month = ? AND year = ?
    `);
    
    let credit = await selectStmt.get(studentId, currentMonth, currentYear);

    if (!credit) {
      // Auto-initialize new monthly credit allowance inside PostgreSQL
      await db.run(`
        INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
        VALUES (?, ?, 0, ?, ?, ?)
        ON CONFLICT (student_id, month, year) DO NOTHING
      `, studentId, config.monthlyCreditLimit, config.monthlyCreditLimit, currentMonth, currentYear);

      const monthName = now.toLocaleString('default', { month: 'long' });
      await db.run(`
        INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
        VALUES (?, NULL, ?, 'MONTHLY_ALLOWANCE', ?, ?)
      `, studentId, config.monthlyCreditLimit, config.monthlyCreditLimit, `Automatic monthly credit allocation for ${monthName} ${currentYear}`);

      credit = await selectStmt.get(studentId, currentMonth, currentYear);
    }

    if (!credit) {
      credit = {
        student_id: studentId,
        monthly_limit: config.monthlyCreditLimit,
        used_credits: 0,
        remaining_credits: config.monthlyCreditLimit,
        month: currentMonth,
        year: currentYear
      };
    }

    return {
      ...credit,
      remaining_credits: Number(credit.remaining_credits),
      used_credits: Number(credit.used_credits),
      monthly_limit: Number(credit.monthly_limit),
      is_low_balance: Number(credit.remaining_credits) < config.lowCreditThreshold
    };
  },

  /**
   * Manual credit adjustment by Admin
   */
  async adjustStudentCredits(studentId, adjustmentAmount, reason) {
    const credit = await this.getOrCreateMonthlyCredits(studentId);
    const newRemaining = credit.remaining_credits + adjustmentAmount;

    if (newRemaining < 0) {
      throw new Error(`Cannot deduct ${Math.abs(adjustmentAmount)} credits. Student only has ${credit.remaining_credits} credits.`);
    }

    await db.run(`
      UPDATE credits 
      SET remaining_credits = ?, updated_at = NOW()
      WHERE credit_id = ?
    `, newRemaining, credit.credit_id);

    await db.run(`
      INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
      VALUES (?, NULL, ?, 'ADMIN_ADJUSTMENT', ?, ?)
    `, studentId, adjustmentAmount, newRemaining, reason || 'Admin manual balance adjustment');

    return {
      credit_id: credit.credit_id,
      student_id: studentId,
      remaining_credits: newRemaining,
      adjustment: adjustmentAmount
    };
  },

  /**
   * Admin Reset credits to full monthly limit (9,000)
   */
  async resetMonthlyCredits(studentId) {
    const credit = await this.getOrCreateMonthlyCredits(studentId);
    const diff = config.monthlyCreditLimit - credit.remaining_credits;

    await db.run(`
      UPDATE credits 
      SET remaining_credits = ?, used_credits = 0, updated_at = NOW()
      WHERE credit_id = ?
    `, config.monthlyCreditLimit, credit.credit_id);

    await db.run(`
      INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
      VALUES (?, NULL, ?, 'ADMIN_ADJUSTMENT', ?, ?)
    `, studentId, diff, config.monthlyCreditLimit, 'Admin reset monthly balance to full limit (9,000)');

    return await this.getOrCreateMonthlyCredits(studentId);
  }
};
