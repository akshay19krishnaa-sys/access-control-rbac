import mongoose from 'mongoose';

/**
 * AuditSetting — Configuration model for system audit trail & logging policies.
 * Persistently stored in MongoDB as the single source of truth.
 */
const auditSettingSchema = new mongoose.Schema(
  {
    settingKey: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },
    // Retention period in days (e.g. 30, 60, 90, 180, 365, 730, 2555)
    retentionDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 3650,
    },
    // Log level filter
    logLevel: {
      type: String,
      enum: ['ALL', 'INFO', 'WARNING', 'CRITICAL'],
      default: 'ALL',
    },
    // Granular event tracking toggles
    enabledEvents: {
      roleCreated: { type: Boolean, default: true },
      roleUpdated: { type: Boolean, default: true },
      permissionModified: { type: Boolean, default: true },
      branchScopeChanged: { type: Boolean, default: true },
      approvalLevelChanged: { type: Boolean, default: true },
      roleStatusChanged: { type: Boolean, default: true },
    },
    // Default export format
    exportFormat: {
      type: String,
      enum: ['CSV', 'JSON'],
      default: 'CSV',
    },
    // Compliance report schedule
    complianceReportSchedule: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'WEEKLY',
    },
    // Alert flags
    notifyOnCriticalEvents: {
      type: Boolean,
      default: true,
    },
    // Data privacy: anonymize actor identity in export
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
