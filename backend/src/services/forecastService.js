import db from '../db/database.js';

/**
 * =========================================================================================
 * DEMAND FORECASTING ENGINE (With Advance Pre-Order Demand Signals)
 * =========================================================================================
 * 
 * MATHEMATICAL FORMULATION & ALGORITHM DESIGN:
 * --------------------------------------------
 * 1. Stage 1: Recency-Weighted Moving Average (Exponential Smoothing / WMA)
 *    w_i = (1 - alpha)^(n - i)    where alpha = 0.35
 *    WMA = SUM(w_i * Q_i) / SUM(w_i)
 * 
 * 2. Stage 2: Day-of-Week Seasonality Adjustment Factor (S_dow)
 *    S_dow = Mean_dow / Mean_all (clamped to [0.65, 1.50])
 *    Historical_Forecast = MAX(1, ROUND( WMA * S_dow ))
 * 
 * 3. Stage 3: Known Advance Demand & Recommended Preparation
 *    Known_Demand = Confirmed_Pre_Orders for Target Date
 *    Expected_Demand = MAX(Historical_Forecast, Known_Demand)
 *    Safety_Margin = MAX(2, ROUND(Expected_Demand * 0.08))
 *    Recommended_Prep = Expected_Demand + Safety_Margin
 * 
 * This guarantees:
 *   Recommended_Prep >= Confirmed_Pre_Orders + Safety_Margin
 * A kitchen is NEVER recommended fewer portions than confirmed pre-orders.
 * =========================================================================================
 */

const SMOOTHING_ALPHA = 0.35;
const DEFAULT_BATCH_FALLBACK = 25;
const DEFAULT_SAFETY_MARGIN_PCT = 0.08;
const OVERPREPARATION_BASELINE_FACTOR = 1.25;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const forecastService = {
  /**
   * Forecast demand for a specific dish on a target date (default today/tomorrow)
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

    // Determine target date and target day of week (0-6)
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

    // 3. Fetch last 30 days of actual order sales history for this dish
    const historyRes = await db.query(`
      SELECT 
        DATE(o.order_time) as sale_date,
        SUM(oi.quantity) as quantity_sold,
        COUNT(DISTINCT o.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.item_id = $1 
        AND o.order_status != 'Cancelled'
        AND o.order_time >= CURRENT_DATE - INTERVAL '30 days'
        AND DATE(o.order_time) < $2
      GROUP BY DATE(o.order_time)
      ORDER BY sale_date ASC
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

    // 4. Check for wastage history to refine estimates
    const wastageRes = await db.query(`
      SELECT 
        AVG(quantity_wasted) as avg_wasted,
        AVG(quantity_prepared) as avg_prepared
      FROM wastage_logs
      WHERE dish_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '30 days'
    `, [numDishId]);

    const avgHistoricalWaste = parseFloat(wastageRes.rows[0]?.avg_wasted || 0);

    // If no past order history, compute with baseline batch + pre-orders
    if (rawHistory.length === 0) {
      const fallbackQty = dish.available_quantity > 0 ? dish.available_quantity : DEFAULT_BATCH_FALLBACK;
      const expectedDemand = Math.max(fallbackQty, knownDemand);
      const safetyMargin = Math.max(2, Math.round(expectedDemand * DEFAULT_SAFETY_MARGIN_PCT));
      const recommendedQuantity = expectedDemand + safetyMargin;
      const baselineQty = Math.max(25, Math.round(expectedDemand * OVERPREPARATION_BASELINE_FACTOR));

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
        historical_forecast: fallbackQty,
        historicalForecast: fallbackQty,
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
        baseline_quantity: baselineQty,
        baselineQuantity: baselineQty,
        confidence: knownDemand > 0 ? 'Medium Confidence' : 'Low Confidence',
        confidence_score: knownDemand > 0 ? 60 : 20,
        confidenceScore: knownDemand > 0 ? 60 : 20,
        seasonality_factor: 1.0,
        seasonalityFactor: 1.0,
        weighted_average: fallbackQty,
        weightedRecencyAverage: fallbackQty,
        historical_mean: fallbackQty,
        historicalMean: fallbackQty,
        same_weekday_matches: 0,
        sameWeekdayPoints: 0,
        reasoning: knownDemand > 0 
          ? `Recommended ${recommendedQuantity} portions based on ${knownDemand} confirmed advance pre-orders (+${safetyMargin} buffer).`
          : 'No historical order data available within past 30 days. Baseline menu batch allocated.',
        metrics: {
          totalDataPoints: 0,
          sameWeekdayPoints: 0,
          historicalForecast: fallbackQty,
          preOrders: preOrderQuantity,
          expectedDemand,
          safetyMargin,
          weightedRecencyAverage: fallbackQty,
          seasonalityFactor: 1.0,
          historicalMean: fallbackQty,
          avgHistoricalWaste: 0
        },
        historicalData: []
      };
    }

    const n = rawHistory.length;

    // 5. Stage 1: Exponential Weighted Moving Average (WMA)
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
        seasonalityFactor = Math.min(1.50, Math.max(0.65, rawRatio));
      }
    }

    // 7. Stage 3: Historical Forecast vs Advance Pre-Orders Demand Integration
    const rawForecast = wma * seasonalityFactor;
    const historicalForecastQty = Math.max(1, Math.round(rawForecast));

    // The key rule: expected_demand = MAX(historical_forecast, known_advance_pre_orders)
    const expectedDemand = Math.max(historicalForecastQty, knownDemand);
    const safetyMargin = Math.max(2, Math.round(expectedDemand * DEFAULT_SAFETY_MARGIN_PCT));
    const recommendedQuantity = expectedDemand + safetyMargin;
    const baselineQty = Math.max(25, Math.round(expectedDemand * OVERPREPARATION_BASELINE_FACTOR));

    // 8. Stage 4: Confidence Assessment
    let confidence = 'Low Confidence';
    let confidenceScore = 35;
    let reasoning = '';

    if (knownDemand >= 20) {
      confidence = 'High Confidence';
      confidenceScore = 95;
      reasoning = `Direct demand signal: ${knownDemand} confirmed advance pre-orders lock in production target (+${safetyMargin} buffer).`;
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
      confidenceScore = 40;
      reasoning = `Limited sample size (${n} days of orders). Weighted moving average applied with safety buffer.`;
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
      baseline_quantity: baselineQty,
      baselineQuantity: baselineQty,
      confidence,
      confidence_score: confidenceScore,
      confidenceScore,
      seasonality_factor: Math.round(seasonalityFactor * 100) / 100,
      seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
      weighted_average: Math.round(wma * 10) / 10,
      weightedRecencyAverage: Math.round(wma * 10) / 10,
      historical_mean: Math.round(overallMean * 10) / 10,
      historicalMean: Math.round(overallMean * 10) / 10,
      same_weekday_matches: sameWeekdayPoints.length,
      sameWeekdayPoints: sameWeekdayPoints.length,
      reasoning,
      metrics: {
        totalDataPoints: n,
        sameWeekdayPoints: sameWeekdayPoints.length,
        historicalForecast: historicalForecastQty,
        preOrders: preOrderQuantity,
        expectedDemand,
        safetyMargin,
        weightedRecencyAverage: Math.round(wma * 10) / 10,
        seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
        historicalMean: Math.round(overallMean * 10) / 10,
        sameWeekdayMean: Math.round(sameWeekdayMean * 10) / 10,
        avgHistoricalWaste: Math.round(avgHistoricalWaste * 10) / 10
      },
      historicalData: rawHistory.slice(-14)
    };
  },

  /**
   * Forecast demand in bulk for all active menu items for today/tomorrow
   */
  async getTodayForecast(targetDate = null) {
    const targetObj = targetDate ? new Date(targetDate) : new Date();
    const targetDateStr = targetObj.toISOString().split('T')[0];
    const targetDayOfWeek = targetObj.getDay();
    const targetDayName = DAY_NAMES[targetDayOfWeek];

    // Fetch all active menu items
    const itemsRes = await db.query(`
      SELECT item_id, item_name, category, price, available_quantity, image_url, is_special
      FROM menu_items
      WHERE is_active = 1
      ORDER BY category ASC, item_name ASC
    `);

    // Execute in parallel for fast response
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
