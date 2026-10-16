import mongoose from 'mongoose';

/**
 * Permission Schema — Catalog of valid assignable permissions
 * Aligns with Section 26 of Task 1 - Access Control PDF.
 */
const PermissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: [true, 'Module is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Permission code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isApplicable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Compound unique index on module and action
PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

export const Permission = mongoose.model('Permission', PermissionSchema);
