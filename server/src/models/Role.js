import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [100, 'Role name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    branchScope: {
      type: String,
      required: [true, 'Branch scope is required'],
      enum: {
        values: ['Assigned Branch', 'Selected Branches', 'All Branches'],
        message: '{VALUE} is not a valid branch scope',
      },
      default: 'Assigned Branch',
    },
    selectedBranches: {
      type: [String],
      default: [],
    },
    approvalLevel: {
      type: Number,
      default: 0,
      min: [0, 'Approval level cannot be less than 0'],
      max: [4, 'Approval level cannot exceed 4'],
    },
    approvalLimit: {
      type: Number,
      default: null,
      min: [0, 'Approval limit cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Status must be either ACTIVE or INACTIVE',
      },
      default: 'ACTIVE',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    usersAssigned: {
      type: Number,
      default: 0,
      min: [0, 'Assigned users count cannot be negative'],
    },
    iconColor: {
      type: String,
      default: '#176B87',
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
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

RoleSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Role = mongoose.model('Role', RoleSchema);
