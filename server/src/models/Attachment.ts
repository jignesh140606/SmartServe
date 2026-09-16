import mongoose, { Document, Schema, Model } from 'mongoose';

export type AttachmentItemType = 'Ticket' | 'Complaint';

export interface IAttachment extends Document {
  _id: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  itemType: AttachmentItemType;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Item ID is required'],
      index: true,
    },
    itemType: {
      type: String,
      enum: {
        values: ['Ticket', 'Complaint'],
        message: '{VALUE} is not a valid item type',
      },
      required: [true, 'Item type is required'],
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    mimetype: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Compound index for fast lookup
attachmentSchema.index({ itemType: 1, itemId: 1 });

export const Attachment: Model<IAttachment> = mongoose.model<IAttachment>('Attachment', attachmentSchema);
export default Attachment;
