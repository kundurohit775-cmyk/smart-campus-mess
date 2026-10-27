import { forecastService } from './src/services/forecastService.js';
import db from './src/db/database.js';

async function testForecastGapAndScenarios() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING DEMAND FORECASTING GAP & HISTORICAL DEMAND SCENARIOS');
  console.log('======================================================================\n');

  // SCENARIO 1: High Historical Demand [48, 46, 50, 45], Pre-Orders = 20
  console.log('--- SCENARIO 1: Historical Demand [48, 46, 50, 45] & Pre-Orders = 20 ---');
  const res1 = forecastService.calculateForecastFromHistory([48, 46, 50, 45], 20, 1, 48);
  console.log('Scenario 1 Outputs:', res1);
  if (res1.expectedDemand < 45 || res1.expectedDemand > 50) {
    throw new Error(`Scenario 1 Expected Demand (${res1.expectedDemand}) should be within 45-50!`);
  }
  if (res1.recommendedQuantity < 48 || res1.recommendedQuantity > 55) {
    throw new Error(`Scenario 1 Recommended (${res1.recommendedQuantity}) should be in sensible range around 51!`);
  }
  console.log(`✅ Scenario 1 Passed: Forecast (${res1.historicalForecast}) + Safety Margin (${res1.safetyMargin}) = Recommended (${res1.recommendedQuantity})\n`);

  // SCENARIO 2: Low Historical Demand [3, 4, 2, 5] & Pre-Orders = 20
  console.log('--- SCENARIO 2: Historical Demand [3, 4, 2, 5] & Pre-Orders = 20 ---');
  const res2 = forecastService.calculateForecastFromHistory([3, 4, 2, 5], 20, 1, 48);
  console.log('Scenario 2 Outputs:', res2);
  if (res2.expectedDemand !== 20) {
    throw new Error(`Scenario 2 Expected Demand should be locked to Pre-Orders (20), got ${res2.expectedDemand}!`);
  }
  if (res2.safetyMargin !== 2) {
    throw new Error(`Scenario 2 Safety Margin should be 2, got ${res2.safetyMargin}!`);
  }
  if (res2.recommendedQuantity !== 22) {
    throw new Error(`Scenario 2 Recommended should be 22, got ${res2.recommendedQuantity}!`);
  }
  console.log('✅ Scenario 2 Passed: Pre-orders (20) successfully override low historical demand (4) to recommend 22 portions!\n');

  // SCENARIO 3: Live Query for Item #17 (Iced Cold Coffee with Ice Cream)
  console.log('--- SCENARIO 3: Live Database Query for Item #17 ---');
  const todayStr = new Date().toISOString().split('T')[0];
  const liveRes = await forecastService.getDishForecast(17, todayStr);
  console.log(`   • Historical Baseline:       ${liveRes.historicalBaseline} portions`);
  console.log(`   • Historical WMA:            ${liveRes.historicalWMA} portions`);
  console.log(`   • Historical 30d Mean:       ${liveRes.historicalMean} portions`);
  console.log(`   • Seasonality Factor:        ${liveRes.seasonalityFactor}x`);
  console.log(`   • Advance Pre-Orders:        ${liveRes.preOrderQuantity} portions`);
  console.log(`   • Expected Demand:           ${liveRes.expectedDemand} portions`);
  console.log(`   • Safety Margin (+8%):       +${liveRes.safetyMargin} portions`);
  console.log(`   • AI Recommended:            ${liveRes.recommendedQuantity} portions`);
  console.log(`   • Forecast vs Baseline:      ${liveRes.forecastChangePct}%`);
  console.log(`   • Confidence:                ${liveRes.confidence}`);
  console.log(`   • Reasoning:                 ${liveRes.reasoning}`);

  if (liveRes.recommendedQuantity === 3) {
    throw new Error('FAIL: AI Recommended is still 3!');
  }
  if (liveRes.recommendedQuantity < 25) {
    throw new Error(`FAIL: AI Recommended (${liveRes.recommendedQuantity}) is unexpectedly low!`);
  }

  console.log('\n🎉 ALL SCENARIOS PASSED WITH FULL MATHEMATICAL PRECISION & AUDITABILITY! 🚀\n');
}

testForecastGapAndScenarios().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
