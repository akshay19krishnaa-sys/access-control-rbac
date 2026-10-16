import { Role } from '../models/Role.js';
import mongoose from 'mongoose';
import { recordAuditLog } from '../utils/auditLogger.js';
import { hasAtLeastOnePermission } from '../utils/permissionValidator.js';
import {
  getRoleEffectivePermissions,
  getAllRolesEffectivePermissions,
  setRolePermissions,
} from '../services/permissionService.js';

const findRoleByIdOrCustom = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await Role.findById(id);
  }
  return null;
};

export const getRoles = async (req, res, next) => {
  try {
    const { q, status, branchScope } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status.toUpperCase();
    }

    if (branchScope && branchScope !== 'All Scopes') {
      filter.branchScope = branchScope;
    }

    const [roles, allPerms] = await Promise.all([
      Role.find(filter).sort({ createdAt: 1 }),
      getAllRolesEffectivePermissions(),
    ]);

    const enrichedRoles = roles.map((r) => {
      const obj = r.toJSON ? r.toJSON() : { ...r };
      obj.permissions = allPerms[r._id.toString()] || obj.permissions || {};
      return obj;
    });

    res.status(200).json({
      success: true,
      data: enrichedRoles,
      meta: {
        total: roles.length,
        filterApplied: Boolean(q || status || branchScope),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await findRoleByIdOrCustom(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Role with ID "${id}" was not found.`,
          code: 'ROLE_NOT_FOUND',
        },
      });
    }

    const effectivePermissions = await getRoleEffectivePermissions(role._id);
    const roleObj = role.toJSON ? role.toJSON() : { ...role };
    roleObj.permissions = effectivePermissions || roleObj.permissions || {};

    res.status(200).json({
      success: true,
      data: roleObj,
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const {
      name,
      description,
      branchScope,
      selectedBranches,
      approvalLevel,
      approvalLimit,
      iconColor,
      status,
      permissions,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Role name is required.',
          code: 'NAME_REQUIRED',
        },
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Role name cannot exceed 100 characters.',
          code: 'NAME_TOO_LONG',
        },
      });
    }

    const existing = await Role.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          message: `A role with the name "${name.trim()}" already exists.`,
          code: 'DUPLICATE_ROLE_NAME',
        },
      });
    }

    if (!hasAtLeastOnePermission(permissions)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Every role must have at least one permission assigned. Roles with zero permissions are not allowed.',
          code: 'MINIMUM_PERMISSION_REQUIRED',
        },
      });
    }

    const newRole = await Role.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      branchScope: branchScope || 'Assigned Branch',
      selectedBranches: Array.isArray(selectedBranches) ? selectedBranches : [],
      approvalLevel: Number.isFinite(approvalLevel) ? Number(approvalLevel) : 0,
      approvalLimit: approvalLimit ? Number(approvalLimit) : null,
      iconColor: iconColor || '#176B87',
      status: status ? status.toUpperCase() : 'ACTIVE',
      isSystem: false,
      usersAssigned: 0,
      permissions: permissions || {},
    });

    await setRolePermissions(newRole._id, permissions);

    await recordAuditLog({
      action: 'ROLE_CREATED',
      actionDisplay: 'Role Created',
      entityType: 'Role',
      entityId: newRole._id.toString(),
      entityName: newRole.name,
      details: {
        branchScope: newRole.branchScope,
        approvalLevel: newRole.approvalLevel,
        status: newRole.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Role "${newRole.name}" created successfully.`,
      data: newRole,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await findRoleByIdOrCustom(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Role with ID "${id}" was not found.`,
          code: 'ROLE_NOT_FOUND',
        },
      });
    }

    const {
      name,
      description,
      branchScope,
      selectedBranches,
      approvalLevel,
      approvalLimit,
      iconColor,
      status,
      permissions,
    } = req.body;

    const prevName = role.name;
    const prevDesc = role.description;
    const prevBranchScope = role.branchScope;
    const prevApprovalLevel = role.approvalLevel;
    const prevStatus = role.status;
    const prevPermissions = role.permissions;

    if (role.isSystem && name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'The System Administrator role name cannot be modified.',
          code: 'SYSTEM_ROLE_PROTECTED',
        },
      });
    }

    if ((role.isSystem || role.name.toLowerCase() === 'system administrator') && permissions !== undefined) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Permissions for the System Administrator role are protected and cannot be modified or reduced.',
          code: 'SYSTEM_PERMISSIONS_PROTECTED',
        },
      });
    }

    if (permissions !== undefined && !hasAtLeastOnePermission(permissions)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Every role must have at least one permission assigned. Roles with zero permissions are not allowed.',
          code: 'MINIMUM_PERMISSION_REQUIRED',
        },
      });
    }

    if (name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
      const existing = await Role.findOne({
        _id: { $ne: role._id },
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            message: `A role with the name "${name.trim()}" already exists.`,
            code: 'DUPLICATE_ROLE_NAME',
          },
        });
      }
      role.name = name.trim();
    }

    if (description !== undefined) role.description = description.trim();
    if (branchScope) role.branchScope = branchScope;
    if (Array.isArray(selectedBranches)) role.selectedBranches = selectedBranches;
    if (Number.isFinite(approvalLevel)) role.approvalLevel = Number(approvalLevel);
    if (approvalLimit !== undefined) role.approvalLimit = approvalLimit ? Number(approvalLimit) : null;
    if (iconColor) role.iconColor = iconColor;
    if (status) role.status = status.toUpperCase();
    if (permissions !== undefined) {
      await setRolePermissions(role._id, permissions);
    }

    await role.save();

    if (branchScope && branchScope !== prevBranchScope) {
      await recordAuditLog({
        action: 'BRANCH_SCOPE_CHANGED',
        actionDisplay: 'Branch Scope Changed',
        entityType: 'Role',
        entityId: role._id.toString(),
        entityName: role.name,
        details: {
          previousScope: prevBranchScope,
          newScope: role.branchScope,
        },
        req,
      });
    }

    if (Number.isFinite(approvalLevel) && Number(approvalLevel) !== prevApprovalLevel) {
      await recordAuditLog({
        action: 'APPROVAL_LEVEL_CHANGED',
        actionDisplay: 'Approval Level Changed',
        entityType: 'Role',
        entityId: role._id.toString(),
        entityName: role.name,
        details: {
          previousLevel: prevApprovalLevel,
          newLevel: role.approvalLevel,
        },
        req,
      });
    }

    if (status && status.toUpperCase() !== prevStatus) {
      await recordAuditLog({
        action: role.status === 'ACTIVE' ? 'ROLE_ACTIVATED' : 'ROLE_DEACTIVATED',
        actionDisplay: role.status === 'ACTIVE' ? 'Role Activated' : 'Role Deactivated',
        entityType: 'Role',
        entityId: role._id.toString(),
        entityName: role.name,
        details: {
          previousStatus: prevStatus,
          newStatus: role.status,
        },
        req,
      });
    }

    if (permissions && JSON.stringify(permissions) !== JSON.stringify(prevPermissions)) {
      await recordAuditLog({
        action: 'PERMISSION_MODIFIED',
        actionDisplay: 'Permission Modified',
        entityType: 'Role',
        entityId: role._id.toString(),
        entityName: role.name,
        details: {
          summary: `Permissions updated for role "${role.name}"`,
        },
        req,
      });
    }

    if (
      (name && name.trim() !== prevName) ||
      (description !== undefined && description.trim() !== prevDesc) ||
      approvalLimit !== undefined ||
      iconColor !== undefined
    ) {
      await recordAuditLog({
        action: 'ROLE_UPDATED',
        actionDisplay: 'Role Updated',
        entityType: 'Role',
        entityId: role._id.toString(),
        entityName: role.name,
        details: {
          previousName: prevName,
          newName: role.name,
        },
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: `Role "${role.name}" updated successfully.`,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const patchRoleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await findRoleByIdOrCustom(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Role with ID "${id}" was not found.`,
          code: 'ROLE_NOT_FOUND',
        },
      });
    }

    const { status } = req.body;
    const targetStatus = status
      ? status.toUpperCase()
      : role.status === 'ACTIVE'
      ? 'INACTIVE'
      : 'ACTIVE';

    if (targetStatus === 'INACTIVE') {
      if (role.isSystem || role.name.toLowerCase() === 'system administrator') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'The System Administrator role cannot be deactivated. It is protected by system security policy.',
            code: 'PROTECTED_ROLE_DEACTIVATION',
          },
        });
      }

      const activeAdminCount = await Role.countDocuments({
        $or: [{ isSystem: true }, { name: { $regex: /system administrator/i } }],
        status: 'ACTIVE',
      });

      if (activeAdminCount <= 1 && (role.isSystem || role.name.toLowerCase() === 'system administrator')) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot deactivate role: at least one active System Administrator must always exist.',
            code: 'MINIMUM_ADMIN_REQUIRED',
          },
        });
      }

      if (role.usersAssigned > 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Cannot deactivate "${role.name}" because it currently has ${role.usersAssigned} active user(s) assigned. Inactive roles cannot be assigned to users. Please reassign users first.`,
            code: 'USERS_ASSIGNED_TO_ROLE',
          },
        });
      }
    }

    const prevStatus = role.status;
    role.status = targetStatus;
    await role.save();

    await recordAuditLog({
      action: targetStatus === 'ACTIVE' ? 'ROLE_ACTIVATED' : 'ROLE_DEACTIVATED',
      actionDisplay: targetStatus === 'ACTIVE' ? 'Role Activated' : 'Role Deactivated',
      entityType: 'Role',
      entityId: role._id.toString(),
      entityName: role.name,
      details: {
        previousStatus: prevStatus,
        newStatus: targetStatus,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Role "${role.name}" is now ${targetStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const cloneRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sourceRole = await findRoleByIdOrCustom(id);

    if (!sourceRole) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Role to clone with ID "${id}" was not found.`,
          code: 'ROLE_NOT_FOUND',
        },
      });
    }

    let candidateName = `Copy of ${sourceRole.name}`;
    let counter = 2;

    while (
      await Role.findOne({
        name: { $regex: `^${candidateName}$`, $options: 'i' },
      })
    ) {
      candidateName = `Copy of ${sourceRole.name} (${counter})`;
      counter++;
    }

    const sourcePermissions = await getRoleEffectivePermissions(sourceRole._id);

    const cloned = await Role.create({
      name: candidateName,
      description: sourceRole.description ? `Cloned from ${sourceRole.name}. ${sourceRole.description}` : `Cloned from ${sourceRole.name}.`,
      branchScope: sourceRole.branchScope,
      selectedBranches: [...(sourceRole.selectedBranches || [])],
      approvalLevel: sourceRole.approvalLevel,
      approvalLimit: sourceRole.approvalLimit,
      iconColor: sourceRole.iconColor || '#86B6F6',
      status: 'ACTIVE',
      isSystem: false,
      usersAssigned: 0,
      permissions: sourcePermissions || {},
    });

    if (sourcePermissions) {
      await setRolePermissions(cloned._id, sourcePermissions);
    }

    await recordAuditLog({
      action: 'ROLE_CREATED',
      actionDisplay: 'Role Created',
      entityType: 'Role',
      entityId: cloned._id.toString(),
      entityName: cloned.name,
      details: {
        clonedFrom: sourceRole.name,
        branchScope: cloned.branchScope,
        approvalLevel: cloned.approvalLevel,
        status: cloned.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Role cloned successfully as "${cloned.name}".`,
      data: cloned,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res) => {
  return res.status(405).json({
    success: false,
    error: {
      message: 'Permanent role deletion is disabled to preserve audit trails. Use PATCH /api/roles/:id/status to deactivate the role.',
      code: 'PERMANENT_DELETION_DISABLED',
    },
  });
};
