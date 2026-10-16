import { AuditLog } from '../models/AuditLog.js';
import { AuditSetting } from '../models/AuditSetting.js';

const DEFAULT_AUDIT_SETTINGS = {
  settingKey: 'default',
  retentionDays: 90,
  logLevel: 'ALL',
  enabledEvents: {
    roleCreated: true,
    roleUpdated: true,
    permissionModified: true,
    branchScopeChanged: true,
    approvalLevelChanged: true,
    roleStatusChanged: true,
  },
  exportFormat: 'CSV',
  complianceReportSchedule: 'WEEKLY',
  notifyOnCriticalEvents: true,
  anonymizeActors: false,
};

export const getAuditSettings = async (req, res, next) => {
  try {
    let settings = await AuditSetting.findOne({ settingKey: 'default' });

    if (!settings) {
      settings = await AuditSetting.create(DEFAULT_AUDIT_SETTINGS);
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAuditSettings = async (req, res, next) => {
  try {
    const {
      retentionDays,
      logLevel,
      enabledEvents,
      exportFormat,
      complianceReportSchedule,
      notifyOnCriticalEvents,
      anonymizeActors,
    } = req.body;

    if (retentionDays !== undefined) {
      const days = Number(retentionDays);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Retention days must be an integer between 1 and 3650 days.',
            code: 'INVALID_RETENTION_DAYS',
          },
        });
      }
    }

    if (logLevel !== undefined) {
      const allowedLevels = ['ALL', 'INFO', 'WARNING', 'CRITICAL'];
      if (!allowedLevels.includes(logLevel)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Log level must be one of: ${allowedLevels.join(', ')}.`,
            code: 'INVALID_LOG_LEVEL',
          },
        });
      }
    }

    if (exportFormat !== undefined) {
      const allowedFormats = ['CSV', 'JSON'];
      if (!allowedFormats.includes(exportFormat)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Export format must be either "CSV" or "JSON".',
            code: 'INVALID_EXPORT_FORMAT',
          },
        });
      }
    }

    if (complianceReportSchedule !== undefined) {
      const allowedSchedules = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];
      if (!allowedSchedules.includes(complianceReportSchedule)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Compliance report schedule must be one of: ${allowedSchedules.join(', ')}.`,
            code: 'INVALID_SCHEDULE',
          },
        });
      }
    }

    let settings = await AuditSetting.findOne({ settingKey: 'default' });
    if (!settings) {
      settings = new AuditSetting({ settingKey: 'default' });
    }

    if (retentionDays !== undefined) settings.retentionDays = Number(retentionDays);
    if (logLevel !== undefined) settings.logLevel = logLevel;
    if (exportFormat !== undefined) settings.exportFormat = exportFormat;
    if (complianceReportSchedule !== undefined) settings.complianceReportSchedule = complianceReportSchedule;
    if (notifyOnCriticalEvents !== undefined) settings.notifyOnCriticalEvents = Boolean(notifyOnCriticalEvents);
    if (anonymizeActors !== undefined) settings.anonymizeActors = Boolean(anonymizeActors);

    if (enabledEvents && typeof enabledEvents === 'object') {
      settings.enabledEvents = {
        roleCreated: enabledEvents.roleCreated !== undefined ? Boolean(enabledEvents.roleCreated) : settings.enabledEvents.roleCreated,
        roleUpdated: enabledEvents.roleUpdated !== undefined ? Boolean(enabledEvents.roleUpdated) : settings.enabledEvents.roleUpdated,
        permissionModified: enabledEvents.permissionModified !== undefined ? Boolean(enabledEvents.permissionModified) : settings.enabledEvents.permissionModified,
        branchScopeChanged: enabledEvents.branchScopeChanged !== undefined ? Boolean(enabledEvents.branchScopeChanged) : settings.enabledEvents.branchScopeChanged,
        approvalLevelChanged: enabledEvents.approvalLevelChanged !== undefined ? Boolean(enabledEvents.approvalLevelChanged) : settings.enabledEvents.approvalLevelChanged,
        roleStatusChanged: enabledEvents.roleStatusChanged !== undefined ? Boolean(enabledEvents.roleStatusChanged) : settings.enabledEvents.roleStatusChanged,
      };
      settings.markModified('enabledEvents');
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Audit & Logging settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { q, action, startDate, endDate, limit = 50, page = 1 } = req.query;

    const query = {};

    if (q && q.trim()) {
      const term = q.trim();
      query.$or = [
        { entityName: { $regex: term, $options: 'i' } },
        { actionDisplay: { $regex: term, $options: 'i' } },
        { 'actor.name': { $regex: term, $options: 'i' } },
        { action: { $regex: term, $options: 'i' } },
      ];
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
        filterApplied: Boolean(q || (action && action !== 'ALL') || startDate || endDate),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req, res, next) => {
  try {
    const { format = 'csv', action, q } = req.query;
    const query = {};

    if (q && q.trim()) {
      const term = q.trim();
      query.$or = [
        { entityName: { $regex: term, $options: 'i' } },
        { actionDisplay: { $regex: term, $options: 'i' } },
        { 'actor.name': { $regex: term, $options: 'i' } },
      ];
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

    if (format.toLowerCase() === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="rbac-audit-logs.json"');
      return res.status(200).send(JSON.stringify(logs, null, 2));
    }

    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity Name', 'Actor Name', 'Actor Role', 'Status', 'Details'];
    const rows = logs.map((log) => [
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${(log.actionDisplay || log.action || '').replace(/"/g, '""')}"`,
      `"${(log.entityType || '').replace(/"/g, '""')}"`,
      `"${(log.entityName || '').replace(/"/g, '""')}"`,
      `"${(log.actor?.name || 'System / Unavailable').replace(/"/g, '""')}"`,
      `"${(log.actor?.role || '').replace(/"/g, '""')}"`,
      `"${(log.status || 'SUCCESS')}"`,
      `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rbac-audit-logs.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
