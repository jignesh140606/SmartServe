import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware to catch all unmatched route requests and return a 404 error.
 */
export function notFound(req: Request, res: Response, next: NextFunction): void {
  next(new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404));
}
