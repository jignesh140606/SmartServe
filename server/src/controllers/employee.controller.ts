import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

/**
 * Get all employees (Admin only).
 * GET /api/employees
 */
export async function getAllEmployees(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { department, isActive } = req.query;

    const filter: Record<string, unknown> = {};
    if (department) {
      filter.department = new RegExp(String(department), 'i');
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const employees = await Employee.find(filter)
      .populate('userId', 'name email phone role createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully.',
      data: {
        employees,
        count: employees.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single employee by ID.
 * GET /api/employees/:id
 */
export async function getEmployeeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee identifier format.',
        data: null,
      });
      return;
    }

    let employee = await Employee.findById(id).populate(
      'userId',
      'name email phone role createdAt'
    );

    if (!employee) {
      employee = await Employee.findOne({ userId: id }).populate(
        'userId',
        'name email phone role createdAt'
      );
    }

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee record not found.',
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully.',
      data: {
        employee,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin provisions new Employee account.
 * POST /api/employees
 */
export async function createEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, department, designation, phone } = req.body;

    // Validation
    if (!name || !email || !password || !department || !designation) {
      res.status(400).json({
        success: false,
        message:
          'Validation error: Name, email, password, department, and designation are required.',
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

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered.',
        data: null,
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record with role 'employee'
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'employee',
      phone: phone ? phone.trim() : '',
    });

    // Create Employee record
    const newEmployee = await Employee.create({
      userId: newUser._id,
      department: department.trim(),
      designation: designation.trim(),
      isActive: true,
    });

    // Return populated employee
    const populatedEmployee = await Employee.findById(newEmployee._id).populate(
      'userId',
      'name email phone role createdAt'
    );

    res.status(201).json({
      success: true,
      message: 'Employee account provisioned successfully.',
      data: {
        employee: populatedEmployee,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin updates Employee details.
 * PUT /api/employees/:id
 */
export async function updateEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { department, designation, name, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee identifier format.',
        data: null,
      });
      return;
    }

    let employee = await Employee.findById(id);
    if (!employee) {
      employee = await Employee.findOne({ userId: id });
    }

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee record not found.',
        data: null,
      });
      return;
    }

    if (department) employee.department = department.trim();
    if (designation) employee.designation = designation.trim();
    await employee.save();

    // Update linked user details
    if (name || phone !== undefined) {
      const userUpdates: Record<string, string> = {};
      if (name) userUpdates.name = name.trim();
      if (phone !== undefined) userUpdates.phone = phone.trim();

      await User.findByIdAndUpdate(employee.userId, userUpdates);
    }

    const updatedEmployee = await Employee.findById(employee._id).populate(
      'userId',
      'name email phone role createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: {
        employee: updatedEmployee,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin activates / deactivates Employee.
 * PATCH /api/employees/:id/status
 */
export async function toggleEmployeeStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee identifier format.',
        data: null,
      });
      return;
    }

    let employee = await Employee.findById(id);
    if (!employee) {
      employee = await Employee.findOne({ userId: id });
    }

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee record not found.',
        data: null,
      });
      return;
    }

    // Toggle or set specific boolean
    employee.isActive = typeof isActive === 'boolean' ? isActive : !employee.isActive;
    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id).populate(
      'userId',
      'name email phone role createdAt'
    );

    res.status(200).json({
      success: true,
      message: `Employee account status updated to ${employee.isActive ? 'Active' : 'Inactive'}.`,
      data: {
        employee: updatedEmployee,
      },
    });
  } catch (error) {
    next(error);
  }
}
