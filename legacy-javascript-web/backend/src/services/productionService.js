import db from '../db/database.js';
import { forecastService } from './forecastService.js';

export const DEFAULT_PORTION_WEIGHT_KG = 0.400; // 400g average portion
export const DEFAULT_SAFETY_MARGIN_PCT = 0.08; // 8% safety buffer for recommended prep
export const OVERPREPARATION_BASELINE_FACTOR = 1.25; // 25% historical overpreparation without demand signals

export const productionService = {
  /**
   * 1. Calculate historical baseline quantity for a dish on a target date
   * The quantity that WOULD have been prepared without pre-order / real-time demand optimization.
   */
  async calculateBaseline(dishId, targetDate = null) {
    const numDishId = parseInt(dishId, 10);
    const targetObj = targetDate ? new Date(targetDate) : new Date();
    const targetDateStr = targetObj.toISOString().split('T')[0];

    const dishRes = await db.query('SELECT available_quantity FROM menu_items WHERE item_id = $1', [numDishId]);
    const defaultBatch = dishRes.rows[0]?.available_quantity || 35;

    // Look back at past occurrences of total demand for this dish on comparable days
    const historyRes = await db.query(`
      SELECT 
        DATE(o.order_time) as order_date,
        SUM(oi.quantity) as demand_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.item_id = $1 
        AND o.order_status != 'Cancelled'
        AND DATE(o.order_time) < $2
        AND o.order_time >= CURRENT_DATE - INTERVAL '60 days'
      GROUP BY DATE(o.order_time)
      ORDER BY order_date DESC
      LIMIT 10
    `, [numDishId, targetDateStr]);

    if (historyRes.rows.length >= 3) {
      let weightedSum = 0;
      let totalWeights = 0;
      historyRes.rows.forEach((row, idx) => {
        const weight = Math.pow(0.85, idx); // Recency weighting
        const demand = parseInt(row.demand_count, 10);
        weightedSum += demand * weight;
        totalWeights += weight;
      });
      const historicalMeanDemand = Math.round(weightedSum / totalWeights);
      return Math.max(25, Math.round(historicalMeanDemand * OVERPREPARATION_BASELINE_FACTOR));
    }

    return Math.max(25, defaultBatch);
  },

  /**
   * 2. Calculate recommended preparation quantity using feedback loop formula:
   * known_demand = pre_order_quantity
   * forecast_demand = existing weighted historical forecast
   * expected_demand = MAX(forecast_demand, known_demand)
   * safety_margin = MAX(2, ROUND(expected_demand * buffer))
   * recommended_quantity = expected_demand + safety_margin
   */
  async calculateRecommended(dishId, targetDate = null, safetyMarginPct = DEFAULT_SAFETY_MARGIN_PCT) {
    const numDishId = parseInt(dishId, 10);
    const targetObj = targetDate ? new Date(targetDate) : new Date();
    const targetDateStr = targetObj.toISOString().split('T')[0];

    const forecast = await forecastService.getDishForecast(numDishId, targetDateStr);
    return {
      forecastDemand: forecast.historicalForecast,
      knownDemand: forecast.knownDemand,
      preOrderQuantity: forecast.preOrderQuantity,
      expectedDemand: forecast.expectedDemand,
      safetyMargin: forecast.safetyMargin,
      safetyMarginPct,
      recommendedQuantity: forecast.recommendedQuantity,
      baselineQuantity: forecast.baselineQuantity,
      confidence: forecast.confidence,
      targetDayName: forecast.targetDayName
    };
  },

  /**
   * 3. Synchronize demand signals (Pre-Orders + On-Spot Orders) for a given date
   */
  async syncDemandForDate(targetDate = null) {
    const targetDateStr = targetDate ? String(targetDate).split('T')[0] : new Date().toISOString().split('T')[0];

    // 1. Fetch pre-orders for target date
    const preOrdersRes = await db.query(`
      SELECT item_id, SUM(quantity) as pre_order_count
      FROM pre_orders
      WHERE scheduled_date = $1 AND status IN ('confirmed', 'fulfilled')
      GROUP BY item_id
    `, [targetDateStr]);
    const preOrderMap = new Map();
    preOrdersRes.rows.forEach(r => preOrderMap.set(parseInt(r.item_id, 10), parseInt(r.pre_order_count, 10)));

    // 2. Fetch on-spot orders for target date
    const onSpotRes = await db.query(`
      SELECT oi.item_id, SUM(oi.quantity) as on_spot_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.order_time) = $1 AND o.order_status != 'Cancelled'
      GROUP BY oi.item_id
    `, [targetDateStr]);
    const onSpotMap = new Map();
    onSpotRes.rows.forEach(r => onSpotMap.set(parseInt(r.item_id, 10), parseInt(r.on_spot_count, 10)));

    // 3. Fetch completed orders (collected portions)
    const collectedRes = await db.query(`
      SELECT oi.item_id, SUM(oi.quantity) as collected_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE DATE(o.order_time) = $1 AND o.order_status = 'Completed'
      GROUP BY oi.item_id
    `, [targetDateStr]);
    const collectedMap = new Map();
    collectedRes.rows.forEach(r => collectedMap.set(parseInt(r.item_id, 10), parseInt(r.collected_count, 10)));

    // 4. Fetch all active menu items
    const menuRes = await db.query(`
      SELECT item_id, portion_weight_kg, available_quantity 
      FROM menu_items 
      WHERE is_active = 1
    `);

    // Fetch existing records for targetDate in one query
    const existingRes = await db.query(`
      SELECT * FROM production_records WHERE record_date = $1
    `, [targetDateStr]);
    const existingMap = new Map();
    existingRes.rows.forEach(r => existingMap.set(parseInt(r.dish_id, 10), r));

    for (const dish of menuRes.rows) {
      const dishId = parseInt(dish.item_id, 10);
      const preOrderQty = preOrderMap.get(dishId) || 0;
      const onSpotQty = onSpotMap.get(dishId) || 0;
      const totalDemand = preOrderQty + onSpotQty;
      const autoCollectedQty = collectedMap.get(dishId) || 0;
      const portionWeightKg = parseFloat(dish.portion_weight_kg) || DEFAULT_PORTION_WEIGHT_KG;

      const existingRow = existingMap.get(dishId);

      if (!existingRow) {
        // Calculate pre-prep baseline and recommendation using forecastService
        const fc = await forecastService.getDishForecast(dishId, targetDateStr);
        const baselineQty = fc.baselineQuantity;
        const expectedDemand = fc.expectedDemand;
        const safetyMargin = fc.safetyMargin;
        const recommendedQty = fc.recommendedQuantity;

        await db.query(`
          INSERT INTO production_records (
            dish_id, record_date, planned_quantity, pre_order_quantity, on_spot_quantity,
            total_demand, forecast_demand, safety_margin, recommended_quantity, baseline_quantity,
            prepared_quantity, collected_quantity, leftover_quantity, recommendation_variance_quantity,
            recommendation_adherence_status, portion_weight_kg, estimated_food_saved_kg,
            actual_waste_kg, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
          ON CONFLICT (dish_id, record_date) DO NOTHING
        `, [
          dishId, targetDateStr, baselineQty, preOrderQty, onSpotQty,
          totalDemand, expectedDemand, safetyMargin, recommendedQty, baselineQty,
          0, autoCollectedQty, 0, 0,
          'AT_RECOMMENDATION', portionWeightKg, 0.000, 0.000
        ]);
      } else {
        const preparedQty = parseInt(existingRow.prepared_quantity || 0, 10);
        const defaultAvail = parseInt(dish.available_quantity || 35, 10);
        const baselineQty = parseInt(existingRow.baseline_quantity || defaultAvail, 10);
        const recommendedQty = parseInt(existingRow.recommended_quantity || 0, 10);
        
        // Preserve chef-confirmed collected_quantity if already logged or explicitly confirmed
        const isLogged = preparedQty > 0 || (existingRow.collected_quantity !== null && existingRow.collected_quantity !== undefined && parseInt(existingRow.collected_quantity, 10) > 0);
        const finalCollectedQty = isLogged ? parseInt(existingRow.collected_quantity || 0, 10) : autoCollectedQty;
        
        // Leftover is strictly MAX(0, prepared - collected)
        const leftoverQty = Math.max(0, preparedQty > 0 ? preparedQty - finalCollectedQty : 0);

        const foodSavedKg = preparedQty > 0 
          ? Math.max(0, (baselineQty - preparedQty) * portionWeightKg)
          : 0.000;
        const wasteKg = leftoverQty * portionWeightKg;

        const variance = preparedQty > 0 ? (preparedQty - recommendedQty) : 0;
        let adherenceStatus = 'AT_RECOMMENDATION';
        if (preparedQty > 0) {
          if (Math.abs(preparedQty - recommendedQty) <= 2) {
            adherenceStatus = 'AT_RECOMMENDATION';
          } else if (preparedQty < recommendedQty) {
            adherenceStatus = 'BELOW_RECOMMENDATION';
          } else {
            adherenceStatus = 'ABOVE_RECOMMENDATION';
          }
        }

        await db.query(`
          UPDATE production_records
          SET 
            pre_order_quantity = $1,
            on_spot_quantity = $2,
            total_demand = $3,
            collected_quantity = $4,
            leftover_quantity = $5,
            recommendation_variance_quantity = $6,
            recommendation_adherence_status = $7,
            estimated_food_saved_kg = $8,
            actual_waste_kg = $9,
            updated_at = NOW()
          WHERE record_id = $10
        `, [
          preOrderQty, onSpotQty, totalDemand, finalCollectedQty, leftoverQty,
          variance, adherenceStatus, foodSavedKg, wasteKg, existingRow.record_id
        ]);
      }
    }
  },

  /**
   * 4. Fetch daily production overview for Chef Dashboard
   */
  async getDailyProductionOverview(targetDate = null) {
    const targetDateStr = targetDate ? String(targetDate).split('T')[0] : new Date().toISOString().split('T')[0];

    // Ensure demand is synced
    await this.syncDemandForDate(targetDateStr);

    const res = await db.query(`
      SELECT 
        pr.record_id,
        pr.dish_id,
        pr.record_date,
        pr.planned_quantity,
        pr.pre_order_quantity,
        pr.on_spot_quantity,
        pr.total_demand,
        pr.forecast_demand,
        pr.safety_margin,
        pr.recommended_quantity,
        pr.baseline_quantity,
        pr.prepared_quantity,
        pr.collected_quantity,
        pr.leftover_quantity,
        pr.recommendation_variance_quantity,
        pr.recommendation_adherence_status,
        pr.portion_weight_kg,
        pr.estimated_food_saved_kg,
        pr.actual_waste_kg,
        pr.notes,
        m.item_name,
        m.category,
        m.price,
        m.image_url,
        m.is_special
      FROM production_records pr
      JOIN menu_items m ON pr.dish_id = m.item_id
      WHERE pr.record_date = $1
      ORDER BY pr.estimated_food_saved_kg DESC, m.category ASC, m.item_name ASC
    `, [targetDateStr]);

    let totalPrepared = 0;
    let totalDemand = 0;
    let totalFoodSavedKg = 0;
    let totalActualWasteKg = 0;
    let loggedCount = 0;

    const dishes = res.rows.map(r => {
      const prepared = parseInt(r.prepared_quantity || 0, 10);
      const isLogged = prepared > 0;
      if (isLogged) loggedCount++;

      const demand = parseInt(r.total_demand || 0, 10);
      const savedKg = parseFloat(r.estimated_food_saved_kg || 0);
      const wasteKg = parseFloat(r.actual_waste_kg || 0);

      totalPrepared += prepared;
      totalDemand += demand;
      totalFoodSavedKg += savedKg;
      totalActualWasteKg += wasteKg;

      return {
        recordId: r.record_id,
        dishId: r.dish_id,
        dishName: r.item_name,
        category: r.category,
        price: r.price,
        imageUrl: r.image_url,
        isSpecial: Boolean(r.is_special),
        portionWeightKg: parseFloat(r.portion_weight_kg) || DEFAULT_PORTION_WEIGHT_KG,
        // Demand Signals & Feedback Metrics
        baselineQuantity: parseInt(r.baseline_quantity || 0, 10),
        forecastDemand: parseInt(r.forecast_demand || 0, 10),
        preOrderQuantity: parseInt(r.pre_order_quantity || 0, 10),
        onSpotQuantity: parseInt(r.on_spot_quantity || 0, 10),
        totalDemand: demand,
        safetyMargin: parseInt(r.safety_margin || 0, 10),
        recommendedQuantity: parseInt(r.recommended_quantity || 0, 10),
        preparedQuantity: prepared,
        collectedQuantity: parseInt(r.collected_quantity || 0, 10),
        leftoverQuantity: parseInt(r.leftover_quantity || 0, 10),
        recommendationVariance: parseInt(r.recommendation_variance_quantity || 0, 10),
        recommendationAdherenceStatus: r.recommendation_adherence_status || 'AT_RECOMMENDATION',
        estimatedFoodSavedKg: savedKg,
        actualWasteKg: wasteKg,
        isLogged,
        notes: r.notes
      };
    });

    return {
      date: targetDateStr,
      summary: {
        totalDishes: dishes.length,
        dishesLogged: loggedCount,
        totalPrepared,
        totalDemand,
        totalFoodSavedKg: Math.round(totalFoodSavedKg * 10) / 10,
        totalActualWasteKg: Math.round(totalActualWasteKg * 10) / 10,
        avoidedCo2Kg: Math.round(totalFoodSavedKg * 2.5 * 10) / 10
      },
      dishes
    };
  },

  /**
   * 5. Log daily production and finalize food saved & actual waste
   */
  async logProduction(chefId, entries, targetDate = null) {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      throw new Error('Please provide at least one production entry.');
    }

    const targetDateStr = targetDate ? String(targetDate).split('T')[0] : new Date().toISOString().split('T')[0];
    const savedRecords = [];

    for (const entry of entries) {
      const dishId = parseInt(entry.dishId || entry.dish_id, 10);
      if (isNaN(dishId)) continue;

      const preparedQty = Math.max(0, parseInt(entry.preparedQuantity ?? entry.prepared_quantity ?? entry.quantityPrepared ?? entry.quantity_prepared ?? 0, 10));
      const dishRes = await db.query('SELECT portion_weight_kg, available_quantity FROM menu_items WHERE item_id = $1', [dishId]);
      const portionWeightKg = parseFloat(dishRes.rows[0]?.portion_weight_kg) || DEFAULT_PORTION_WEIGHT_KG;

      // 1. Get baseline quantity
      let baselineQty = parseInt(entry.baselineQuantity ?? entry.baseline_quantity, 10);
      if (isNaN(baselineQty) || baselineQty <= 0) {
        baselineQty = await this.calculateBaseline(dishId, targetDateStr);
      }

      // 2. Fetch or accept chef-confirmed collected portions
      let collectedQty;
      const rawCollected = entry.collectedQuantity ?? entry.collected_quantity ?? entry.quantitySold ?? entry.quantity_sold;
      if (rawCollected !== undefined && rawCollected !== null && !isNaN(parseInt(rawCollected, 10))) {
        collectedQty = Math.max(0, parseInt(rawCollected, 10));
      } else {
        // Fallback: auto-pull from actual student order records
        const salesRes = await db.query(`
          SELECT 
            COUNT(oi.item_id) as orders_count,
            COALESCE(SUM(oi.quantity), 0) as total_sold
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.order_id
          WHERE oi.item_id = $1 AND DATE(o.order_time) = $2 AND o.order_status != 'Cancelled'
        `, [dishId, targetDateStr]);
        collectedQty = parseInt(salesRes.rows[0]?.total_sold || 0, 10);
      }

      // 3. Validation: Collected quantity cannot exceed prepared quantity!
      if (preparedQty > 0 && collectedQty > preparedQty) {
        throw new Error('Collected quantity cannot exceed prepared quantity.');
      }

      // 4. Leftover portions: strictly MAX(0, prepared_quantity - collected_quantity)
      let leftoverQty = Math.max(0, preparedQty - collectedQty);
      if (entry.leftoverQuantity !== undefined && entry.leftoverQuantity !== null && !isNaN(parseInt(entry.leftoverQuantity, 10))) {
        if (preparedQty === 0) {
          leftoverQty = Math.max(0, parseInt(entry.leftoverQuantity, 10));
        }
      }

      // 5. Calculate Food Saved: MAX(0, (baseline_quantity - prepared_quantity)) * portion_weight_kg
      const foodSavedKg = preparedQty > 0 
        ? Math.max(0, (baselineQty - preparedQty) * portionWeightKg)
        : 0.000;
      const actualWasteKg = leftoverQty * portionWeightKg;

      // 6. Fetch recommendation
      const rec = await this.calculateRecommended(dishId, targetDateStr);
      const recommendedQty = parseInt(entry.recommendedQuantity ?? entry.recommended_quantity ?? rec.recommendedQuantity, 10);
      const variance = preparedQty > 0 ? (preparedQty - recommendedQty) : 0;

      let adherenceStatus = 'AT_RECOMMENDATION';
      if (preparedQty > 0) {
        if (Math.abs(preparedQty - recommendedQty) <= 2) {
          adherenceStatus = 'AT_RECOMMENDATION';
        } else if (preparedQty < recommendedQty) {
          adherenceStatus = 'BELOW_RECOMMENDATION';
        } else {
          adherenceStatus = 'ABOVE_RECOMMENDATION';
        }
      }

      const result = await db.query(`
        INSERT INTO production_records (
          dish_id, record_date, planned_quantity, pre_order_quantity, on_spot_quantity,
          total_demand, forecast_demand, safety_margin, recommended_quantity, baseline_quantity,
          prepared_quantity, collected_quantity, leftover_quantity, recommendation_variance_quantity,
          recommendation_adherence_status, portion_weight_kg, estimated_food_saved_kg,
          actual_waste_kg, notes, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (dish_id, record_date)
        DO UPDATE SET
          prepared_quantity = EXCLUDED.prepared_quantity,
          collected_quantity = EXCLUDED.collected_quantity,
          leftover_quantity = EXCLUDED.leftover_quantity,
          baseline_quantity = EXCLUDED.baseline_quantity,
          recommendation_variance_quantity = EXCLUDED.recommendation_variance_quantity,
          recommendation_adherence_status = EXCLUDED.recommendation_adherence_status,
          estimated_food_saved_kg = EXCLUDED.estimated_food_saved_kg,
          actual_waste_kg = EXCLUDED.actual_waste_kg,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *
      `, [
        dishId, targetDateStr, baselineQty, rec.preOrderQuantity || 0, collectedQty,
        collectedQty, rec.forecastDemand || 25, rec.safetyMargin || 2, recommendedQty, baselineQty,
        preparedQty, collectedQty, leftoverQty, variance,
        adherenceStatus, portionWeightKg, foodSavedKg,
        actualWasteKg, entry.notes || entry.reason || null
      ]);

      // Also mirror into wastage_logs for historical compatibility
      await db.query(`
        INSERT INTO wastage_logs (
          dish_id, chef_id, log_date, quantity_prepared, quantity_sold,
          quantity_wasted, reason, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (dish_id, log_date)
        DO UPDATE SET
          quantity_prepared = EXCLUDED.quantity_prepared,
          quantity_sold = EXCLUDED.quantity_sold,
          quantity_wasted = EXCLUDED.quantity_wasted,
          reason = EXCLUDED.reason,
          updated_at = NOW()
      `, [
        dishId, chefId, targetDateStr, preparedQty, collectedQty,
        leftoverQty, entry.reason || entry.notes || 'overprepared'
      ]);

      savedRecords.push(result.rows[0]);
    }

    return {
      message: `Successfully logged production & food saved data for ${savedRecords.length} dishes on ${targetDateStr}.`,
      count: savedRecords.length,
      records: savedRecords
    };
  }
};
