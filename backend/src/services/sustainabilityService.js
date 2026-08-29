import db from '../db/database.js';

/**
 * =========================================================================================
 * SUSTAINABILITY & FOOD SAVED CALCULATION ENGINE
 * =========================================================================================
 * 
 * CORE METHODOLOGY & ASSUMPTIONS:
 * --------------------------------
 * 1. The Pre-Order Demand Precision Model:
 *    Institutional and campus mess kitchens routinely overprepare specialty/limited batch
 *    dishes by 20% to 30% when guessing walk-in attendance, to ensure they do not run out.
 * 
 *    By shifting special dishes to the Next-Day Special Pre-Order system, the kitchen
 *    prepares the EXACT count of confirmed student reservations — preventing overproduction.
 * 
 * 2. Quantitative Formulas:
 *    - OVERPREP_BASELINE_RATE = 0.25 (25% baseline overprep buffer without pre-orders)
 *    - Portions_Saved = ROUND( Quantity_Preordered * OVERPREP_BASELINE_RATE )
 *    - kg_Saved = Portions_Saved * Portion_Weight_kg  [Floored at 0]
 *    - CO2e_Avoided_kg = kg_Saved * 2.5  (FAO/EPA benchmark: 2.5 kg CO2e per 1 kg food waste)
 *    - Water_Saved_Liters = kg_Saved * 180 (Agricultural water lifecycle conservation)
 * =========================================================================================
 */

export const OVERPREP_BASELINE_RATE = 0.25;
export const DEFAULT_PORTION_WEIGHT_KG = 0.450; // 450 grams average meal portion
export const CO2_FACTOR_PER_KG = 2.5; // kg CO2e avoided per kg food saved
export const WATER_FACTOR_PER_KG = 180; // Liters of agricultural water conserved per kg

export const sustainabilityService = {
  /**
   * Sync and recalculate sustainability metrics from pre-orders
   */
  async syncMetrics() {
    // 1. Group all confirmed or fulfilled pre-orders by item_id and scheduled_date
    const aggregatedRes = await db.query(`
      SELECT 
        po.item_id,
        po.scheduled_date,
        SUM(po.quantity) as total_preordered,
        COUNT(po.pre_order_id) as orders_count,
        COALESCE(m.portion_weight_kg, $1) as portion_weight_kg
      FROM pre_orders po
      JOIN menu_items m ON po.item_id = m.item_id
      WHERE po.status IN ('confirmed', 'fulfilled')
      GROUP BY po.item_id, po.scheduled_date, m.portion_weight_kg
    `, [DEFAULT_PORTION_WEIGHT_KG]);

    for (const row of aggregatedRes.rows) {
      const dishId = parseInt(row.item_id, 10);
      let batchDateStr;
      if (row.scheduled_date instanceof Date) {
        batchDateStr = row.scheduled_date.toISOString().split('T')[0];
      } else if (typeof row.scheduled_date === 'string') {
        batchDateStr = row.scheduled_date.split('T')[0];
      } else {
        batchDateStr = new Date(row.scheduled_date).toISOString().split('T')[0];
      }
      const preordered = parseInt(row.total_preordered, 10);
      const weightKg = parseFloat(row.portion_weight_kg) || DEFAULT_PORTION_WEIGHT_KG;

      // Estimated quantity kitchen would have prepared without pre-orders
      const estimatedWithout = Math.round(preordered * (1 + OVERPREP_BASELINE_RATE));
      const portionsSaved = Math.max(0, estimatedWithout - preordered);
      const kgSaved = Math.round(portionsSaved * weightKg * 100) / 100;
      const co2AvoidedKg = Math.round(kgSaved * CO2_FACTOR_PER_KG * 100) / 100;

      await db.query(`
        INSERT INTO sustainability_metrics (
          dish_id, batch_date, quantity_preordered, portion_weight_kg,
          estimated_qty_without_preorder, kg_saved, co2_avoided_kg, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (dish_id, batch_date)
        DO UPDATE SET
          quantity_preordered = EXCLUDED.quantity_preordered,
          portion_weight_kg = EXCLUDED.portion_weight_kg,
          estimated_qty_without_preorder = EXCLUDED.estimated_qty_without_preorder,
          kg_saved = EXCLUDED.kg_saved,
          co2_avoided_kg = EXCLUDED.co2_avoided_kg,
          updated_at = NOW()
      `, [dishId, batchDateStr, preordered, weightKg, estimatedWithout, kgSaved, co2AvoidedKg]);
    }
  },

  /**
   * Public stats endpoint payload (Unauthenticated)
   */
  async getPublicFoodSavedStats() {
    // Ensure metrics are synced
    await this.syncMetrics();

    // 1. All-time cumulative totals
    const totalsRes = await db.query(`
      SELECT 
        COALESCE(SUM(kg_saved), 0) as all_time_kg_saved,
        COALESCE(SUM(co2_avoided_kg), 0) as all_time_co2_avoided,
        COALESCE(SUM(quantity_preordered), 0) as total_preordered_portions
      FROM sustainability_metrics
    `);

    // 2. This Month totals (current calendar month)
    const monthRes = await db.query(`
      SELECT 
        COALESCE(SUM(kg_saved), 0) as month_kg_saved,
        COALESCE(SUM(co2_avoided_kg), 0) as month_co2_avoided,
        COALESCE(SUM(quantity_preordered), 0) as month_preordered_portions
      FROM sustainability_metrics
      WHERE batch_date >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // 3. This Week totals (starting Monday)
    const weekRes = await db.query(`
      SELECT 
        COALESCE(SUM(kg_saved), 0) as week_kg_saved,
        COALESCE(SUM(co2_avoided_kg), 0) as week_co2_avoided,
        COALESCE(SUM(quantity_preordered), 0) as week_preordered_portions
      FROM sustainability_metrics
      WHERE batch_date >= DATE_TRUNC('week', CURRENT_DATE)
    `);

    // 4. Student participation & orders count from pre_orders
    const participationRes = await db.query(`
      SELECT 
        COUNT(DISTINCT student_id) as unique_students,
        COUNT(pre_order_id) as total_pre_orders
      FROM pre_orders
      WHERE status IN ('confirmed', 'fulfilled')
    `);

    // 5. Timeline data (weekly breakdown for the past 12 weeks)
    const timelineRes = await db.query(`
      SELECT 
        DATE_TRUNC('week', batch_date) as week_start,
        SUM(kg_saved) as week_kg,
        SUM(co2_avoided_kg) as week_co2,
        SUM(quantity_preordered) as week_portions
      FROM sustainability_metrics
      WHERE batch_date >= CURRENT_DATE - INTERVAL '84 days'
      GROUP BY DATE_TRUNC('week', batch_date)
      ORDER BY week_start ASC
    `);

    // 6. Top contributing dishes
    const topDishesRes = await db.query(`
      SELECT 
        m.item_id,
        m.item_name,
        m.category,
        m.image_url,
        m.fallback_image_url,
        SUM(s.quantity_preordered) as total_portions_preordered,
        SUM(s.kg_saved) as total_kg_saved,
        SUM(s.co2_avoided_kg) as total_co2_avoided
      FROM sustainability_metrics s
      JOIN menu_items m ON s.dish_id = m.item_id
      GROUP BY m.item_id, m.item_name, m.category, m.image_url, m.fallback_image_url
      ORDER BY total_kg_saved DESC
      LIMIT 6
    `);

    const allTimeKg = parseFloat(totalsRes.rows[0]?.all_time_kg_saved || 0);
    const monthKg = parseFloat(monthRes.rows[0]?.month_kg_saved || 0);
    const weekKg = parseFloat(weekRes.rows[0]?.week_kg_saved || 0);
    const allTimeCo2 = parseFloat(totalsRes.rows[0]?.all_time_co2_avoided || 0);
    const uniqueStudents = parseInt(participationRes.rows[0]?.unique_students || 0, 10);
    const totalPreOrders = parseInt(participationRes.rows[0]?.total_pre_orders || 0, 10);

    const waterSavedLiters = Math.round(allTimeKg * WATER_FACTOR_PER_KG);
    const mealsEquivalent = Math.round(allTimeKg / DEFAULT_PORTION_WEIGHT_KG);

    const timeline = timelineRes.rows.map(r => {
      const d = new Date(r.week_start);
      return {
        weekStart: d.toISOString().split('T')[0],
        weekLabel: `Week of ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        kgSaved: parseFloat(r.week_kg || 0),
        co2AvoidedKg: parseFloat(r.week_co2 || 0),
        portionsPreordered: parseInt(r.week_portions || 0, 10)
      };
    });

    return {
      metrics: {
        allTimeKgSaved: Math.round(allTimeKg * 10) / 10,
        thisMonthKgSaved: Math.round(monthKg * 10) / 10,
        thisWeekKgSaved: Math.round(weekKg * 10) / 10,
        co2AvoidedKg: Math.round(allTimeCo2 * 10) / 10,
        waterSavedLiters,
        mealsEquivalent,
        uniqueStudentsCount: uniqueStudents,
        totalPreOrdersCount: totalPreOrders
      },
      timeline,
      topDishes: topDishesRes.rows.map(d => ({
        dishId: parseInt(d.item_id, 10),
        dishName: d.item_name,
        category: d.category,
        image: d.image_url || d.fallback_image_url,
        portionsPreordered: parseInt(d.total_portions_preordered, 10),
        kgSaved: Math.round(parseFloat(d.total_kg_saved) * 10) / 10,
        co2AvoidedKg: Math.round(parseFloat(d.total_co2_avoided) * 10) / 10
      })),
      methodology: {
        baselineOverprepRate: `${OVERPREP_BASELINE_RATE * 100}%`,
        averagePortionWeight: `${DEFAULT_PORTION_WEIGHT_KG * 1000} grams`,
        co2ePerKg: `${CO2_FACTOR_PER_KG} kg CO2e / kg food`,
        explanation: "Estimated by comparing historical batch overpreparation rates (25%) without reservations against exact demand-matched quantities under the Next-Day Special Pre-Order system."
      },
      updatedAt: new Date().toISOString()
    };
  }
};
