
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { checkRolePermission } from '../services/permissionService.js';

export const SERVER_AUTH_SECRET = process.env.AUTH_SECRET || 'rbac-secure-server-secret-key-2026';

const trustedSessionStore = new Map();

export function createTrustedToken(sessionData) {
  const payload = {
    userId: sessionData.userId || `usr-${Date.now().toString(36)}`,
    username: sessionData.username || 'authenticated_user',
    roleId: sessionData.roleId ? sessionData.roleId.toString() : null,
    roleName: sessionData.roleName || null,
    assignedBranch: sessionData.assignedBranch || 'Head Office',
    ts: Date.now(),
  };

  const jsonStr = JSON.stringify(payload);
  const b64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_AUTH_SECRET).update(b64).digest('base64url');
  const token = `rbac.${b64}.${sig}`;

  trustedSessionStore.set(token, payload);
  return token;
}

export const createTrustedSession = createTrustedToken;

export function revokeTrustedSession(token) {
  trustedSessionStore.delete(token);
}

export function resolveUserFromRequest(req) {

  if (req.user && (req.user.roleId || req.user.roleName || req.user.isSystemAdmin)) {
    return req.user;
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];

  if (trustedSessionStore.has(token)) {
    return { ...trustedSessionStore.get(token) };
  }

  if (token.startsWith('rbac.')) {
    const segments = token.split('.');
    if (segments.length === 3) {
      const [, b64, sig] = segments;
      const expectedSig = crypto.createHmac('sha256', SERVER_AUTH_SECRET).update(b64).digest('base64url');
      if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        try {
          const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
          return payload;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

export const authenticateUser = (req, res, next) => {
  const user = resolveUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. No valid credentials or session provided.',
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  }

  req.user = user;
  next();
};

async function resolveRoleForUser(user) {
  if (user.roleId && mongoose.Types.ObjectId.isValid(user.roleId)) {
    const role = await Role.findById(user.roleId);
    if (role) return role;
  }

  if (user.roleName) {
    const role = await Role.findOne({
      name: { $regex: `^${user.roleName.trim()}$`, $options: 'i' },
    });
    if (role) return role;
  }

  return null;
}

export function verifyPermission(moduleName, actionName) {
  const normModule = (moduleName || '').toLowerCase().trim();
  const normAction = (actionName || '').toLowerCase().trim();

  return async (req, res, next) => {
    try {

      const user = resolveUserFromRequest(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required. No valid credentials provided.',
            code: 'AUTHENTICATION_REQUIRED',
          },
        });
      }

      req.user = user;

      const role = await resolveRoleForUser(user);
      if (!role) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Forbidden: The role assigned to user "${user.username}" was not found.`,
            code: 'ROLE_NOT_FOUND',
          },
        });
      }

      if (role.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          error: {
            message: `Forbidden: The role "${role.name}" is currently INACTIVE. Inactive roles cannot perform actions.`,
            code: 'ROLE_INACTIVE',
          },
        });
      }

      req.role = role;

      if (role.isSystem || role.name.toLowerCase() === 'system administrator') {
        return next();
      }

      const isGranted = await checkRolePermission(role._id, normModule, normAction);

      if (!isGranted) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Forbidden: Role "${role.name}" does not possess "${normAction}" permission on "${normModule}" module.`,
            code: 'PERMISSION_DENIED',
            required: {
              module: normModule,
              action: normAction,
            },
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function verifyBranchScope(targetBranchExtractor) {
  return async (req, res, next) => {
    try {

      const user = req.user || resolveUserFromRequest(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required. No valid credentials provided.',
            code: 'AUTHENTICATION_REQUIRED',
          },
        });
      }
      req.user = user;

      let role = req.role;
      if (!role) {
        role = await resolveRoleForUser(user);
        if (!role) {
          return res.status(403).json({
            success: false,
            error: {
              message: `Forbidden: The role assigned to user "${user.username}" was not found.`,
              code: 'ROLE_NOT_FOUND',
            },
          });
        }
        if (role.status !== 'ACTIVE') {
          return res.status(403).json({
            success: false,
            error: {
              message: `Forbidden: Role "${role.name}" is inactive.`,
              code: 'ROLE_INACTIVE',
            },
          });
        }
        req.role = role;
      }

      let targetBranch = null;
      if (typeof targetBranchExtractor === 'function') {
        targetBranch = targetBranchExtractor(req);
      } else {
        targetBranch =
          req.params.branchId ||
          req.params.branch ||
          req.query.branch ||
          req.query.branchId ||
          req.body?.branch ||
          req.body?.branchId ||
          req.headers['x-target-branch'] ||
          null;
      }

      const requestedBranch = targetBranch ? String(targetBranch).trim() : null;

      if (role.isSystem || role.name.toLowerCase() === 'system administrator' || role.branchScope === 'All Branches') {
        req.branchScopeFilter = { scope: 'All Branches', allowedBranches: null };
        return next();
      }

      if (!requestedBranch) {
        req.branchScopeFilter = {
          scope: role.branchScope,
          allowedBranches:
            role.branchScope === 'Selected Branches'
              ? role.selectedBranches || []
              : [user.assignedBranch].filter(Boolean),
        };
        return next();
      }

      if (role.branchScope === 'Selected Branches') {
        const allowed = Array.isArray(role.selectedBranches) ? role.selectedBranches : [];
        const isMatch = allowed.some((b) => b.toLowerCase() === requestedBranch.toLowerCase());

        if (!isMatch) {
          return res.status(403).json({
            success: false,
            error: {
              message: `Forbidden: Target branch "${requestedBranch}" is not within the role's selected branch scope.`,
              code: 'BRANCH_SCOPE_VIOLATION',
              branchScope: 'Selected Branches',
              allowedBranches: allowed,
            },
          });
        }
      } else if (role.branchScope === 'Assigned Branch') {
        const userAssigned = user.assignedBranch ? String(user.assignedBranch).trim() : '';

        if (!userAssigned || userAssigned.toLowerCase() !== requestedBranch.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: {
              message: `Forbidden: Target branch "${requestedBranch}" is outside the user's assigned branch ("${userAssigned || 'None'}").`,
              code: 'BRANCH_SCOPE_VIOLATION',
              branchScope: 'Assigned Branch',
              userAssignedBranch: userAssigned || null,
            },
          });
        }
      }

      req.branchScopeFilter = {
        scope: role.branchScope,
        allowedBranches: [requestedBranch],
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
