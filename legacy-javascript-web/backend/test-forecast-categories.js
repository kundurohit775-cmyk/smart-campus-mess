import { forecastService } from './src/services/forecastService.js';

async function testForecastCategories() {
  console.log('🧪 ====================================================================');
  console.log('   TESTING DEMAND FORECAST DISH NAMES ACROSS ALL CATEGORIES');
  console.log('======================================================================\n');

  const forecastPayload = await forecastService.getTodayForecast();
  const forecasts = forecastPayload.forecasts || [];

  console.log(`✅ Fetched bulk forecast: ${forecasts.length} active menu items for ${forecastPayload.targetDayName} (${forecastPayload.targetDate})\n`);

  const categories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];
  const foundCategories = new Set();

  for (const cat of categories) {
    const dishFc = forecasts.find(f => f.category?.toLowerCase() === cat.toLowerCase());
    if (dishFc) {
      foundCategories.add(cat);
      console.log(`📌 Category: [${cat.toUpperCase()}]`);
      console.log(`   • Food Name (dish_name):    "${dishFc.dish_name}"`);
      console.log(`   • Dish ID (dish_id):        #${dishFc.dish_id}`);
      console.log(`   • Recommended Prep:         ${dishFc.recommended_quantity} portions`);
      console.log(`   • Expected Demand:          ${dishFc.expected_demand}`);
      console.log(`   • Baseline Quantity:        ${dishFc.baseline_quantity}`);
      console.log(`   • Confidence Badge:         ${dishFc.confidence}`);
      console.log(`   • Seasonality Factor:       ${dishFc.seasonality_factor}x`);
      console.log(`   • Recency WMA:              ${dishFc.weighted_average}`);
      console.log(`   • Historical 30d Mean:      ${dishFc.historical_mean}`);
      console.log(`   • Same Weekday Matches:     ${dishFc.same_weekday_matches}`);
      console.log(`   • Reasoning:                "${dishFc.reasoning}"\n`);
    } else {
      console.log(`⚠️ Note: No dishes found in category [${cat}]`);
    }
  }

  // Verify all dishes have non-empty dish_name
  let missingNameCount = 0;
  for (const f of forecasts) {
    if (!f.dish_name || f.dish_name.trim() === '') {
      console.error(`❌ Missing dish_name for dish ID #${f.dish_id}`);
      missingNameCount++;
    }
  }

  if (missingNameCount > 0) {
    throw new Error(`${missingNameCount} forecast records have missing or empty dish names!`);
  }

  console.log(`🎉 ALL ${forecasts.length} FORECAST CARDS HAVE VALID DISH NAMES AND COMPLETE METRICS! 🚀\n`);
}

testForecastCategories().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
