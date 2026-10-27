import pg from 'pg';
import { config } from '../config/config.js';

// Initialize PostgreSQL Pool
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL pool background warning (non-fatal):', err.message);
});

/**
 * Translates generic SQL (? placeholders and SQLite timestamp functions) into PostgreSQL syntax
 */
function toPgSql(sql) {
  let paramIndex = 1;
  let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  // Replace SQLite specific functions with PostgreSQL equivalents
  pgSql = pgSql.replace(/datetime\('now',\s*'-10 minutes'\)/gi, "(NOW() - INTERVAL '10 minutes')");
  pgSql = pgSql.replace(/datetime\('now'\)/gi, "NOW()");
  pgSql = pgSql.replace(/CURRENT_TIMESTAMP/gi, "NOW()");
  pgSql = pgSql.replace(/IFNULL/gi, "COALESCE");
  
  return pgSql;
}

export const db = {
  pool,

  /**
   * Execute raw query with parameterized values
   */
  async query(sql, params = []) {
    return pool.query(toPgSql(sql), params);
  },

  /**
   * Fetch single row
   */
  async get(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await pool.query(toPgSql(sql), flatParams);
    return res.rows[0] || null;
  },

  /**
   * Fetch all rows
   */
  async all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await pool.query(toPgSql(sql), flatParams);
    return res.rows;
  },

  /**
   * Execute insert, update, or delete query and return result with inserted ID
   */
  async run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    let pgSql = toPgSql(sql);
    
    // Automatically append RETURNING for inserts if not present to capture generated IDs
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING *';
    }
    
    const res = await pool.query(pgSql, flatParams);
    const firstRow = res.rows[0] || {};
    const id = firstRow.order_item_id ??
               firstRow.order_id ??
               firstRow.transaction_id ??
               firstRow.credit_id ??
               firstRow.otp_id ??
               firstRow.item_id ??
               firstRow.admin_id ??
               firstRow.student_id ??
               firstRow.id ?? 1;
    
    return {
      lastInsertRowid: id,
      changes: res.rowCount,
      rows: res.rows
    };
  },

  /**
   * Prepared statement interface for backward-compatible query execution
   */
  prepare(sql) {
    return {
      get: (...params) => this.get(sql, ...params),
      all: (...params) => this.all(sql, ...params),
      run: (...params) => this.run(sql, ...params)
    };
  },

  /**
   * Execute block in atomic PostgreSQL transaction
   */
  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Execute multiple SQL statements
   */
  async exec(sql) {
    return pool.query(sql);
  }
};

export default db;
