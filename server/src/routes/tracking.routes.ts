import { Router } from 'express';
import {
  getPublicTrackingInfo,
  getCannedResponsesList,
} from '../controllers/tracking.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// PUBLIC endpoint — no authentication required
router.get('/:type/:id', getPublicTrackingInfo);

export default router;

// Separate router for canned responses (authenticated, employee/admin only)
export const cannedResponsesRouter = Router();
cannedResponsesRouter.use(authenticate);
cannedResponsesRouter.get('/', checkRole(['admin', 'employee']), getCannedResponsesList);
