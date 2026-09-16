import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Protect all customer routes with JWT authentication
router.use(authenticate);

// Admin-only: list all registered customers
router.get('/', checkRole(['admin']), getAllCustomers);

// View and update customer profile
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

// Admin-only: delete customer account and user login
router.delete('/:id', checkRole(['admin']), deleteCustomer);

export default router;
