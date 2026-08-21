import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication middleware that verifies the JWT Bearer token in the Authorization header
 * and attaches the authenticated user instance to req.user.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication failed: No authorization token provided.',
        data: null,
      });
      return;
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid or expired token.',
        data: null,
      });
      return;
    }

    // Verify that user still exists in the database
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: 'Authentication failed: The user account for this token no longer exists.',
        data: null,
      });
      return;
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}
