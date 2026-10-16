/**
 * authorize.js — Centralized RBAC Permission Authorization & Branch Scope Enforcement Middleware
 *
 * Implements Priority 4 per Task 1 Access Control Specification (Sections 17, 18, 27).
 *
 * Architecture & Security Principles:
 * 1. Server-Side Trusted Identity:
 *    Authentication credentials must be validated server-side.
 *    Client-supplied headers or body fields attempting to specify a role ID or user ID
 *    are explicitly ignored / rejected to prevent privilege escalation / impersonation.
 *
 * 2. RBAC Permission Verification:
 *    Resolves the user's role from MongoDB and checks:
 *    - Role exists and is active (inactive roles cannot exercise permissions).
 *    - System Administrator has blanket authorization for all modules & actions.
 *    - Role permissions explicitly grant `role.permissions[module][action] === true`.
 *
 * 3. Branch Scope Enforcement:
 *    Enforces the three canonical branch scopes:
 *    - 'Assigned Branch': User can only access their home/assigned branch.
 *    - 'Selected Branches': User can only access branches in the role's `selectedBranches` list.
 *    - 'All Branches': Full access across all branches in the organisation.
 *
 * 4. Architectural Note on Production Dependencies:
 *    Per Task 1 Scope (Sections 4 & 5), full User Management (PDD-003) and Authentication (PDD-001)
 *    are excluded from this project. A secure, signed server-side session registry is provided
 *    for trusted token verification during execution and automated compliance testing.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { checkRolePermission } from '../services/permissionService.js';

// Server-side secret for signing & verifying trusted session tokens
export const SERVER_AUTH_SECRET = process.env.AUTH_SECRET || 'rbac-secure-server-secret-key-2026';

// Server-side trusted session registry (Token -> Trusted User Session)
const trustedSessionStore = new Map();

/**
 * Creates an HMAC signed trusted token or in-memory session.
 * Used to establish trusted server-side identity for API consumers and tests.
 *
 * @param {object} sessionData
 * @param {string} sessionData.userId
 * @param {string} sessionData.username
 * @param {string} [sessionData.roleId]
 * @param {string} [sessionData.roleName]
 * @param {string} [sessionData.assignedBranch]
 * @returns {string} Bearer token
 */
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

/**
 * Alias for createTrustedToken.
 */
export const createTrustedSession = createTrustedToken;

/**
 * Clears a trusted session from memory.
 * @param {string} token
 */
export function revokeTrustedSession(token) {
  trustedSessionStore.delete(token);
}

/**
 * Extracts and verifies the trusted server-side user identity from a request.
 * Disallows client-supplied impersonation parameters (e.g. body/header roleId).
 *
 * @param {import('express').Request} req
 * @returns {object|null} Authenticated user context or null if unauthenticated.
 */
export function resolveUserFromRequest(req) {
  // 1. If upstream middleware already established trusted req.user, use it
  if (req.user && (req.user.roleId || req.user.roleName || req.user.isSystemAdmin)) {
    return req.user;
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];

  // Check in-memory store
  if (trustedSessionStore.has(token)) {
    return { ...trustedSessionStore.get(token) };
  }

  // Check HMAC signed token: rbac.<b64>.<sig>
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

/**
 * Reusable Authentication Middleware.
 * Rejects unauthenticated requests with HTTP 401.
 */
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

/**
 * Helper to fetch the Role document from MongoDB associated with the trusted user.
 * Supports resolution by ObjectId or by roleName.
 *
 * @param {object} user
 * @returns {Promise<import('../models/Role.js').Role|null>}
 */
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

/**
 * Reusable Middleware: verifyPermission(module, action)
 *
 * Enforces granular RBAC authorization:
 * - Rejects unauthenticated requests with HTTP 401.
 * - Rejects non-existent or inactive roles with HTTP 403.
 * - Grants immediate access to System Administrator (blanket privilege).
 * - Checks whether `role.permissions[module][action] === true`.
 *
 * @param {string} moduleName — e.g. 'savings', 'loan', 'dashboard', 'reports', 'customers'
 * @param {string} actionName — e.g. 'view', 'create', 'edit', 'delete', 'approve', 'export'
 * @returns {import('express').RequestHandler}
 */
export function verifyPermission(moduleName, actionName) {
  const normModule = (moduleName || '').toLowerCase().trim();
  const normAction = (actionName || '').toLowerCase().trim();

  return async (req, res, next) => {
    try {
      // 1. Resolve authenticated user identity
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

      // 2. Fetch role from database
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

      // 3. Rule: Inactive roles cannot exercise permissions or perform actions (PDF Section 17 & 18)
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

      // 4. System Administrator blanket privilege
      if (role.isSystem || role.name.toLowerCase() === 'system administrator') {
        return next();
      }

      // 5. Check module & action permission in normalized role_permissions collection
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

/**
 * Reusable Middleware: verifyBranchScope(targetBranchExtractor)
 *
 * Enforces data-scope boundaries according to the role's `branchScope`:
 * - 'All Branches': Allows access to any requested branch.
 * - 'Selected Branches': Access restricted to branches in `role.selectedBranches`.
 * - 'Assigned Branch': Access restricted to the user's trusted `user.assignedBranch`.
 *
 * Rejects unauthorized branch access with HTTP 403 `BRANCH_SCOPE_VIOLATION`.
 *
 * @param {Function} [targetBranchExtractor] — Optional custom function `(req) => string`
 * @returns {import('express').RequestHandler}
 */
export function verifyBranchScope(targetBranchExtractor) {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is authenticated
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

      // 2. Ensure role is resolved
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

      // 3. Extract the target branch requested by the operation
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

      // Normalize branch string
      const requestedBranch = targetBranch ? String(targetBranch).trim() : null;

      // System Administrator or 'All Branches' scope: unrestricted
      if (role.isSystem || role.name.toLowerCase() === 'system administrator' || role.branchScope === 'All Branches') {
        req.branchScopeFilter = { scope: 'All Branches', allowedBranches: null };
        return next();
      }

      // If no specific branch was targeted (e.g. a list endpoint), attach filter metadata
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

      // 4. Validate requested branch against role scope
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
