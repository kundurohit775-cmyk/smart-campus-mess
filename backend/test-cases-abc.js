import { forecastService } from './src/services/forecastService.js';
import { productionService } from './src/services/productionService.js';
import db from './src/db/database.js';

async function runCasesABC() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING DEMAND FORECASTING ENGINE CASES A, B, C & COFFEE LIVE TRACE');
  console.log('======================================================================\n');

  // CASE A:
  // Historical forecast = 48, Pre-orders = 20, Safety margin = 4
  // Expected recommendation: MAX(48, 20) + 4 = 52
  console.log('--- TEST CASE A: High Forecast (48) + Moderate Pre-Orders (20) ---');
  const resA = forecastService.calculateRecommended(48, 20);
  console.log('Inputs:  forecastDemand = 48, preOrders = 20');
  console.log('Outputs:', resA);
  if (resA.expectedDemand !== 48) throw new Error(`Case A expectedDemand should be 48, got ${resA.expectedDemand}`);
  if (resA.safetyMargin !== 4) throw new Error(`Case A safetyMargin should be 4, got ${resA.safetyMargin}`);
  if (resA.recommendedQuantity !== 52) throw new Error(`Case A recommendedQuantity should be 52, got ${resA.recommendedQuantity}`);
  console.log('✅ Case A Passed: MAX(48, 20) + 4 = 52\n');

  // CASE B:
  // Historical forecast = 3, Pre-orders = 20, Safety margin = 2
  // Expected recommendation: MAX(3, 20) + 2 = 22
  console.log('--- TEST CASE B: Low Forecast (3) + High Pre-Orders (20) ---');
  const resB = forecastService.calculateRecommended(3, 20);
  console.log('Inputs:  forecastDemand = 3, preOrders = 20');
  console.log('Outputs:', resB);
  if (resB.expectedDemand !== 20) throw new Error(`Case B expectedDemand should be 20, got ${resB.expectedDemand}`);
  if (resB.safetyMargin !== 2) throw new Error(`Case B safetyMargin should be 2, got ${resB.safetyMargin}`);
  if (resB.recommendedQuantity !== 22) throw new Error(`Case B recommendedQuantity should be 22, got ${resB.recommendedQuantity}`);
  console.log('✅ Case B Passed: MAX(3, 20) + 2 = 22 (Pre-orders properly protect kitchen from low 3-portion forecast!)\n');

  // CASE C:
  // Historical forecast = 48, Pre-orders = 0, Safety margin = 4
  // Expected recommendation: 48 + 4 = 52
  console.log('--- TEST CASE C: High Forecast (48) + Zero Pre-Orders (0) ---');
  const resC = forecastService.calculateRecommended(48, 0);
  console.log('Inputs:  forecastDemand = 48, preOrders = 0');
  console.log('Outputs:', resC);
  if (resC.expectedDemand !== 48) throw new Error(`Case C expectedDemand should be 48, got ${resC.expectedDemand}`);
  if (resC.safetyMargin !== 4) throw new Error(`Case C safetyMargin should be 4, got ${resC.safetyMargin}`);
  if (resC.recommendedQuantity !== 52) throw new Error(`Case C recommendedQuantity should be 52, got ${resC.recommendedQuantity}`);
  console.log('✅ Case C Passed: 48 + 4 = 52\n');

  // LIVE DATABASE TEST FOR ICED COLD COFFEE WITH ICE CREAM (#17)
  console.log('--- LIVE TEST: Item #17 (Iced Cold Coffee with Ice Cream) ---');
  const todayStr = new Date().toISOString().split('T')[0];
  const liveCoffeeForecast = await forecastService.getDishForecast(17, todayStr);
  console.log('Live Forecast Result for Coffee:');
  console.log(`   • Historical Baseline:       ${liveCoffeeForecast.historicalBaseline} portions`);
  console.log(`   • Historical WMA:            ${liveCoffeeForecast.historicalWMA} portions`);
  console.log(`   • Historical 30d Mean:       ${liveCoffeeForecast.historicalMean} portions`);
  console.log(`   • Seasonality Factor:        ${liveCoffeeForecast.seasonalityFactor}x`);
  console.log(`   • Advance Pre-Orders:        ${liveCoffeeForecast.preOrderQuantity} portions`);
  console.log(`   • Expected Demand:           ${liveCoffeeForecast.expectedDemand} portions`);
  console.log(`   • Safety Margin (+8%):       +${liveCoffeeForecast.safetyMargin} portions`);
  console.log(`   • AI Recommended Prep:       ${liveCoffeeForecast.recommendedQuantity} portions`);
  console.log(`   • Confidence:                ${liveCoffeeForecast.confidence}`);

  if (liveCoffeeForecast.recommendedQuantity < 25) {
    throw new Error(`Live Coffee recommendation (${liveCoffeeForecast.recommendedQuantity}) is unexpectedly low! Should be anchored to menu batch.`);
  }

  console.log('\n🎉 ALL CASES A, B, C AND LIVE COFFEE TRACE TESTS PASSED SUCCESSFULLY! 🚀\n');
}

runCasesABC().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
