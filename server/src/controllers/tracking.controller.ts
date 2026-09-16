import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import Complaint from '../models/Complaint.js';
import Rating from '../models/Rating.js';
import Attachment from '../models/Attachment.js';
import { getCannedResponses } from '../utils/cannedResponses.js';
import { generateTrackingQRCode } from '../utils/qrGenerator.js';

/**
 * Get public tracking information for a ticket or complaint (NO AUTH REQUIRED).
 * GET /api/track/:type/:id
 */
export async function getPublicTrackingInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { type, id } = req.params;

    if (!['ticket', 'complaint'].includes(type.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "ticket" or "complaint".',
        data: null,
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID format.',
        data: null,
      });
      return;
    }

    const Model = type.toLowerCase() === 'ticket' ? Ticket : Complaint;

    const item = await Model.findById(id)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'name' },
      });

    if (!item) {
      res.status(404).json({
        success: false,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found.`,
        data: null,
      });
      return;
    }

    // Get rating if exists
    const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    const rating = await Rating.findOne({ itemType: normalizedType, itemId: id });

    // Get attachment count
    const attachmentCount = await Attachment.countDocuments({
      itemType: normalizedType,
      itemId: id,
    });

    // Return sanitized public data (no sensitive info)
    const rawItem = (item as unknown) as Record<string, any>;
    const custObj = (item.customerId as unknown) as Record<string, any>;
    const empObj = (item.assignedTo as unknown) as Record<string, any>;

    let qrCode = rawItem.qrCode || null;
    if (!qrCode) {
      qrCode = await generateTrackingQRCode(
        type.toLowerCase() as 'ticket' | 'complaint',
        item._id.toString()
      );
      if (qrCode) {
        (item as any).qrCode = qrCode;
        await item.save().catch(() => {});
      }
    }

    const publicData = {
      _id: item._id,
      type: normalizedType,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      slaDeadline: rawItem.slaDeadline || null,
      qrCode: qrCode || null,
      customerName: custObj?.userId?.name || 'Customer',
      assignedToName: empObj?.userId?.name || null,
      rating: rating ? { rating: rating.rating, feedback: rating.feedback } : null,
      attachmentCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Tracking information retrieved.',
      data: { item: publicData },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available canned responses for employees.
 * GET /api/canned-responses
 */
export async function getCannedResponsesList(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const category = req.query.category as string | undefined;
  const responses = getCannedResponses(category);

  res.status(200).json({
    success: true,
    message: 'Canned responses retrieved.',
    data: { responses, count: responses.length },
  });
}
