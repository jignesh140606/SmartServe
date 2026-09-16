import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import Customer from '../models/Customer.js';
import Ticket from '../models/Ticket.js';
import Complaint from '../models/Complaint.js';

/**
 * Submit a CSAT rating for a resolved ticket/complaint.
 * POST /api/ratings
 */
export async function submitRating(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemId, itemType, rating, feedback } = req.body;

    if (!itemId || !itemType || !rating) {
      res.status(400).json({
        success: false,
        message: 'Validation error: itemId, itemType, and rating are required.',
        data: null,
      });
      return;
    }

    if (!['Ticket', 'Complaint'].includes(itemType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "Ticket" or "Complaint".',
        data: null,
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
        data: null,
      });
      return;
    }

    const ratingValue = parseInt(String(rating), 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
        data: null,
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        data: null,
      });
      return;
    }

    // Find customer record
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      res.status(403).json({
        success: false,
        message: 'Only customers can submit ratings.',
        data: null,
      });
      return;
    }

    // Verify the item exists and is Resolved/Closed
    const Model = itemType === 'Ticket' ? Ticket : Complaint;
    const item = await Model.findById(itemId);
    if (!item) {
      res.status(404).json({
        success: false,
        message: `${itemType} not found.`,
        data: null,
      });
      return;
    }

    if (!['Resolved', 'Closed'].includes(item.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot rate a ${itemType.toLowerCase()} that is not yet resolved or closed.`,
        data: null,
      });
      return;
    }

    // Check ownership
    if (item.customerId.toString() !== customer._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only rate your own tickets/complaints.',
        data: null,
      });
      return;
    }

    // Check for existing rating: feedback is only allowed once
    const existingRating = await Rating.findOne({
      itemType,
      itemId,
      customerId: customer._id,
    });

    if (existingRating) {
      res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this item. Rating is only allowed once.',
        data: null,
      });
      return;
    }

    const savedRating = await Rating.create({
      itemId,
      itemType,
      customerId: customer._id,
      rating: ratingValue,
      feedback: feedback ? String(feedback).trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully.',
      data: { rating: savedRating },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all ratings submitted by the current customer.
 * GET /api/ratings/my-ratings
 */
export async function getCustomerRatings(
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

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      res.status(200).json({
        success: true,
        message: 'No customer profile found.',
        data: { ratings: [] },
      });
      return;
    }

    const ratings = await Rating.find({ customerId: customer._id });
    res.status(200).json({
      success: true,
      message: 'Customer ratings retrieved.',
      data: { ratings },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get rating for a specific item.
 * GET /api/ratings/:itemType/:itemId
 */
export async function getRating(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemType, itemId } = req.params;

    if (!['Ticket', 'Complaint', 'ticket', 'complaint'].includes(itemType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid item type.',
        data: null,
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
        data: null,
      });
      return;
    }

    const normalizedType = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();

    const rating = await Rating.findOne({
      itemType: normalizedType,
      itemId,
    }).populate('customerId', 'userId');

    res.status(200).json({
      success: true,
      message: rating ? 'Rating retrieved.' : 'No rating found for this item.',
      data: { rating: rating || null },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregate CSAT stats (Admin).
 * GET /api/ratings/stats
 */
export async function getRatingStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allRatings = await Rating.find({});

    const totalRatings = allRatings.length;
    const averageRating =
      totalRatings > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach((r) => {
      const key = r.rating as 1 | 2 | 3 | 4 | 5;
      distribution[key] = (distribution[key] || 0) + 1;
    });

    const ticketRatings = allRatings.filter((r) => r.itemType === 'Ticket');
    const complaintRatings = allRatings.filter((r) => r.itemType === 'Complaint');

    const avgTicketRating =
      ticketRatings.length > 0
        ? ticketRatings.reduce((sum, r) => sum + r.rating, 0) / ticketRatings.length
        : 0;
    const avgComplaintRating =
      complaintRatings.length > 0
        ? complaintRatings.reduce((sum, r) => sum + r.rating, 0) / complaintRatings.length
        : 0;

    const stats = {
      totalRatings,
      averageRating: Math.round(averageRating * 100) / 100,
      avgTicketRating: Math.round(avgTicketRating * 100) / 100,
      avgComplaintRating: Math.round(avgComplaintRating * 100) / 100,
      distribution,
      byType: {
        tickets: { average: Math.round(avgTicketRating * 100) / 100, count: ticketRatings.length },
        complaints: { average: Math.round(avgComplaintRating * 100) / 100, count: complaintRatings.length },
      },
    };

    res.status(200).json({
      success: true,
      message: 'CSAT statistics retrieved.',
      data: {
        stats,
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
}
