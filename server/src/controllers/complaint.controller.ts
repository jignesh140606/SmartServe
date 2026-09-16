import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Complaint, { ComplaintPriority, ComplaintStatus } from '../models/Complaint.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import { calculateSlaDeadline } from '../utils/sla.js';
import { generateTrackingQRCode } from '../utils/qrGenerator.js';
import { sendCreationEmail, sendStatusUpdateEmail, sendAssignmentEmail } from '../utils/emailService.js';

/**
 * Create a new complaint (Customer creates).
 * POST /api/complaints
 */
export async function createComplaint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Validation error: Title and description are required.',
        data: null,
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to submit a complaint.',
        data: null,
      });
      return;
    }

    // Find or create linked Customer record for the user
    let customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      customer = await Customer.create({
        userId: req.user._id,
        address: {},
      });
    }

    // Normalize priority if provided
    const validPriorities: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    let complaintPriority: ComplaintPriority = 'Medium';
    if (priority) {
      const formattedPriority =
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      if (validPriorities.includes(formattedPriority as ComplaintPriority)) {
        complaintPriority = formattedPriority as ComplaintPriority;
      }
    }

    // Calculate SLA deadline based on priority
    const slaDeadline = calculateSlaDeadline(complaintPriority);

    const newComplaint = await Complaint.create({
      customerId: customer._id,
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'General Support',
      priority: complaintPriority,
      status: 'Open',
      assignedTo: null,
      slaDeadline,
    });

    // Generate QR code for tracking
    const qrCode = await generateTrackingQRCode('complaint', newComplaint._id.toString());
    if (qrCode) {
      newComplaint.qrCode = qrCode;
      await newComplaint.save();
    }

    const populatedComplaint = await Complaint.findById(newComplaint._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role' },
      });

    // Send creation email with QR code to customer
    if (req.user?.email) {
      sendCreationEmail(
        req.user.email,
        req.user.name || 'Customer',
        'Complaint',
        {
          _id: newComplaint._id.toString(),
          title: newComplaint.title,
          category: newComplaint.category,
          priority: newComplaint.priority,
          slaDeadline: slaDeadline.toISOString(),
        },
        qrCode
      ).catch((err) => console.error('[Email] Creation email failed:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: {
        complaint: populatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get complaints with strict role-based visibility.
 * GET /api/complaints
 * - Admin: sees all complaints across the system
 * - Employee: sees only complaints assigned to them
 * - Customer: sees only their own complaints
 */
export async function getComplaints(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        data: null,
      });
      return;
    }

    const { status, priority, category } = req.query;
    const queryFilter: Record<string, unknown> = {};

    if (status) {
      queryFilter.status = String(status);
    }
    if (priority) {
      queryFilter.priority = String(priority);
    }
    if (category) {
      queryFilter.category = new RegExp(String(category), 'i');
    }

    // Role-based scoping
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer) {
        res.status(200).json({
          success: true,
          message: 'Complaints retrieved.',
          data: { complaints: [], count: 0 },
        });
        return;
      }
      queryFilter.customerId = customer._id;
    } else if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee) {
        res.status(200).json({
          success: true,
          message: 'Complaints retrieved.',
          data: { complaints: [], count: 0 },
        });
        return;
      }
      queryFilter.assignedTo = employee._id;
    }
    // Admin sees all without extra scoping

    const complaints = await Complaint.find(queryFilter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role department designation' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully.',
      data: {
        complaints,
        count: complaints.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single complaint by ID with access check.
 * GET /api/complaints/:id
 */
export async function getComplaintById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier format.',
        data: null,
      });
      return;
    }

    const complaint = await Complaint.findById(id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role department designation' },
      });

    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
        data: null,
      });
      return;
    }

    // Role-based access check
    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || complaint.customerId._id.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this complaint.',
          data: null,
        });
        return;
      }
    } else if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee || !complaint.assignedTo || complaint.assignedTo._id.toString() !== employee._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to this complaint.',
          data: null,
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Complaint retrieved successfully.',
      data: {
        complaint,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint details (Customer before assignment, or Admin).
 * PUT /api/complaints/:id
 */
export async function updateComplaint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, category, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier format.',
        data: null,
      });
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
        data: null,
      });
      return;
    }

    // Customer editing restriction
    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || complaint.customerId.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only edit your own complaints.',
          data: null,
        });
        return;
      }

      if (complaint.status !== 'Open' || complaint.assignedTo) {
        res.status(400).json({
          success: false,
          message: 'Modification prohibited: Complaint has already been assigned or processed.',
          data: null,
        });
        return;
      }
    }

    if (title) complaint.title = title.trim();
    if (description) complaint.description = description.trim();
    if (category) complaint.category = category.trim();

    if (priority) {
      const validPriorities: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];
      const formattedPriority =
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      if (validPriorities.includes(formattedPriority as ComplaintPriority)) {
        complaint.priority = formattedPriority as ComplaintPriority;
      }
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role' },
      });

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint status (Employee assigned or Admin).
 * PATCH /api/complaints/:id/status
 */
export async function updateComplaintStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier format.',
        data: null,
      });
      return;
    }

    const validStatuses: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!status || !validStatuses.includes(status as ComplaintStatus)) {
      res.status(400).json({
        success: false,
        message: `Validation error: Status must be one of [${validStatuses.join(', ')}].`,
        data: null,
      });
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
        data: null,
      });
      return;
    }

    // Role check for Employee or Customer
    if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (
        !employee ||
        !complaint.assignedTo ||
        complaint.assignedTo.toString() !== employee._id.toString()
      ) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to update this complaint.',
          data: null,
        });
        return;
      }
    } else if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || complaint.customerId.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update complaints that you submitted.',
          data: null,
        });
        return;
      }
      if (!['Resolved', 'Closed'].includes(status)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Customers can only mark complaints as Resolved or Closed.',
          data: null,
        });
        return;
      }
    }

    complaint.status = status as ComplaintStatus;
    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role' },
      });

    // Send status update email to customer
    const customerData = (updatedComplaint?.customerId as unknown) as Record<string, unknown>;
    const customerUser = customerData?.userId as Record<string, unknown>;
    if (customerUser?.email) {
      sendStatusUpdateEmail(
        String(customerUser.email),
        String(customerUser.name || 'Customer'),
        'Complaint',
        complaint.title,
        status as string
      ).catch((err) => console.error('[Email] Status update email failed:', err));
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign complaint to an employee (Admin only).
 * PATCH /api/complaints/:id/assign
 */
export async function assignComplaint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid complaint identifier format.',
        data: null,
      });
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
        data: null,
      });
      return;
    }

    let assignedEmployeeId: mongoose.Types.ObjectId | null = null;

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid employee identifier format.',
          data: null,
        });
        return;
      }

      // Check if employee exists by Employee _id or by User _id
      let employee = await Employee.findById(employeeId);
      if (!employee) {
        employee = await Employee.findOne({ userId: employeeId });
      }

      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Target employee record not found.',
          data: null,
        });
        return;
      }

      assignedEmployeeId = employee._id;
    }

    complaint.assignedTo = assignedEmployeeId;

    // Auto-advance status from 'Open' to 'In Progress' upon assignment
    if (assignedEmployeeId && complaint.status === 'Open') {
      complaint.status = 'In Progress';
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role department designation' },
      });

    // Send assignment email to customer
    if (assignedEmployeeId && updatedComplaint) {
      const custData = (updatedComplaint.customerId as unknown) as Record<string, unknown>;
      const custUser = custData?.userId as Record<string, unknown>;
      const empData = (updatedComplaint.assignedTo as unknown) as Record<string, unknown>;
      const empUser = empData?.userId as Record<string, unknown>;
      if (custUser?.email) {
        sendAssignmentEmail(
          String(custUser.email),
          String(custUser.name || 'Customer'),
          'Complaint',
          complaint.title,
          String(empUser?.name || 'Support Specialist'),
          complaint.slaDeadline?.toISOString()
        ).catch((err) => console.error('[Email] Assignment email failed:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: assignedEmployeeId
        ? 'Complaint assigned to employee successfully.'
        : 'Complaint unassigned successfully.',
      data: {
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
}
