import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

/**
 * Role authorization guard middleware.
 * Checks if authenticated user has one of the allowed roles.
 * Example: checkRole(['admin']) or checkRole(['admin', 'employee'])
 */
export function checkRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.',
        data: null,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        data: null,
      });
      return;
    }

    next();
  };
}

/**
 * Convenience alias for authorizeRoles
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => checkRole(allowedRoles);
