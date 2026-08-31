import db from '../db/database.js';

/**
 * =========================================================================================
 * DEMAND FORECASTING ENGINE
 * =========================================================================================
 * 
 * MATHEMATICAL FORMULATION & ALGORITHM DESIGN:
 * --------------------------------------------
 * Traditional campus mess planning relies on simple arithmetic averages, which suffers from:
 * 1. Lag bias: Treats consumption from 30 days ago equally to yesterday, ignoring momentum.
 * 2. Seasonality blindness: Fails to detect recurring day-of-week surges (e.g. Friday dinners,
 *    Sunday brunches, or mid-week exam spikes).
 * 
 * Our two-stage forecasting algorithm combines:
 * 
 * Stage 1: Recency-Weighted Moving Average (Exponential Smoothing / WMA)
 * ----------------------------------------------------------------------
 * For historical sales series Q = [Q_1, Q_2, ..., Q_n] ordered chronologically over the past 30 days:
 * 
 *   w_i = (1 - alpha)^(n - i)    where alpha = 0.35 (smoothing parameter)
 * 
 *   WMA = SUM(w_i * Q_i) / SUM(w_i)
 * 
 * This guarantees that immediate recent trends (e.g. recent week momentum) dominate over older weeks.
 * 
 * Stage 2: Day-of-Week Seasonality Adjustment Factor (S_dow)
 * ----------------------------------------------------------
 * Let TargetDay be the day of the week for which we are forecasting (0=Sun, 1=Mon, ..., 6=Sat).
 * 
 *   Mean_all = Average daily sales across all past historical days
 *   Mean_dow = Average daily sales strictly on matching weekdays in history
 * 
 *   S_dow = Mean_dow / Mean_all (clamped to [0.65, 1.50] for robustness)
 * 
 * Stage 3: Final Forecast Calculation
 * -----------------------------------
 *   Forecast_Qty = MAX(1, ROUND( WMA * S_dow ))
 * 
 * Stage 4: Confidence Scoring
 * ---------------------------
 * - "High Confidence" (🟢): >= 4 same-weekday data points & >= 14 total historical days.
 * - "Medium Confidence" (🟡): >= 2 same-weekday data points or >= 7 total historical days.
 * - "Low Confidence" (⚪): Limited history (< 7 days); relies primarily on available mean.
 * =========================================================================================
 */

const SMOOTHING_ALPHA = 0.35;
const DEFAULT_BATCH_FALLBACK = 25;

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
      'SELECT item_id, item_name, category, price, available_quantity, image_url, is_active FROM menu_items WHERE item_id = $1',
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

    // 2. Fetch last 30 days of actual order sales history for this dish
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
        AND DATE(o.order_time) <= $2
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

    // 3. Check for wastage history to refine batch estimates
    const wastageRes = await db.query(`
      SELECT 
        AVG(quantity_wasted) as avg_wasted,
        AVG(quantity_prepared) as avg_prepared
      FROM wastage_logs
      WHERE dish_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '30 days'
    `, [numDishId]);

    const avgHistoricalWaste = parseFloat(wastageRes.rows[0]?.avg_wasted || 0);

    // 4. If no order history, return baseline default
    if (rawHistory.length === 0) {
      const fallbackQty = dish.available_quantity > 0 ? dish.available_quantity : DEFAULT_BATCH_FALLBACK;
      const baselineQty = Math.max(25, Math.round(fallbackQty * 1.25));

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
        recommended_quantity: fallbackQty,
        recommendedQuantity: fallbackQty,
        forecasted_quantity: fallbackQty,
        forecastedQuantity: fallbackQty,
        expected_demand: fallbackQty,
        expectedDemand: fallbackQty,
        baseline_quantity: baselineQty,
        baselineQuantity: baselineQty,
        confidence: 'Low Confidence',
        confidence_score: 20,
        confidenceScore: 20,
        seasonality_factor: 1.0,
        seasonalityFactor: 1.0,
        weighted_average: fallbackQty,
        weightedRecencyAverage: fallbackQty,
        historical_mean: fallbackQty,
        historicalMean: fallbackQty,
        same_weekday_matches: 0,
        sameWeekdayPoints: 0,
        reasoning: 'No historical order data available within the past 30 days. Baseline menu batch allocated.',
        metrics: {
          totalDataPoints: 0,
          sameWeekdayPoints: 0,
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
      // Exponential decay weight: (1 - alpha)^(n - 1 - index)
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
        // Calculate raw ratio and clamp between 0.65 and 1.50
        const rawRatio = sameWeekdayMean / overallMean;
        seasonalityFactor = Math.min(1.50, Math.max(0.65, rawRatio));
      }
    }

    // 7. Stage 3: Forecast Computation
    const rawForecast = wma * seasonalityFactor;
    const forecastedQuantity = Math.max(1, Math.round(rawForecast));

    // 8. Stage 4: Confidence Assessment
    let confidence = 'Low Confidence';
    let confidenceScore = 35;
    let reasoning = '';

    if (sameWeekdayPoints.length >= 4 && n >= 14) {
      confidence = 'High Confidence';
      confidenceScore = 90;
      const pctDiff = Math.round((seasonalityFactor - 1) * 100);
      const directionText = pctDiff > 0 ? `${pctDiff}% higher` : pctDiff < 0 ? `${Math.abs(pctDiff)}% lower` : 'consistent';
      reasoning = `Strong 4+ week pattern detected. Historical ${targetDayName}s demand is ${directionText} than weekday average with strong recent sales velocity.`;
    } else if (sameWeekdayPoints.length >= 2 || n >= 7) {
      confidence = 'Medium Confidence';
      confidenceScore = 65;
      reasoning = `Moderate data (${n} days, ${sameWeekdayPoints.length} matching ${targetDayName}s). Forecast combines weighted recency trend with preliminary weekday seasonality.`;
    } else {
      confidence = 'Low Confidence';
      confidenceScore = 40;
      reasoning = `Limited sample size (${n} days of orders). Weighted moving average applied with conservative bounds.`;
    }

    const baselineQty = Math.max(25, Math.round(forecastedQuantity * 1.25));

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
      recommended_quantity: forecastedQuantity,
      recommendedQuantity: forecastedQuantity,
      forecasted_quantity: forecastedQuantity,
      forecastedQuantity,
      expected_demand: Math.round(wma * 10) / 10,
      expectedDemand: Math.round(wma * 10) / 10,
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
        weightedRecencyAverage: Math.round(wma * 10) / 10,
        seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
        historicalMean: Math.round(overallMean * 10) / 10,
        sameWeekdayMean: Math.round(sameWeekdayMean * 10) / 10,
        avgHistoricalWaste: Math.round(avgHistoricalWaste * 10) / 10
      },
      historicalData: rawHistory.slice(-14) // Return last 14 days for visual chart / sparkline
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

    // Execute in parallel for sub-second responsiveness
    const forecasts = await Promise.all(
      itemsRes.rows.map(item => this.getDishForecast(item.item_id, targetDateStr))
    );

    const totalPredictedPortions = forecasts.reduce((acc, cur) => acc + cur.forecastedQuantity, 0);
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
