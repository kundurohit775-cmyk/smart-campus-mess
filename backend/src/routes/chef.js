import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { forecastService } from '../services/forecastService.js';
import { wastageService } from '../services/wastageService.js';

const router = express.Router();

// Middleware: All routes in /api/chef require chef or admin role
router.use(authenticateToken, requireRole('chef', 'admin'));

/**
 * GET /api/chef/forecast/today
 * Returns demand forecasts for every dish scheduled on today's/tomorrow's menu
 */
router.get('/forecast/today', async (req, res, next) => {
  try {
    const targetDate = req.query.date;
    const forecast = await forecastService.getTodayForecast(targetDate);
    res.json(forecast);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chef/forecast/:dishId
 * Returns last 30 days history + weighted moving average & day-of-week forecast for a single dish
 */
router.get('/forecast/:dishId', async (req, res, next) => {
  try {
    const dishId = req.params.dishId;
    const targetDate = req.query.date;
    const forecast = await forecastService.getDishForecast(dishId, targetDate);
    res.json({ forecast });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chef/wastage/preload
 * Returns dishes pre-filled with actual sales counts from today's orders for quick-entry
 */
router.get('/wastage/preload', async (req, res, next) => {
  try {
    const targetDate = req.query.date;
    const data = await wastageService.getPreloadForDate(targetDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chef/wastage
 * Chef logs daily prepared, sold, wasted, and reasons
 */
router.post('/wastage', async (req, res, next) => {
  try {
    const chefId = req.user.id || req.user.admin_id;
    const entries = Array.isArray(req.body) ? req.body : req.body.entries ? req.body.entries : [req.body];

    const result = await wastageService.logWastage(chefId, entries);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to log wastage.' });
  }
});

/**
 * GET /api/chef/wastage/trends
 * Returns aggregated wastage stats, daily timelines, waste %, and dish breakdown
 */
router.get('/wastage/trends', async (req, res, next) => {
  try {
    const period = req.query.period || '30d';
    const trends = await wastageService.getWastageTrends(period);
    res.json({ trends });
  } catch (err) {
    next(err);
  }
});

export default router;
