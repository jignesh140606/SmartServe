import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  assignTicket,
} from '../controllers/ticket.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Require JWT authentication for all ticket endpoints
router.use(authenticate);

// Public ticket operations (Role visibility handled in controller)
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);

// Status update (Admin or assigned Employee)
router.patch('/:id/status', checkRole(['admin', 'employee']), updateTicketStatus);

// Assignment operation (Admin only)
router.patch('/:id/assign', checkRole(['admin']), assignTicket);

export default router;
