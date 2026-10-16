import { Role } from '../models/Role.js';
import { MODULES_METADATA, PERMISSION_ACTIONS_METADATA } from '../data/seedData.js';
import mongoose from 'mongoose';
import { recordAuditLog } from '../utils/auditLogger.js';
import { hasAtLeastOnePermission } from '../utils/permissionValidator.js';
import {
  getAllRolesEffectivePermissions,
  setRolePermissions,
  getPermissionCatalog,
} from '../services/permissionService.js';

/**
 * GET /api/permissions
 * Retrieves metadata for modules, actions, applicability rules,
 * the normalized permissions catalog, and the aggregated permissions map across all roles.
 * Authoritative source: `role_permissions` and `permissions` collections.
 */
export const getPermissions = async (req, res, next) => {
  try {
    const [catalog, matrix] = await Promise.all([
      getPermissionCatalog(),
      getAllRolesEffectivePermissions(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        modules: MODULES_METADATA,
        actions: PERMISSION_ACTIONS_METADATA,
        catalog,
        matrix,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/roles/:id/permissions
 * Updates granular permissions for a given role in the normalized `role_permissions` collection.
 */
export const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'A valid permissions payload object is required.',
          code: 'INVALID_PERMISSIONS_PAYLOAD',
        },
      });
    }

    let role = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      role = await Role.findById(id);
    }

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Role with ID "${id}" was not found.`,
          code: 'ROLE_NOT_FOUND',
        },
      });
    }

    // Priority 2: Protect System Administrator role permissions against unauthorized reduction or modification
    if (role.isSystem || role.name.toLowerCase() === 'system administrator') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Permissions for the System Administrator role are protected and cannot be modified or reduced.',
          code: 'SYSTEM_PERMISSIONS_PROTECTED',
        },
      });
    }

    // Priority 1: Minimum Permission Rule: reject if all permissions are false or empty
    if (!hasAtLeastOnePermission(permissions)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Every role must have at least one permission assigned. Roles with zero permissions are not allowed.',
          code: 'MINIMUM_PERMISSION_REQUIRED',
        },
      });
    }

    // Update in normalized role_permissions (and sync to role document for backward compatibility)
    const updatedPermissions = await setRolePermissions(role._id, permissions);

    await recordAuditLog({
      action: 'PERMISSION_MODIFIED',
      actionDisplay: 'Permission Modified',
      entityType: 'Role',
      entityId: role._id.toString(),
      entityName: role.name,
      details: {
        summary: `Granular permissions modified for "${role.name}" in role_permissions`,
        modulesCount: Object.keys(permissions || {}).length,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Permissions updated successfully for "${role.name}".`,
      data: {
        roleId: role._id.toString(),
        roleName: role.name,
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code || 'PERMISSION_UPDATE_ERROR',
        },
      });
    }
    next(error);
  }
};
