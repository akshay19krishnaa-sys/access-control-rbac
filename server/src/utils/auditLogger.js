import { AuditLog } from '../models/AuditLog.js';
import { AuditSetting } from '../models/AuditSetting.js';

/**
 * List of sensitive key substrings that must NEVER be logged in audit records.
 */
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

/**
 * Recursively sanitize an object or value to redact sensitive keys.
 */
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

/**
 * Map an internal action to the corresponding AuditSetting toggle key.
 */
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

/**
 * Extract legitimate actor information from the request context.
 *
 * If legitimate authenticated user claims exist (e.g. req.auth or headers),
 * extract them. If authentication is not implemented or absent, legitimately
 * represent the actor as system-generated / unavailable (Requirement 9).
 */
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

  // Legitimate representation when auth is absent:
  return {
    id: null,
    name: 'System / Unavailable',
    role: 'System Automated',
    isSystem: true,
    ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
  };
}

/**
 * recordAuditLog — Core audit logging helper.
 *
 * Persists an audit entry to MongoDB after sanitizing details and verifying
 * active logging configuration.
 */
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
    // 1. Check if event logging is enabled in persistent settings
    const toggleKey = getSettingToggleKeyForAction(action);
    if (toggleKey) {
      const setting = await AuditSetting.findOne({ settingKey: 'default' }).lean();
      if (setting && setting.enabledEvents && setting.enabledEvents[toggleKey] === false) {
        // Logging for this specific event type was explicitly disabled in settings
        return null;
      }
    }

    // 2. Extract legitimate actor information
    const actor = extractActorFromRequest(req);

    // 3. Sanitize details to eliminate any sensitive keys/tokens/passwords
    const sanitizedDetails = sanitizeAuditDetails(details);

    // 4. Save to MongoDB
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
    // Audit logging should not crash business transactions, but log errors
    console.error('[AuditLogger] Failed to write audit record:', error.message);
    return null;
  }
}
