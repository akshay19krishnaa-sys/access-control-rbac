import { AuditLog } from '../models/AuditLog.js';
import { AuditSetting } from '../models/AuditSetting.js';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'authorization',
  'cookie',
  'credential',
  'private',
  'ssn',
  'card',
];

export function sanitizeAuditDetails(data, depth = 0) {
  if (depth > 6 || !data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditDetails(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeAuditDetails(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

function getSettingToggleKeyForAction(action) {
  switch (action) {
    case 'ROLE_CREATED':
      return 'roleCreated';
    case 'ROLE_UPDATED':
      return 'roleUpdated';
    case 'PERMISSION_MODIFIED':
      return 'permissionModified';
    case 'BRANCH_SCOPE_CHANGED':
      return 'branchScopeChanged';
    case 'APPROVAL_LEVEL_CHANGED':
      return 'approvalLevelChanged';
    case 'ROLE_ACTIVATED':
    case 'ROLE_DEACTIVATED':
      return 'roleStatusChanged';
    default:
      return null;
  }
}

export function extractActorFromRequest(req) {
  if (req && req.auth && req.auth.username) {
    return {
      id: req.auth.userId || null,
      name: req.auth.username,
      role: req.auth.isSuperAdmin ? 'System Administrator' : 'Administrator',
      isSystem: false,
      ipAddress: req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1',
    };
  }

  if (req && req.headers && req.headers['x-actor-name']) {
    return {
      id: req.headers['x-actor-id'] || null,
      name: req.headers['x-actor-name'],
      role: req.headers['x-actor-role'] || 'Administrator',
      isSystem: false,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    };
  }

  return {
    id: null,
    name: 'System / Unavailable',
    role: 'System Automated',
    isSystem: true,
    ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
  };
}

export async function recordAuditLog({
  action,
  actionDisplay,
  entityType = 'Role',
  entityId = null,
  entityName,
  details = {},
  req = null,
  status = 'SUCCESS',
}) {
  try {

    const toggleKey = getSettingToggleKeyForAction(action);
    if (toggleKey) {
      const setting = await AuditSetting.findOne({ settingKey: 'default' }).lean();
      if (setting && setting.enabledEvents && setting.enabledEvents[toggleKey] === false) {

        return null;
      }
    }

    const actor = extractActorFromRequest(req);

    const sanitizedDetails = sanitizeAuditDetails(details);

    const auditRecord = await AuditLog.create({
      action,
      actionDisplay: actionDisplay || action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      entityName: entityName || 'Unknown Entity',
      details: sanitizedDetails,
      actor,
      status,
      createdAt: new Date(),
    });

    return auditRecord;
  } catch (error) {

    console.error('[AuditLogger] Failed to write audit record:', error.message);
    return null;
  }
}
