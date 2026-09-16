import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  assignComplaint,
} from '../controllers/complaint.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Require JWT authentication for all complaint endpoints
router.use(authenticate);

// Public complaint operations (Role visibility handled in controller)
router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint);

// Status update (Admin, assigned Employee, or complaint owner Customer to mark Resolved)
router.patch('/:id/status', checkRole(['admin', 'employee', 'customer']), updateComplaintStatus);

// Assignment operation (Admin only)
router.patch('/:id/assign', checkRole(['admin']), assignComplaint);

export default router;
