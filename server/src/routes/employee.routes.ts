import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Protect all employee routes with authentication
router.use(authenticate);

// Admin-only management routes
router.get('/', checkRole(['admin']), getAllEmployees);
router.post('/', checkRole(['admin']), createEmployee);
router.put('/:id', checkRole(['admin']), updateEmployee);
router.patch('/:id/status', checkRole(['admin']), toggleEmployeeStatus);

// Employee & Admin detail access
router.get('/:id', getEmployeeById);

export default router;
