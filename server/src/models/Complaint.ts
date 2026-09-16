import mongoose, { Document, Schema, Model } from 'mongoose';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: mongoose.Types.ObjectId | null;
  slaDeadline?: Date;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      trim: true,
      default: 'General Support',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'In Progress', 'Resolved', 'Closed'],
        message: '{VALUE} is not a valid complaint status',
      },
      default: 'Open',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
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

export const Complaint: Model<IComplaint> = mongoose.model<IComplaint>('Complaint', complaintSchema);
export default Complaint;
