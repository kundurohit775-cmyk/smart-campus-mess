import db from '../db/database.js';

export const wastageService = {
  /**
   * Quick-entry form preload: Fetch all active dishes with actual order sales count for a date
   */
  async getPreloadForDate(targetDate = null) {
    const targetDateStr = targetDate ? String(targetDate).split('T')[0] : new Date().toISOString().split('T')[0];

    // 1. Fetch active menu items
    const menuRes = await db.query(`
      SELECT item_id, item_name, category, price, available_quantity, image_url, fallback_image_url
      FROM menu_items
      WHERE is_active = 1
      ORDER BY category ASC, item_name ASC
    `);

    // 2. Fetch actual order sales counts for target date per dish
    const salesRes = await db.query(`
      SELECT 
        oi.item_id,
        SUM(oi.quantity) as actual_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.order_time) = $1 AND o.order_status != 'Cancelled'
      GROUP BY oi.item_id
    `, [targetDateStr]);

    const salesMap = new Map();
    salesRes.rows.forEach(r => salesMap.set(parseInt(r.item_id, 10), parseInt(r.actual_sold, 10)));

    // 3. Fetch existing wastage logs for target date if already logged
    const logsRes = await db.query(`
      SELECT log_id, dish_id, quantity_prepared, quantity_sold, quantity_wasted, reason
      FROM wastage_logs
      WHERE log_date = $1
    `, [targetDateStr]);

    const logsMap = new Map();
    logsRes.rows.forEach(l => logsMap.set(parseInt(l.dish_id, 10), l));

    return {
      date: targetDateStr,
      dishes: menuRes.rows.map(dish => {
        const dishId = parseInt(dish.item_id, 10);
        const existingLog = logsMap.get(dishId);
        const actualSold = salesMap.get(dishId) || 0;
        const defaultPrepared = existingLog ? existingLog.quantity_prepared : (actualSold > 0 ? actualSold : dish.available_quantity || 30);
        const defaultSold = existingLog ? existingLog.quantity_sold : actualSold;
        const defaultWasted = existingLog ? existingLog.quantity_wasted : Math.max(0, defaultPrepared - defaultSold);

        return {
          dishId,
          dishName: dish.item_name,
          category: dish.category,
          price: dish.price,
          actualSoldFromOrders: actualSold,
          isLogged: Boolean(existingLog),
          quantityPrepared: defaultPrepared,
          quantitySold: defaultSold,
          quantityWasted: defaultWasted,
          reason: existingLog ? existingLog.reason : 'overprepared'
        };
      })
    };
  },

  /**
   * Save / Upsert daily wastage log entries from Chef
   */
  async logWastage(chefId, entries) {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Please provide at least one wastage log entry.');
    }

    const numChefId = chefId ? parseInt(chefId, 10) : null;
    const savedRecords = [];

    for (const entry of entries) {
      const dishId = parseInt(entry.dishId || entry.dish_id || entry.itemId, 10);
      if (isNaN(dishId)) continue;

      const logDate = entry.logDate ? String(entry.logDate).split('T')[0] : new Date().toISOString().split('T')[0];
      const quantityPrepared = Math.max(0, parseInt(entry.quantityPrepared ?? entry.quantity_prepared ?? 0, 10));
      
      let quantitySold = parseInt(entry.quantitySold ?? entry.quantity_sold, 10);
      if (isNaN(quantitySold)) {
        // Auto-pull from actual order data for that date
        const salesRes = await db.query(`
          SELECT SUM(oi.quantity) as actual_sold
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE oi.item_id = $1 AND DATE(o.order_time) = $2 AND o.order_status != 'Cancelled'
        `, [dishId, logDate]);
        quantitySold = parseInt(salesRes.rows[0]?.actual_sold || 0, 10);
      }

      let quantityWasted = parseInt(entry.quantityWasted ?? entry.quantity_wasted, 10);
      if (isNaN(quantityWasted)) {
        quantityWasted = Math.max(0, quantityPrepared - quantitySold);
      }

      const reason = (entry.reason || 'overprepared').trim();

      const upsertRes = await db.query(`
        INSERT INTO wastage_logs (
          dish_id, chef_id, log_date, quantity_prepared, quantity_sold, quantity_wasted, reason, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (dish_id, log_date)
        DO UPDATE SET
          chef_id = EXCLUDED.chef_id,
          quantity_prepared = EXCLUDED.quantity_prepared,
          quantity_sold = EXCLUDED.quantity_sold,
          quantity_wasted = EXCLUDED.quantity_wasted,
          reason = EXCLUDED.reason,
          updated_at = NOW()
        RETURNING *
      `, [dishId, numChefId, logDate, quantityPrepared, quantitySold, quantityWasted, reason]);

      savedRecords.push(upsertRes.rows[0]);
    }

    return {
      message: `Successfully logged wastage for ${savedRecords.length} dish(es).`,
      recordsCount: savedRecords.length,
      records: savedRecords
    };
  },

  /**
   * Aggregated Wastage Trends over time (7d, 30d, or custom)
   */
  async getWastageTrends(period = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    // 1. Current period aggregates
    const currentRes = await db.query(`
      SELECT 
        w.log_date,
        SUM(w.quantity_prepared) as total_prepared,
        SUM(w.quantity_sold) as total_sold,
        SUM(w.quantity_wasted) as total_wasted,
        COUNT(DISTINCT w.dish_id) as dishes_logged
      FROM wastage_logs w
      WHERE w.log_date >= CURRENT_DATE - ($1 || ' days')::INTERVAL
      GROUP BY w.log_date
      ORDER BY w.log_date ASC
    `, [days]);

    // 2. Previous period aggregates for trend comparison
    const previousRes = await db.query(`
      SELECT 
        SUM(w.quantity_prepared) as prev_prepared,
        SUM(w.quantity_sold) as prev_sold,
        SUM(w.quantity_wasted) as prev_wasted
      FROM wastage_logs w
      WHERE w.log_date >= CURRENT_DATE - ($1 || ' days')::INTERVAL
        AND w.log_date < CURRENT_DATE - ($2 || ' days')::INTERVAL
    `, [days * 2, days]);

    let totalPrepared = 0;
    let totalSold = 0;
    let totalWasted = 0;

    const dailyTrends = currentRes.rows.map(r => {
      const prep = parseInt(r.total_prepared, 10);
      const sold = parseInt(r.total_sold, 10);
      const waste = parseInt(r.total_wasted, 10);
      totalPrepared += prep;
      totalSold += sold;
      totalWasted += waste;

      const wastePct = prep > 0 ? Math.round((waste / prep) * 1000) / 10 : 0;
      return {
        date: String(r.log_date).split('T')[0],
        dayName: new Date(r.log_date).toLocaleDateString([], { weekday: 'short' }),
        prepared: prep,
        sold,
        wasted: waste,
        wastagePercentage: wastePct
      };
    });

    const wastagePercentage = totalPrepared > 0 
      ? Math.round((totalWasted / totalPrepared) * 1000) / 10 
      : 0;

    // Previous period trend comparison
    const prevPrepared = parseInt(previousRes.rows[0]?.prev_prepared || 0, 10);
    const prevWasted = parseInt(previousRes.rows[0]?.prev_wasted || 0, 10);
    const prevWastagePct = prevPrepared > 0 ? Math.round((prevWasted / prevPrepared) * 1000) / 10 : 0;

    let trendDirection = 'stable';
    let pctDifference = 0;
    let trendBadgeText = 'Wastage stable';
    let isPositiveTrend = true;

    if (prevPrepared > 0) {
      pctDifference = Math.round(Math.abs(wastagePercentage - prevWastagePct) * 10) / 10;
      if (wastagePercentage < prevWastagePct) {
        trendDirection = 'improving';
        isPositiveTrend = true;
        trendBadgeText = `Wastage down ${pctDifference}% this ${period === '7d' ? 'week' : 'month'}`;
      } else if (wastagePercentage > prevWastagePct) {
        trendDirection = 'worsening';
        isPositiveTrend = false;
        trendBadgeText = `Wastage up ${pctDifference}% this ${period === '7d' ? 'week' : 'month'}`;
      } else {
        trendDirection = 'stable';
        isPositiveTrend = true;
        trendBadgeText = `Wastage unchanged`;
      }
    } else {
      trendBadgeText = `${wastagePercentage}% avg waste rate`;
    }

    // 3. Top wasted dishes breakdown
    const dishBreakdownRes = await db.query(`
      SELECT 
        m.item_id as dish_id,
        m.item_name as dish_name,
        m.category,
        SUM(w.quantity_prepared) as total_prepared,
        SUM(w.quantity_sold) as total_sold,
        SUM(w.quantity_wasted) as total_wasted,
        ROUND((SUM(w.quantity_wasted)::numeric / NULLIF(SUM(w.quantity_prepared), 0)::numeric) * 100, 1) as waste_percentage,
        COUNT(w.log_id) as log_count
      FROM wastage_logs w
      JOIN menu_items m ON w.dish_id = m.item_id
      WHERE w.log_date >= CURRENT_DATE - ($1 || ' days')::INTERVAL
      GROUP BY m.item_id, m.item_name, m.category
      ORDER BY total_wasted DESC
      LIMIT 10
    `, [days]);

    // 4. Wastage Reason distribution
    const reasonRes = await db.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(reason), ''), 'Unspecified') as reason_name,
        SUM(quantity_wasted) as wasted_count,
        COUNT(*) as occurrence_count
      FROM wastage_logs
      WHERE log_date >= CURRENT_DATE - ($1 || ' days')::INTERVAL AND quantity_wasted > 0
      GROUP BY reason_name
      ORDER BY wasted_count DESC
    `, [days]);

    return {
      period,
      days,
      summary: {
        totalPrepared,
        totalSold,
        totalWasted,
        wastagePercentage,
        previousWastagePercentage: prevWastagePct,
        trendDirection,
        trendBadgeText,
        isPositiveTrend,
        pctDifference
      },
      dailyTrends,
      topWastedDishes: dishBreakdownRes.rows.map(r => ({
        dishId: parseInt(r.dish_id, 10),
        dishName: r.dish_name,
        category: r.category,
        totalPrepared: parseInt(r.total_prepared, 10),
        totalSold: parseInt(r.total_sold, 10),
        totalWasted: parseInt(r.total_wasted, 10),
        wastePercentage: parseFloat(r.waste_percentage || 0),
        logCount: parseInt(r.log_count, 10)
      })),
      reasonBreakdown: reasonRes.rows.map(r => ({
        reason: r.reason_name,
        wastedPortions: parseInt(r.wasted_count, 10),
        occurrences: parseInt(r.occurrence_count, 10)
      }))
    };
  },

  /**
   * Platform-wide Wastage & Sustainability Summary for Admin
   */
  async getAdminSummary() {
    const trends30d = await this.getWastageTrends('30d');
    const trends7d = await this.getWastageTrends('7d');

    const totalSavedMeals = Math.max(0, Math.round(trends30d.summary.totalSold * 0.12));
    const efficiencyRate = trends30d.summary.totalPrepared > 0
      ? Math.round((trends30d.summary.totalSold / trends30d.summary.totalPrepared) * 1000) / 10
      : 92.4;

    return {
      totalPrepared30d: trends30d.summary.totalPrepared,
      totalSold30d: trends30d.summary.totalSold,
      totalWasted30d: trends30d.summary.totalWasted,
      wastageRate: trends30d.summary.wastagePercentage,
      kitchenEfficiency: efficiencyRate,
      trendBadgeText: trends30d.summary.trendBadgeText,
      isPositiveTrend: trends30d.summary.isPositiveTrend,
      estimatedSavedPortions: totalSavedMeals,
      trends30d,
      trends7d
    };
  }
};
