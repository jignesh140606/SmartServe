import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Attachment from '../models/Attachment.js';
import Ticket from '../models/Ticket.js';
import Complaint from '../models/Complaint.js';

/**
 * Upload attachments to a ticket or complaint.
 * POST /api/attachments/:itemType/:itemId
 */
export async function uploadAttachments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemType, itemId } = req.params;

    if (!['ticket', 'complaint'].includes(itemType.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "ticket" or "complaint".',
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

    // Verify the item exists
    const normalizedType = itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();
    const Model = normalizedType === 'Ticket' ? Ticket : Complaint;
    const item = await Model.findById(itemId);
    if (!item) {
      res.status(404).json({
        success: false,
        message: `${normalizedType} not found.`,
        data: null,
      });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded. Please attach at least one file.',
        data: null,
      });
      return;
    }

    const attachments = await Promise.all(
      req.files.map((file) =>
        Attachment.create({
          itemId,
          itemType: normalizedType,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user?._id,
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${attachments.length} file(s) uploaded successfully.`,
      data: { attachments },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all attachments for a ticket or complaint.
 * GET /api/attachments/:itemType/:itemId
 */
export async function getAttachments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemType, itemId } = req.params;

    if (!['ticket', 'complaint'].includes(itemType.toLowerCase())) {
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

    const attachments = await Attachment.find({
      itemType: normalizedType,
      itemId,
    })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Attachments retrieved successfully.',
      data: { attachments, count: attachments.length },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an attachment by ID.
 * DELETE /api/attachments/:id
 */
export async function deleteAttachment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid attachment ID format.',
        data: null,
      });
      return;
    }

    const attachment = await Attachment.findById(id);
    if (!attachment) {
      res.status(404).json({
        success: false,
        message: 'Attachment not found.',
        data: null,
      });
      return;
    }

    // Only admin or the uploader can delete
    if (
      req.user?.role !== 'admin' &&
      attachment.uploadedBy.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own attachments.',
        data: null,
      });
      return;
    }

    await Attachment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}
