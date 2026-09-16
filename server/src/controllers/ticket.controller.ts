import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Ticket, { TicketPriority, TicketStatus } from '../models/Ticket.js';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import { calculateSlaDeadline } from '../utils/sla.js';
import { generateTrackingQRCode } from '../utils/qrGenerator.js';
import { sendCreationEmail, sendStatusUpdateEmail, sendAssignmentEmail } from '../utils/emailService.js';

/**
 * Create a new service ticket (Customer creates).
 * POST /api/tickets
 */
export async function createTicket(
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
        message: 'Authentication required to create a ticket.',
        data: null,
      });
      return;
    }

    // Find or create linked Customer record
    let customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      customer = await Customer.create({
        userId: req.user._id,
        address: {},
      });
    }

    const validPriorities: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
    let ticketPriority: TicketPriority = 'Medium';
    if (priority) {
      const formattedPriority =
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      if (validPriorities.includes(formattedPriority as TicketPriority)) {
        ticketPriority = formattedPriority as TicketPriority;
      }
    }

    // Calculate SLA deadline based on priority
    const slaDeadline = calculateSlaDeadline(ticketPriority);

    const newTicket = await Ticket.create({
      customerId: customer._id,
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'General Request',
      priority: ticketPriority,
      status: 'Open',
      assignedTo: null,
      slaDeadline,
    });

    // Generate QR code for tracking
    const qrCode = await generateTrackingQRCode('ticket', newTicket._id.toString());
    if (qrCode) {
      newTicket.qrCode = qrCode;
      await newTicket.save();
    }

    const populatedTicket = await Ticket.findById(newTicket._id)
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
        'Ticket',
        {
          _id: newTicket._id.toString(),
          title: newTicket.title,
          category: newTicket.category,
          priority: newTicket.priority,
          slaDeadline: slaDeadline.toISOString(),
        },
        qrCode
      ).catch((err) => console.error('[Email] Creation email failed:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully.',
      data: {
        ticket: populatedTicket,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get tickets with strict role-based visibility.
 * GET /api/tickets
 * - Admin: sees all tickets
 * - Employee: sees only assigned tickets
 * - Customer: sees only their own tickets
 */
export async function getTickets(
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

    if (status) queryFilter.status = String(status);
    if (priority) queryFilter.priority = String(priority);
    if (category) queryFilter.category = new RegExp(String(category), 'i');

    // Role-based scoping
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer) {
        res.status(200).json({
          success: true,
          message: 'Tickets retrieved.',
          data: { tickets: [], count: 0 },
        });
        return;
      }
      queryFilter.customerId = customer._id;
    } else if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee) {
        res.status(200).json({
          success: true,
          message: 'Tickets retrieved.',
          data: { tickets: [], count: 0 },
        });
        return;
      }
      queryFilter.assignedTo = employee._id;
    }

    const tickets = await Ticket.find(queryFilter)
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
      message: 'Tickets retrieved successfully.',
      data: {
        tickets,
        count: tickets.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single ticket by ID with role check.
 * GET /api/tickets/:id
 */
export async function getTicketById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket identifier format.',
        data: null,
      });
      return;
    }

    const ticket = await Ticket.findById(id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role department designation' },
      });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket record not found.',
        data: null,
      });
      return;
    }

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || ticket.customerId._id.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this ticket.',
          data: null,
        });
        return;
      }
    } else if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee || !ticket.assignedTo || ticket.assignedTo._id.toString() !== employee._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to this ticket.',
          data: null,
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ticket retrieved successfully.',
      data: {
        ticket,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update ticket details (Customer before assignment, or Admin).
 * PUT /api/tickets/:id
 */
export async function updateTicket(
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
        message: 'Invalid ticket identifier format.',
        data: null,
      });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket record not found.',
        data: null,
      });
      return;
    }

    if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || ticket.customerId.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only edit your own tickets.',
          data: null,
        });
        return;
      }

      if (ticket.status !== 'Open' || ticket.assignedTo) {
        res.status(400).json({
          success: false,
          message: 'Modification prohibited: Ticket has already been assigned or processed.',
          data: null,
        });
        return;
      }
    }

    if (title) ticket.title = title.trim();
    if (description) ticket.description = description.trim();
    if (category) ticket.category = category.trim();

    if (priority) {
      const validPriorities: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
      const formattedPriority =
        priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      if (validPriorities.includes(formattedPriority as TicketPriority)) {
        ticket.priority = formattedPriority as TicketPriority;
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
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
      message: 'Ticket updated successfully.',
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update ticket status (Assigned Employee or Admin).
 * PATCH /api/tickets/:id/status
 */
export async function updateTicketStatus(
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
        message: 'Invalid ticket identifier format.',
        data: null,
      });
      return;
    }

    const validStatuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!status || !validStatuses.includes(status as TicketStatus)) {
      res.status(400).json({
        success: false,
        message: `Validation error: Status must be one of [${validStatuses.join(', ')}].`,
        data: null,
      });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket record not found.',
        data: null,
      });
      return;
    }

    if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (
        !employee ||
        !ticket.assignedTo ||
        ticket.assignedTo.toString() !== employee._id.toString()
      ) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to update this ticket.',
          data: null,
        });
        return;
      }
    } else if (req.user?.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id });
      if (!customer || ticket.customerId.toString() !== customer._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update tickets that you created.',
          data: null,
        });
        return;
      }
      if (!['Resolved', 'Closed'].includes(status)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Customers can only mark tickets as Resolved or Closed.',
          data: null,
        });
        return;
      }
    }

    ticket.status = status as TicketStatus;
    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role' },
      });

    // Send status update email to customer
    const customerData = (updatedTicket?.customerId as unknown) as Record<string, any>;
    const customerUser = customerData?.userId as Record<string, any>;
    if (customerUser?.email) {
      sendStatusUpdateEmail(
        String(customerUser.email),
        String(customerUser.name || 'Customer'),
        'Ticket',
        ticket.title,
        status as string
      ).catch((err) => console.error('[Email] Status update email failed:', err));
    }

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign ticket to an employee (Admin only).
 * PATCH /api/tickets/:id/assign
 */
export async function assignTicket(
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
        message: 'Invalid ticket identifier format.',
        data: null,
      });
      return;
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket record not found.',
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

    ticket.assignedTo = assignedEmployeeId;

    if (assignedEmployeeId && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email phone role' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name email phone role department designation' },
      });

    // Send assignment email to customer
    if (assignedEmployeeId && updatedTicket) {
      const custData = (updatedTicket.customerId as unknown) as Record<string, any>;
      const custUser = custData?.userId as Record<string, any>;
      const empData = (updatedTicket.assignedTo as unknown) as Record<string, any>;
      const empUser = empData?.userId as Record<string, any>;
      if (custUser?.email) {
        sendAssignmentEmail(
          String(custUser.email),
          String(custUser.name || 'Customer'),
          'Ticket',
          ticket.title,
          String(empUser?.name || 'Support Specialist'),
          ticket.slaDeadline?.toISOString()
        ).catch((err) => console.error('[Email] Assignment email failed:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: assignedEmployeeId
        ? 'Ticket assigned to employee successfully.'
        : 'Ticket unassigned successfully.',
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    next(error);
  }
}
