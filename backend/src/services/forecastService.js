import db from '../db/database.js';

/**
 * =========================================================================================
 * AI-ASSISTED DEMAND FORECASTING ENGINE
 * =========================================================================================
 * 
 * METHODOLOGY & SIGNAL FLOW:
 * --------------------------
 * 1. Historical Dataset (Unified Feedback Loop):
 *    Aggregates completed daily demand across:
 *    - Actual completed student orders (order_items)
 *    - Production records (pre-orders + on-spot total demand / collected)
 *    - Chef-logged wastage actual sales
 * 
 * 2. Stage 1: Recency-Weighted Moving Average (Exponential Smoothing / WMA)
 *    w_i = (1 - alpha)^(n - 1 - i)   where alpha = 0.35
 *    WMA = SUM(w_i * Q_i) / SUM(w_i)
 * 
 * 3. Stage 2: Day-of-Week Seasonality Adjustment Factor (S_dow)
 *    S_dow = Mean_dow / Mean_all (clamped to [0.70, 1.40])
 *    Historical_Forecast = MAX(1, ROUND( WMA * S_dow ))
 * 
 * 4. Stage 3: Known Advance Demand & Safety Buffer Integration
 *    Known_Demand = Confirmed_Pre_Orders for Target Date
 *    Expected_Demand = MAX(Historical_Forecast, Known_Demand)
 *    Safety_Margin = MAX(2, ROUND(Expected_Demand * 0.08))
 *    Recommended_Prep = Expected_Demand + Safety_Margin
 * 
 * Guarantee:
 *   Recommended_Prep >= Confirmed_Pre_Orders + Safety_Margin
 * A recommendation is NEVER lower than confirmed advance pre-orders.
 * =========================================================================================
 */

const SMOOTHING_ALPHA = 0.35;
const DEFAULT_SAFETY_MARGIN_PCT = 0.08;
const OVERPREPARATION_BASELINE_FACTOR = 1.25;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const forecastService = {
  /**
   * Pure calculation helper for predictable testing and core forecasting logic
   */
  calculateRecommended(forecastDemand, preOrderQuantity = 0, safetyMarginPct = DEFAULT_SAFETY_MARGIN_PCT) {
    const forecast = Math.max(0, parseInt(forecastDemand, 10) || 0);
    const knownDemand = Math.max(0, parseInt(preOrderQuantity, 10) || 0);
    const expectedDemand = Math.max(forecast, knownDemand);
    const safetyMargin = Math.max(2, Math.round(expectedDemand * safetyMarginPct));
    const recommendedQuantity = expectedDemand + safetyMargin;

    return {
      forecastDemand: forecast,
      preOrderQuantity: knownDemand,
      knownDemand,
      expectedDemand,
      safetyMargin,
      safetyMarginPct,
      recommendedQuantity
    };
  },

  /**
   * Forecast demand for a specific dish on a target date
   */
  async getDishForecast(dishId, targetDate = null) {
    const numDishId = parseInt(dishId, 10);
    if (isNaN(numDishId)) throw new Error('Invalid dish ID');

    // 1. Fetch dish details
    const dishRes = await db.query(
      'SELECT item_id, item_name, category, price, available_quantity, image_url, is_active, portion_weight_kg FROM menu_items WHERE item_id = $1',
      [numDishId]
    );
    if (!dishRes.rows.length) {
      throw new Error(`Dish #${numDishId} not found in menu.`);
    }
    const dish = dishRes.rows[0];

    const targetObj = targetDate ? new Date(targetDate) : new Date();
    const targetDateStr = targetObj.toISOString().split('T')[0];
    const targetDayOfWeek = targetObj.getDay();
    const targetDayName = DAY_NAMES[targetDayOfWeek];

    // 2. Fetch confirmed advance pre-orders for this dish on target date (Known Advance Demand)
    const preOrderRes = await db.query(`
      SELECT COALESCE(SUM(quantity), 0) as pre_order_count
      FROM pre_orders
      WHERE item_id = $1 AND scheduled_date = $2 AND status IN ('confirmed', 'fulfilled')
    `, [numDishId, targetDateStr]);
    const preOrderQuantity = parseInt(preOrderRes.rows[0]?.pre_order_count || 0, 10);
    const knownDemand = preOrderQuantity;

    // 3. Unified historical demand query across order_items, production_records, and wastage_logs
    const historyRes = await db.query(`
      SELECT 
        d.sale_date,
        MAX(d.quantity_sold) as quantity_sold,
        COUNT(DISTINCT d.source_id) as order_count
      FROM (
        -- Source A: Completed / confirmed online student orders
        SELECT 
          DATE(o.order_time) as sale_date,
          SUM(oi.quantity) as quantity_sold,
          o.order_id as source_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.item_id = $1 
          AND o.order_status != 'Cancelled'
          AND o.order_time >= CURRENT_DATE - INTERVAL '30 days'
          AND DATE(o.order_time) < $2
        GROUP BY DATE(o.order_time), o.order_id

        UNION ALL

        -- Source B: Production records (total demand / collected)
        SELECT 
          record_date as sale_date,
          GREATEST(total_demand, collected_quantity) as quantity_sold,
          record_id as source_id
        FROM production_records
        WHERE dish_id = $1 
          AND record_date >= CURRENT_DATE - INTERVAL '30 days'
          AND record_date < $2
          AND (total_demand > 0 OR collected_quantity > 0)

        UNION ALL

        -- Source C: Chef logged wastage sales
        SELECT 
          log_date as sale_date,
          quantity_sold,
          log_id as source_id
        FROM wastage_logs
        WHERE dish_id = $1 
          AND log_date >= CURRENT_DATE - INTERVAL '30 days'
          AND log_date < $2
          AND quantity_sold > 0
      ) d
      GROUP BY d.sale_date
      ORDER BY d.sale_date ASC
    `, [numDishId, targetDateStr]);

    const rawHistory = historyRes.rows.map(row => {
      const d = new Date(row.sale_date);
      const dow = d.getDay();
      return {
        date: String(row.sale_date).split('T')[0],
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        quantity: parseInt(row.quantity_sold, 10),
        orderCount: parseInt(row.order_count, 10),
        isSameDayOfWeek: dow === targetDayOfWeek
      };
    });

    const menuBatchAvailable = parseInt(dish.available_quantity || 35, 10);
    const baselineQty = Math.max(25, menuBatchAvailable);

    // 4. If no historical data or very sparse sample size (< 2 data points)
    // Use the menu catalog batch as the historical demand prior
    if (rawHistory.length < 2) {
      const priorDemand = Math.round(baselineQty / OVERPREPARATION_BASELINE_FACTOR);
      const expectedDemand = Math.max(priorDemand, knownDemand);
      const safetyMargin = Math.max(2, Math.round(expectedDemand * DEFAULT_SAFETY_MARGIN_PCT));
      const recommendedQuantity = expectedDemand + safetyMargin;

      return {
        dish_id: dish.item_id,
        dishId: dish.item_id,
        dish_name: dish.item_name,
        dishName: dish.item_name,
        item_name: dish.item_name,
        name: dish.item_name,
        category: dish.category,
        price: dish.price,
        image_url: dish.image_url,
        target_date: targetDateStr,
        targetDate: targetDateStr,
        target_day_name: targetDayName,
        targetDayName,
        historical_baseline: baselineQty,
        historicalBaseline: baselineQty,
        baseline_quantity: baselineQty,
        baselineQuantity: baselineQty,
        historical_wma: priorDemand,
        historicalWMA: priorDemand,
        historical_mean: priorDemand,
        historicalMean: priorDemand,
        seasonality_factor: 1.0,
        seasonalityFactor: 1.0,
        same_weekday_matches: 0,
        sameWeekdayPoints: 0,
        historical_forecast: priorDemand,
        historicalForecast: priorDemand,
        pre_order_quantity: preOrderQuantity,
        preOrderQuantity,
        known_demand: knownDemand,
        knownDemand,
        expected_demand: expectedDemand,
        expectedDemand,
        safety_margin: safetyMargin,
        safetyMargin,
        recommended_quantity: recommendedQuantity,
        recommendedQuantity,
        forecasted_quantity: recommendedQuantity,
        forecastedQuantity: recommendedQuantity,
        confidence: knownDemand > 0 ? 'Medium Confidence' : 'Catalog Prior Baseline',
        confidence_score: knownDemand > 0 ? 65 : 45,
        confidenceScore: knownDemand > 0 ? 65 : 45,
        reasoning: knownDemand > 0 
          ? `Demand anchored by ${knownDemand} confirmed advance pre-orders with ${safetyMargin} buffer.`
          : `Sparse historical orders. AI initialized from menu catalog baseline (${baselineQty} batch target).`,
        metrics: {
          totalDataPoints: rawHistory.length,
          sameWeekdayPoints: 0,
          historicalBaseline: baselineQty,
          historicalWMA: priorDemand,
          historicalMean: priorDemand,
          seasonalityFactor: 1.0,
          historicalForecast: priorDemand,
          preOrders: preOrderQuantity,
          expectedDemand,
          safetyMargin
        },
        historicalData: rawHistory
      };
    }

    const n = rawHistory.length;

    // 5. Stage 1: Recency-Weighted Moving Average (WMA)
    let weightSum = 0;
    let weightedQtySum = 0;
    let flatSum = 0;

    rawHistory.forEach((pt, index) => {
      flatSum += pt.quantity;
      const weight = Math.pow(1 - SMOOTHING_ALPHA, n - 1 - index);
      weightedQtySum += pt.quantity * weight;
      weightSum += weight;
    });

    const wma = weightSum > 0 ? (weightedQtySum / weightSum) : (flatSum / n);
    const overallMean = flatSum / n;

    // 6. Stage 2: Day-of-Week Seasonality Adjustment Factor (S_dow)
    const sameWeekdayPoints = rawHistory.filter(pt => pt.isSameDayOfWeek);
    let seasonalityFactor = 1.0;
    let sameWeekdayMean = overallMean;

    if (sameWeekdayPoints.length > 0) {
      const sameDaySum = sameWeekdayPoints.reduce((acc, cur) => acc + cur.quantity, 0);
      sameWeekdayMean = sameDaySum / sameWeekdayPoints.length;

      if (overallMean > 0) {
        const rawRatio = sameWeekdayMean / overallMean;
        seasonalityFactor = Math.min(1.40, Math.max(0.70, rawRatio));
      }
    }

    // 7. Stage 3: Historical Forecast Computation
    const rawForecast = wma * seasonalityFactor;
    const historicalForecastQty = Math.max(1, Math.round(rawForecast));

    // 8. Stage 4: Expected Demand & Recommended Preparation
    // expected_demand = MAX(historical_forecast, known_advance_pre_orders)
    const expectedDemand = Math.max(historicalForecastQty, knownDemand);
    const safetyMargin = Math.max(2, Math.round(expectedDemand * DEFAULT_SAFETY_MARGIN_PCT));
    const recommendedQuantity = expectedDemand + safetyMargin;

    // 9. Stage 5: Confidence Assessment
    let confidence = 'Low Confidence';
    let confidenceScore = 35;
    let reasoning = '';

    if (knownDemand >= 20) {
      confidence = 'High Confidence';
      confidenceScore = 95;
      reasoning = `High advance certainty: ${knownDemand} confirmed pre-orders lock in prep target (+${safetyMargin} buffer).`;
    } else if (sameWeekdayPoints.length >= 4 && n >= 14) {
      confidence = 'High Confidence';
      confidenceScore = 90;
      const pctDiff = Math.round((seasonalityFactor - 1) * 100);
      const directionText = pctDiff > 0 ? `${pctDiff}% higher` : pctDiff < 0 ? `${Math.abs(pctDiff)}% lower` : 'consistent';
      reasoning = `Strong 4+ week pattern detected. Historical ${targetDayName}s demand is ${directionText} than weekday average.`;
    } else if (sameWeekdayPoints.length >= 2 || n >= 7 || knownDemand > 0) {
      confidence = 'Medium Confidence';
      confidenceScore = 65;
      reasoning = knownDemand > 0
        ? `Informed by ${knownDemand} advance pre-orders combined with ${n}-day historical momentum.`
        : `Moderate data (${n} days, ${sameWeekdayPoints.length} matching ${targetDayName}s). WMA trend applied.`;
    } else {
      confidence = 'Low Confidence';
      confidenceScore = 45;
      reasoning = `Preliminary dataset (${n} days). WMA trend applied with ${safetyMargin}-portion safety buffer.`;
    }

    return {
      dish_id: dish.item_id,
      dishId: dish.item_id,
      dish_name: dish.item_name,
      dishName: dish.item_name,
      item_name: dish.item_name,
      name: dish.item_name,
      category: dish.category,
      price: dish.price,
      image_url: dish.image_url,
      target_date: targetDateStr,
      targetDate: targetDateStr,
      target_day_name: targetDayName,
      targetDayName,
      historical_baseline: baselineQty,
      historicalBaseline: baselineQty,
      baseline_quantity: baselineQty,
      baselineQuantity: baselineQty,
      historical_wma: Math.round(wma * 10) / 10,
      historicalWMA: Math.round(wma * 10) / 10,
      historical_mean: Math.round(overallMean * 10) / 10,
      historicalMean: Math.round(overallMean * 10) / 10,
      seasonality_factor: Math.round(seasonalityFactor * 100) / 100,
      seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
      same_weekday_matches: sameWeekdayPoints.length,
      sameWeekdayPoints: sameWeekdayPoints.length,
      historical_forecast: historicalForecastQty,
      historicalForecast: historicalForecastQty,
      pre_order_quantity: preOrderQuantity,
      preOrderQuantity,
      known_demand: knownDemand,
      knownDemand,
      expected_demand: expectedDemand,
      expectedDemand,
      safety_margin: safetyMargin,
      safetyMargin,
      recommended_quantity: recommendedQuantity,
      recommendedQuantity,
      forecasted_quantity: recommendedQuantity,
      forecastedQuantity: recommendedQuantity,
      confidence,
      confidence_score: confidenceScore,
      confidenceScore,
      reasoning,
      metrics: {
        totalDataPoints: n,
        sameWeekdayPoints: sameWeekdayPoints.length,
        historicalBaseline: baselineQty,
        historicalWMA: Math.round(wma * 10) / 10,
        historicalMean: Math.round(overallMean * 10) / 10,
        seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
        sameWeekdayMean: Math.round(sameWeekdayMean * 10) / 10,
        historicalForecast: historicalForecastQty,
        preOrders: preOrderQuantity,
        expectedDemand,
        safetyMargin
      },
      historicalData: rawHistory.slice(-14)
    };
  },

  /**
   * Bulk forecast for all active menu items
   */
  async getTodayForecast(targetDate = null) {
    const targetObj = targetDate ? new Date(targetDate) : new Date();
    const targetDateStr = targetObj.toISOString().split('T')[0];
    const targetDayOfWeek = targetObj.getDay();
    const targetDayName = DAY_NAMES[targetDayOfWeek];

    const itemsRes = await db.query(`
      SELECT item_id, item_name, category, price, available_quantity, image_url, is_special
      FROM menu_items
      WHERE is_active = 1
      ORDER BY category ASC, item_name ASC
    `);

    const forecasts = await Promise.all(
      itemsRes.rows.map(item => this.getDishForecast(item.item_id, targetDateStr))
    );

    const totalPredictedPortions = forecasts.reduce((acc, cur) => acc + cur.recommendedQuantity, 0);
    const highConfidenceCount = forecasts.filter(f => f.confidence === 'High Confidence').length;

    return {
      targetDate: targetDateStr,
      target_date: targetDateStr,
      targetDayName,
      target_day_name: targetDayName,
      totalDishes: forecasts.length,
      total_dishes: forecasts.length,
      totalPredictedPortions,
      total_predicted_portions: totalPredictedPortions,
      highConfidenceCount,
      high_confidence_count: highConfidenceCount,
      forecasts
    };
  }
};
