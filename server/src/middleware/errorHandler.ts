import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

/**
 * Global centralized error handling middleware.
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = 'Resource not found: Invalid identifier format';
    statusCode = 400;
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'Field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
    statusCode = 409;
  }

  // Handle Mongoose Schema Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join('; ');
    statusCode = 400;
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
}
