import { Router } from 'express';
import {
  submitRating,
  getRating,
  getRatingStats,
  getCustomerRatings,
  getAllRatings,
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

// Get all ratings (admin & employee)
router.get('/', checkRole(['admin', 'employee']), getAllRatings);

// Get aggregate CSAT stats (admin & employee)
router.get('/stats', checkRole(['admin', 'employee']), getRatingStats);

// Get rating for a specific item
router.get('/:itemType/:itemId', getRating);

export default router;
