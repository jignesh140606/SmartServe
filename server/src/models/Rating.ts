import mongoose, { Document, Schema, Model } from 'mongoose';

export type RatingItemType = 'Ticket' | 'Complaint';

export interface IRating extends Document {
  _id: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  itemType: RatingItemType;
  customerId: mongoose.Types.ObjectId;
  rating: number;
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
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
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating value is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
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

// Prevent duplicate ratings per item
ratingSchema.index({ itemType: 1, itemId: 1, customerId: 1 }, { unique: true });

export const Rating: Model<IRating> = mongoose.model<IRating>('Rating', ratingSchema);
export default Rating;
