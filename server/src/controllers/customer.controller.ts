import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

/**
 * Get all customers (Admin only).
 * GET /api/customers
 */
export async function getAllCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customers = await Customer.find()
      .populate('userId', 'name email phone role createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully.',
      data: {
        customers,
        count: customers.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer details by ID (Customer ID or linked User ID).
 * GET /api/customers/:id
 */
export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer identifier format.',
        data: null,
      });
      return;
    }

    // Try finding by Customer _id, or by linked userId
    let customer = await Customer.findById(id).populate(
      'userId',
      'name email phone role createdAt'
    );

    if (!customer) {
      customer = await Customer.findOne({ userId: id }).populate(
        'userId',
        'name email phone role createdAt'
      );
    }

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer record not found.',
        data: null,
      });
      return;
    }

    // Permission check: Admin & Employee can view any customer. Customers can only view their own profile.
    if (req.user?.role === 'customer') {
      const linkedUserId = customer.userId?._id
        ? customer.userId._id.toString()
        : customer.userId.toString();
      if (linkedUserId !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this customer profile.',
          data: null,
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully.',
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update customer profile & address.
 * PUT /api/customers/:id
 */
export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { address, name, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer identifier format.',
        data: null,
      });
      return;
    }

    // Find customer by Customer _id or userId
    let customer = await Customer.findById(id);
    if (!customer) {
      customer = await Customer.findOne({ userId: id });
    }

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer record not found.',
        data: null,
      });
      return;
    }

    // Permission check: Admin can update any customer. Customer can only update own profile.
    if (req.user?.role === 'customer') {
      if (customer.userId.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update your own customer profile.',
          data: null,
        });
        return;
      }
    }

    // Update Address fields if provided
    if (address && typeof address === 'object') {
      customer.address = {
        street: address.street ?? customer.address?.street ?? '',
        city: address.city ?? customer.address?.city ?? '',
        state: address.state ?? customer.address?.state ?? '',
        zipCode: address.zipCode ?? customer.address?.zipCode ?? '',
        country: address.country ?? customer.address?.country ?? '',
      };
    }

    await customer.save();

    // Update user details (name, phone) if provided
    if (name || phone !== undefined) {
      const userUpdates: Record<string, string> = {};
      if (name) userUpdates.name = name.trim();
      if (phone !== undefined) userUpdates.phone = phone.trim();

      await User.findByIdAndUpdate(customer.userId, userUpdates, { new: true });
    }

    // Return updated populated record
    const updatedCustomer = await Customer.findById(customer._id).populate(
      'userId',
      'name email phone role createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully.',
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    next(error);
  }
}
