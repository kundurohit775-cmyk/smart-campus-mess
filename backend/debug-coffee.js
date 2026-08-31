import db from './src/db/database.js';
import { forecastService } from './src/services/forecastService.js';
import { productionService } from './src/services/productionService.js';

async function debugCoffee() {
  console.log('🔍 ====================================================================');
  console.log('   DEEP TRACE: ICED COLD COFFEE WITH ICE CREAM (ITEM_ID: 17)');
  console.log('======================================================================\n');

  const dishRes = await db.query('SELECT * FROM menu_items WHERE item_id = 17');
  const dish = dishRes.rows[0];
  console.log('1. MENU ITEM RECORD:');
  console.log(dish);

  const ordersRes = await db.query(`
    SELECT o.order_id, o.order_time, o.order_status, oi.quantity, DATE(o.order_time) as sale_date
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE oi.item_id = 17
    ORDER BY o.order_time DESC
  `);
  console.log(`\n2. ORDER ITEMS IN DATABASE for Item #17 (Total rows: ${ordersRes.rows.length}):`);
  console.table(ordersRes.rows);

  const preOrdersRes = await db.query(`
    SELECT * FROM pre_orders WHERE item_id = 17 ORDER BY scheduled_date DESC
  `);
  console.log(`\n3. PRE-ORDERS for Item #17 (Total rows: ${preOrdersRes.rows.length}):`);
  console.table(preOrdersRes.rows);

  const prodRes = await db.query(`
    SELECT * FROM production_records WHERE dish_id = 17 ORDER BY record_date DESC
  `);
  console.log(`\n4. PRODUCTION RECORDS for Item #17:`);
  console.table(prodRes.rows);

  const wastageRes = await db.query(`
    SELECT * FROM wastage_logs WHERE dish_id = 17 ORDER BY log_date DESC
  `);
  console.log(`\n5. WASTAGE LOGS for Item #17:`);
  console.table(wastageRes.rows);

  // Now run forecastService.getDishForecast(17) and trace step by step
  console.log('\n6. RUNNING forecastService.getDishForecast(17):');
  const forecast = await forecastService.getDishForecast(17);
  console.log(forecast);

  console.log('\n7. RUNNING productionService.calculateBaseline(17):');
  const baseline = await productionService.calculateBaseline(17);
  console.log('Baseline quantity:', baseline);

  console.log('\n8. RUNNING productionService.calculateRecommended(17):');
  const rec = await productionService.calculateRecommended(17);
  console.log('Recommended result:', rec);
}

debugCoffee().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
