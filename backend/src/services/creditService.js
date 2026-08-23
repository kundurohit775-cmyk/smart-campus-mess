import db from '../db/database.js';
import { config } from '../config/config.js';

export const creditService = {
  /**
   * Get or automatically initialize monthly credits for a student.
   * Auto-refreshes to 9,000 allowance at the beginning of each new month.
   */
  getOrCreateMonthlyCredits(studentId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const selectStmt = db.prepare(`
      SELECT * FROM credits 
      WHERE student_id = ? AND month = ? AND year = ?
    `);
    
    let credit = selectStmt.get(studentId, currentMonth, currentYear);

    if (!credit) {
      // Auto-initialize new monthly credit allowance inside a transaction
      const initTx = db.transaction(() => {
        const insertStmt = db.prepare(`
          INSERT INTO credits (student_id, monthly_limit, used_credits, remaining_credits, month, year)
          VALUES (?, ?, 0, ?, ?, ?)
        `);
        
        insertStmt.run(studentId, config.monthlyCreditLimit, config.monthlyCreditLimit, currentMonth, currentYear);

        const logTx = db.prepare(`
          INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
          VALUES (?, NULL, ?, 'MONTHLY_ALLOWANCE', ?, ?)
        `);
        
        const monthName = now.toLocaleString('default', { month: 'long' });
        logTx.run(studentId, config.monthlyCreditLimit, config.monthlyCreditLimit, `Automatic monthly credit allocation for ${monthName} ${currentYear}`);

        return selectStmt.get(studentId, currentMonth, currentYear);
      });

      credit = initTx();
    }

    return {
      ...credit,
      is_low_balance: credit.remaining_credits < config.lowCreditThreshold
    };
  },

  /**
   * Manual credit adjustment by Admin
   */
  adjustStudentCredits(studentId, adjustmentAmount, reason) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const adjustTx = db.transaction(() => {
      // Make sure credit row exists
      const credit = this.getOrCreateMonthlyCredits(studentId);
      const newRemaining = credit.remaining_credits + adjustmentAmount;

      if (newRemaining < 0) {
        throw new Error(`Cannot deduct ${Math.abs(adjustmentAmount)} credits. Student only has ${credit.remaining_credits} credits.`);
      }

      const updateStmt = db.prepare(`
        UPDATE credits 
        SET remaining_credits = ?, updated_at = CURRENT_TIMESTAMP
        WHERE credit_id = ?
      `);
      updateStmt.run(newRemaining, credit.credit_id);

      const logStmt = db.prepare(`
        INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
        VALUES (?, NULL, ?, 'ADMIN_ADJUSTMENT', ?, ?)
      `);
      logStmt.run(studentId, adjustmentAmount, newRemaining, reason || 'Admin manual balance adjustment');

      return {
        credit_id: credit.credit_id,
        student_id: studentId,
        remaining_credits: newRemaining,
        adjustment: adjustmentAmount
      };
    });

    return adjustTx();
  },

  /**
   * Admin Reset credits to full monthly limit (9,000)
   */
  resetMonthlyCredits(studentId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const resetTx = db.transaction(() => {
      const credit = this.getOrCreateMonthlyCredits(studentId);
      const diff = config.monthlyCreditLimit - credit.remaining_credits;

      const updateStmt = db.prepare(`
        UPDATE credits 
        SET remaining_credits = ?, used_credits = 0, updated_at = CURRENT_TIMESTAMP
        WHERE credit_id = ?
      `);
      updateStmt.run(config.monthlyCreditLimit, credit.credit_id);

      const logStmt = db.prepare(`
        INSERT INTO transactions (student_id, order_id, amount, transaction_type, balance_after, notes)
        VALUES (?, NULL, ?, 'ADMIN_ADJUSTMENT', ?, ?)
      `);
      logStmt.run(studentId, diff, config.monthlyCreditLimit, 'Admin reset monthly balance to full limit (9,000)');

      return this.getOrCreateMonthlyCredits(studentId);
    });

    return resetTx();
  }
};
