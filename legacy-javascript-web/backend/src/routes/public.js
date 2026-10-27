import express from 'express';
import { sustainabilityService } from '../services/sustainabilityService.js';

const router = express.Router();

/**
 * GET /api/public/food-saved
 * Public, unauthenticated endpoint showcasing cumulative food waste avoided via Pre-Orders
 */
router.get('/food-saved', async (req, res, next) => {
  try {
    const stats = await sustainabilityService.getPublicFoodSavedStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
