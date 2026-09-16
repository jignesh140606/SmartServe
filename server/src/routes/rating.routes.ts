import { Router } from 'express';
import {
  submitRating,
  getRating,
  getRatingStats,
} from '../controllers/rating.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Require JWT authentication for all rating endpoints
router.use(authenticate);

// Submit or update a rating (customer only)
router.post('/', submitRating);

// Get aggregate CSAT stats (admin only)
router.get('/stats', checkRole(['admin']), getRatingStats);

// Get rating for a specific item
router.get('/:itemType/:itemId', getRating);

export default router;
