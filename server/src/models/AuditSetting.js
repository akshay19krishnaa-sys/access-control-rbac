import mongoose from 'mongoose';

const auditSettingSchema = new mongoose.Schema(
  {
    settingKey: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },

    retentionDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 3650,
    },

    logLevel: {
      type: String,
      enum: ['ALL', 'INFO', 'WARNING', 'CRITICAL'],
      default: 'ALL',
    },

    enabledEvents: {
      roleCreated: { type: Boolean, default: true },
      roleUpdated: { type: Boolean, default: true },
      permissionModified: { type: Boolean, default: true },
      branchScopeChanged: { type: Boolean, default: true },
      approvalLevelChanged: { type: Boolean, default: true },
      roleStatusChanged: { type: Boolean, default: true },
    },

    exportFormat: {
      type: String,
      enum: ['CSV', 'JSON'],
      default: 'CSV',
    },

    complianceReportSchedule: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'WEEKLY',
    },

    notifyOnCriticalEvents: {
      type: Boolean,
      default: true,
    },

    anonymizeActors: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AuditSetting = mongoose.model('AuditSetting', auditSettingSchema);
