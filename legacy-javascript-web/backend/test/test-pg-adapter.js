import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function toPgSql(sql) {
  let paramIndex = 1;
  let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  // Replace SQLite specific functions
  pgSql = pgSql.replace(/datetime\('now',\s*'-10 minutes'\)/gi, "(NOW() - INTERVAL '10 minutes')");
  pgSql = pgSql.replace(/datetime\('now'\)/gi, "NOW()");
  pgSql = pgSql.replace(/CURRENT_TIMESTAMP/gi, "NOW()");
  
  return pgSql;
}

const db = {
  pool,
  async query(sql, params = []) {
    return pool.query(toPgSql(sql), params);
  },
  async get(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await pool.query(toPgSql(sql), flatParams);
    return res.rows[0] || null;
  },
  async all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await pool.query(toPgSql(sql), flatParams);
    return res.rows;
  },
  async run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    let pgSql = toPgSql(sql);
    
    // Automatically append RETURNING for inserts if not already present
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING *';
    }
    
    const res = await pool.query(pgSql, flatParams);
    const firstRow = res.rows[0] || {};
    const id = firstRow.student_id || firstRow.item_id || firstRow.order_id || firstRow.credit_id || firstRow.admin_id || firstRow.otp_id || firstRow.transaction_id || firstRow.id || 1;
    
    return {
      lastInsertRowid: id,
      changes: res.rowCount,
      rows: res.rows
    };
  },
  prepare(sql) {
    return {
      get: (...params) => this.get(sql, ...params),
      all: (...params) => this.all(sql, ...params),
      run: (...params) => this.run(sql, ...params)
    };
  },
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
  async exec(sql) {
    return pool.query(sql);
  }
};

async function testAdapter() {
  console.log('Testing PG Adapter...');
  const menu = await db.prepare('SELECT * FROM menu_items LIMIT 3').all();
  console.log('Fetched menu items:', menu.map(m => m.item_name));

  const count = await db.prepare('SELECT COUNT(*) as count FROM students').get();
  console.log('Total students:', count.count);

  await pool.end();
}

testAdapter();
