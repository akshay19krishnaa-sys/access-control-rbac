import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    actionDisplay: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      default: 'Role',
      index: true,
      trim: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    entityName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actor: {
      id: { type: String, default: null },
      name: { type: String, default: 'System / Unavailable' },
      role: { type: String, default: 'System' },
      isSystem: { type: Boolean, default: true },
      ipAddress: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

auditLogSchema.index({ createdAt: -1, action: 1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
