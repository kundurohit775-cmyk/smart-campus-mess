import { forecastService } from './src/services/forecastService.js';
import db from './src/db/database.js';

async function testForecastOutput() {
  console.log('🔍 Testing forecastService.getTodayForecast()...');
  const res = await forecastService.getTodayForecast();
  console.log('Total dishes returned:', res.totalDishes);
  if (res.forecasts && res.forecasts.length > 0) {
    console.log('Sample forecast[0]:', JSON.stringify(res.forecasts[0], null, 2));
    console.log('Sample forecast[1]:', JSON.stringify(res.forecasts[1], null, 2));
  }
}

testForecastOutput().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
