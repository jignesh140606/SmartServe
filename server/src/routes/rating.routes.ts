import { Router } from 'express';
import {
  submitRating,
  getRating,
  getRatingStats,
  getCustomerRatings,
} from '../controllers/rating.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Require JWT authentication for all rating endpoints
router.use(authenticate);

// Submit a rating (customer only - allowed once per item)
router.post('/', submitRating);

// Get ratings submitted by current logged-in customer
router.get('/my-ratings', getCustomerRatings);

// Get aggregate CSAT stats (admin only)
router.get('/stats', checkRole(['admin']), getRatingStats);

// Get rating for a specific item
router.get('/:itemType/:itemId', getRating);

export default router;
