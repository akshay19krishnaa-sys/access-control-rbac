import mongoose from 'mongoose';

const ApprovalLevelSchema = new mongoose.Schema(
  {
    levelNumber: {
      type: Number,
      required: [true, 'Level number/order is required'],
      min: [1, 'Level number must be at least 1'],
    },
    levelId: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Level name is required'],
      trim: true,
      maxlength: [100, 'Level name cannot exceed 100 characters'],
    },
    approver: {
      type: String,
      required: [true, 'Approver role/title is required'],
      trim: true,
      maxlength: [100, 'Approver cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    approvalLimit: {
      type: Number,
      default: null,
      min: [0, 'Approval limit cannot be negative'],
    },
    threshold: {
      type: String,
      trim: true,
      default: 'No Limit',
    },
    turnaround: {
      type: String,
      trim: true,
      default: '24 hours',
    },
    color: {
      type: String,
      default: '#176B87',
    },
    status: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Status must be either ACTIVE or INACTIVE',
      },
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.statusLower = ret.status ? ret.status.toLowerCase() : 'active';
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.statusLower = ret.status ? ret.status.toLowerCase() : 'active';
        return ret;
      },
    },
  }
);

ApprovalLevelSchema.index({ levelNumber: 1 }, { unique: true });

export const ApprovalLevel = mongoose.model('ApprovalLevel', ApprovalLevelSchema);
