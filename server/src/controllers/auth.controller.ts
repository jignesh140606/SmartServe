import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.js';
import Customer from '../models/Customer.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user account.
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, phone } = req.body;

    // Basic Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Validation error: Name, email, and password are required fields.',
        data: null,
      });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Validation error: Password must be at least 6 characters long.',
        data: null,
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered.',
        data: null,
      });
      return;
    }

    // Role validation
    const validRoles: UserRole[] = ['admin', 'employee', 'customer'];
    const userRole: UserRole = role && validRoles.includes(role) ? role : 'customer';

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create and save new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: userRole,
      phone: phone ? phone.trim() : '',
    });

    // Auto-create Customer profile if user role is customer
    if (userRole === 'customer') {
      await Customer.create({
        userId: newUser._id,
        address: {},
      });
    }

    // Issue JWT token (7-day expiry)
    const token = generateToken({
      userId: newUser._id.toString(),
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate existing user and issue token.
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Validation error: Both email and password are required.',
        data: null,
      });
      return;
    }

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        data: null,
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
        data: null,
      });
      return;
    }

    // Issue JWT token (7-day expiry)
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated.',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}
