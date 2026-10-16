import { Permission } from '../models/Permission.js';
import { RolePermission } from '../models/RolePermission.js';
import { Role } from '../models/Role.js';
import { MODULES_METADATA, PERMISSION_ACTIONS_METADATA } from '../data/seedData.js';
import { hasAtLeastOnePermission } from '../utils/permissionValidator.js';

// Cache of permission catalog mapping: `${module}_${action}` -> Permission document
let catalogCache = null;

/**
 * Ensures the permission catalog is seeded with the exact 41 applicable permissions.
 * Idempotent: upserts records matching { module, action }.
 */
export async function seedPermissionCatalog() {
  const actionsMap = new Map(PERMISSION_ACTIONS_METADATA.map((a) => [a.id, a.label]));
  const ops = [];

  for (const mod of MODULES_METADATA) {
    const applicable = mod.applicable || [];
    for (const act of applicable) {
      const code = `${mod.id.toUpperCase()}_${act.toUpperCase()}`;
      const actionLabel = actionsMap.get(act) || act;
      const name = `${mod.name} - ${actionLabel}`;
      const description = `Allows ${actionLabel.toLowerCase()} action on the ${mod.name} module.`;

      ops.push({
        updateOne: {
          filter: { module: mod.id.toLowerCase(), action: act.toLowerCase() },
          update: {
            $set: {
              code,
              name,
              description,
              isApplicable: true,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (ops.length > 0) {
    await Permission.bulkWrite(ops);
  }

  // Refresh cache
  catalogCache = await Permission.find({}).lean();
  return catalogCache;
}

/**
 * Returns all permission catalog entries.
 */
export async function getPermissionCatalog() {
  if (!catalogCache || catalogCache.length === 0) {
    catalogCache = await Permission.find({}).lean();
    if (!catalogCache || catalogCache.length === 0) {
      catalogCache = await seedPermissionCatalog();
    }
  }
  return catalogCache;
}

/**
 * Helper to build empty permissions matrix structure with false for all applicable actions
 */
export function buildEmptyPermissionsMatrix() {
  const matrix = {};
  for (const mod of MODULES_METADATA) {
    matrix[mod.id] = {};
    for (const act of PERMISSION_ACTIONS_METADATA) {
      matrix[mod.id][act.id] = false;
    }
  }
  return matrix;
}

/**
 * Resolves effective permissions for a single role from the normalized `role_permissions` collection.
 * @param {string|mongoose.Types.ObjectId} roleId
 * @returns {Promise<object>} Permissions object formatted as { [module]: { [action]: boolean } }
 */
export async function getRoleEffectivePermissions(roleId) {
  const role = await Role.findById(roleId).lean();
  if (!role) return null;

  const matrix = buildEmptyPermissionsMatrix();
  const isSysAdmin = Boolean(role.isSystem || role.name?.toLowerCase() === 'system administrator');

  if (isSysAdmin) {
    // System Administrator has all applicable permissions granted
    for (const mod of MODULES_METADATA) {
      const applicable = mod.applicable || [];
      for (const act of applicable) {
        matrix[mod.id][act] = true;
      }
    }
    return matrix;
  }

  // Query normalized role_permissions
  const assigned = await RolePermission.find({ roleId }).lean();
  for (const rp of assigned) {
    if (matrix[rp.module] && matrix[rp.module][rp.action] !== undefined) {
      matrix[rp.module][rp.action] = Boolean(rp.granted);
    }
  }

  return matrix;
}

/**
 * Resolves effective permissions for all roles from the normalized `role_permissions` collection.
 * @returns {Promise<object>} Map of { [roleId]: { [module]: { [action]: boolean } } }
 */
export async function getAllRolesEffectivePermissions() {
  const [roles, allRolePermissions] = await Promise.all([
    Role.find().lean(),
    RolePermission.find({ granted: true }).lean(),
  ]);

  // Index assignments by roleId string
  const rolePermsMap = new Map();
  for (const rp of allRolePermissions) {
    const rIdStr = rp.roleId.toString();
    if (!rolePermsMap.has(rIdStr)) {
      rolePermsMap.set(rIdStr, new Set());
    }
    rolePermsMap.get(rIdStr).add(`${rp.module}:${rp.action}`);
  }

  const result = {};
  for (const role of roles) {
    const rIdStr = role._id.toString();
    const matrix = buildEmptyPermissionsMatrix();
    const isSysAdmin = Boolean(role.isSystem || role.name?.toLowerCase() === 'system administrator');

    if (isSysAdmin) {
      for (const mod of MODULES_METADATA) {
        for (const act of mod.applicable || []) {
          matrix[mod.id][act] = true;
        }
      }
    } else {
      const permsSet = rolePermsMap.get(rIdStr);
      if (permsSet) {
        for (const mod of MODULES_METADATA) {
          for (const act of PERMISSION_ACTIONS_METADATA) {
            if (permsSet.has(`${mod.id}:${act.id}`)) {
              matrix[mod.id][act.id] = true;
            }
          }
        }
      }
    }
    result[rIdStr] = matrix;
  }

  return result;
}

/**
 * Checks if a specific role possesses permission for a module and action.
 * Reads directly from `RolePermission` collection (or evaluates System Admin).
 */
export async function checkRolePermission(roleId, module, action) {
  const role = await Role.findById(roleId).lean();
  if (!role || role.status === 'INACTIVE') {
    return false;
  }

  if (role.isSystem || role.name?.toLowerCase() === 'system administrator') {
    // Check if the action is applicable to this module
    const modMeta = MODULES_METADATA.find((m) => m.id.toLowerCase() === module.toLowerCase());
    return modMeta ? (modMeta.applicable || []).includes(action.toLowerCase()) : false;
  }

  const exists = await RolePermission.exists({
    roleId,
    module: module.toLowerCase(),
    action: action.toLowerCase(),
    granted: true,
  });

  return Boolean(exists);
}

/**
 * Updates role permissions in the normalized `role_permissions` collection.
 * Enforces:
 * 1. Minimum permission rule (rejects if all permissions are false or empty).
 * 2. System Administrator protection (rejects reduction/modification).
 * 3. Atomic replacement in `role_permissions`.
 * 4. Backward-compatible sync to `role.permissions`.
 */
export async function setRolePermissions(roleId, permissionsPayload, options = {}) {
  const role = await Role.findById(roleId);
  if (!role) {
    const err = new Error(`Role with ID "${roleId}" was not found.`);
    err.code = 'ROLE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Priority 2: System Administrator permissions are protected against unauthorized modification
  if (!options.isInternalSeed && (role.isSystem || role.name?.toLowerCase() === 'system administrator')) {
    const err = new Error('Permissions for the System Administrator role are protected and cannot be modified or reduced.');
    err.code = 'SYSTEM_PERMISSIONS_PROTECTED';
    err.statusCode = 403;
    throw err;
  }

  // Priority 1: Minimum permission rule
  if (!hasAtLeastOnePermission(permissionsPayload)) {
    const err = new Error('Every role must have at least one permission assigned. Roles with zero permissions are not allowed.');
    err.code = 'MINIMUM_PERMISSION_REQUIRED';
    err.statusCode = 400;
    throw err;
  }

  const catalog = await getPermissionCatalog();
  const catalogMap = new Map(catalog.map((p) => [`${p.module}:${p.action}`, p._id]));

  // Build documents for role_permissions
  const newAssignments = [];
  const cleanPermissionsObj = buildEmptyPermissionsMatrix();

  for (const mod of MODULES_METADATA) {
    const applicable = mod.applicable || [];
    const moduleInput = permissionsPayload[mod.id] || {};

    for (const act of applicable) {
      const isGranted = Boolean(moduleInput[act]);
      cleanPermissionsObj[mod.id][act] = isGranted;

      if (isGranted) {
        const permissionId = catalogMap.get(`${mod.id}:${act}`);
        if (permissionId) {
          newAssignments.push({
            roleId: role._id,
            permissionId,
            module: mod.id,
            action: act,
            granted: true,
          });
        }
      }
    }
  }

  // Double check that at least one assignment is generated
  if (newAssignments.length === 0) {
    const err = new Error('Every role must have at least one permission assigned. Roles with zero permissions are not allowed.');
    err.code = 'MINIMUM_PERMISSION_REQUIRED';
    err.statusCode = 400;
    throw err;
  }

  // Clear existing role_permissions for this role and insert new ones
  await RolePermission.deleteMany({ roleId: role._id });
  await RolePermission.insertMany(newAssignments);

  // Sync to role document for backward compatibility
  role.permissions = cleanPermissionsObj;
  role.markModified('permissions');
  await role.save();

  return cleanPermissionsObj;
}
