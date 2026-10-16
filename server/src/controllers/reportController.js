/**
 * reportController.js — Controller for Priority 5 Reports & Export
 *
 * Implements the 4 required reports per Task 1 Access Control Specification (Section 20):
 * A. Role Summary Report
 * B. Permission Matrix Report
 * C. Role Assignment Report
 * D. Inactive Roles Report
 *
 * Data source: Real MongoDB Role records.
 * Secure CSV export with audit logging.
 */

import { Role } from '../models/Role.js';
import { MODULES_METADATA, PERMISSION_ACTIONS_METADATA } from '../data/seedData.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { getAllRolesEffectivePermissions } from '../services/permissionService.js';

/**
 * Helper to escape CSV cell content
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * GET /api/reports/role-summary
 * Report A: Role Summary Report
 */
export const getRoleSummaryReport = async (req, res, next) => {
  try {
    const { q, status, branchScope } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    if (branchScope && branchScope !== 'ALL' && branchScope !== 'All Scopes') {
      filter.branchScope = branchScope;
    }

    const roles = await Role.find(filter).sort({ name: 1 });

    const reportData = roles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      description: r.description || '',
      status: r.status,
      branchScope: r.branchScope,
      selectedBranches: r.selectedBranches || [],
      approvalLevel: r.approvalLevel ?? 0,
      approvalLimit: r.approvalLimit !== null && r.approvalLimit !== undefined ? r.approvalLimit : null,
      usersAssigned: r.usersAssigned ?? 0,
      isSystem: Boolean(r.isSystem),
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      reportName: 'Role Summary Report',
      meta: {
        totalRoles: reportData.length,
        filtersApplied: { q: q || null, status: status || 'ALL', branchScope: branchScope || 'ALL' },
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/permission-matrix
 * Report B: Permission Matrix Report
 */
export const getPermissionMatrixReport = async (req, res, next) => {
  try {
    const { roleId, module: targetModule, status } = req.query;
    const filter = {};

    if (roleId && roleId !== 'ALL') {
      filter._id = roleId;
    }

    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    const [roles, allPerms] = await Promise.all([
      Role.find(filter).sort({ name: 1 }),
      getAllRolesEffectivePermissions(),
    ]);

    const modules = targetModule && targetModule !== 'ALL'
      ? MODULES_METADATA.filter((m) => m.id.toLowerCase() === targetModule.toLowerCase())
      : MODULES_METADATA;

    const reportData = [];

    roles.forEach((role) => {
      const rolePerms = allPerms[role._id.toString()] || {};
      modules.forEach((mod) => {
        const modPerms = rolePerms[mod.id] || {};
        const isSystem = role.isSystem || role.name.toLowerCase() === 'system administrator';

        const actionStatuses = {};
        PERMISSION_ACTIONS_METADATA.forEach((act) => {
          const isApplicable = (mod.applicableActions || []).includes(act.id);
          if (!isApplicable) {
            actionStatuses[act.id] = 'N/A';
          } else if (isSystem) {
            actionStatuses[act.id] = 'GRANTED';
          } else {
            actionStatuses[act.id] = modPerms[act.id] ? 'GRANTED' : 'DENIED';
          }
        });

        const grantedCount = Object.values(actionStatuses).filter((s) => s === 'GRANTED').length;

        reportData.push({
          roleId: role._id.toString(),
          roleName: role.name,
          roleStatus: role.status,
          isSystem: Boolean(role.isSystem),
          moduleId: mod.id,
          moduleName: mod.name,
          actions: actionStatuses,
          grantedCount,
          totalApplicable: (mod.applicableActions || []).length,
        });
      });
    });

    res.status(200).json({
      success: true,
      reportName: 'Permission Matrix Report',
      meta: {
        totalRows: reportData.length,
        rolesCount: roles.length,
        modulesCount: modules.length,
      },
      modules: MODULES_METADATA,
      actions: PERMISSION_ACTIONS_METADATA,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/role-assignment
 * Report C: Role Assignment Report (Aggregated with Scope Transparency)
 */
export const getRoleAssignmentReport = async (req, res, next) => {
  try {
    const { q, minUsers } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.name = { $regex: q.trim(), $options: 'i' };
    }

    if (minUsers !== undefined && minUsers !== '' && !isNaN(Number(minUsers))) {
      filter.usersAssigned = { $gte: Number(minUsers) };
    }

    const roles = await Role.find(filter).sort({ usersAssigned: -1, name: 1 });
    const totalUsers = roles.reduce((sum, r) => sum + (r.usersAssigned || 0), 0);

    const reportData = roles.map((r) => {
      const assigned = r.usersAssigned || 0;
      const share = totalUsers > 0 ? ((assigned / totalUsers) * 100).toFixed(1) : '0.0';

      return {
        id: r._id.toString(),
        name: r.name,
        isSystem: Boolean(r.isSystem),
        status: r.status,
        branchScope: r.branchScope,
        usersAssigned: assigned,
        userSharePercent: Number(share),
        approvalLevel: r.approvalLevel ?? 0,
        approvalLimit: r.approvalLimit !== null ? r.approvalLimit : null,
        userManagementStatus: 'MANAGED_EXTERNALLY_IN_PDD_003',
      };
    });

    res.status(200).json({
      success: true,
      reportName: 'Role Assignment Report',
      notice: 'Individual user identities, accounts, and credentials are governed externally in User Management (PDD-003). Aggregated user counts per role are tracked above.',
      meta: {
        totalRoles: reportData.length,
        totalAssignedUsers: totalUsers,
        userManagementDependency: 'PDD-003',
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inactive-roles
 * Report D: Inactive Roles Report
 */
export const getInactiveRolesReport = async (req, res, next) => {
  try {
    const { q, branchScope } = req.query;
    const filter = { status: 'INACTIVE' };

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    if (branchScope && branchScope !== 'ALL' && branchScope !== 'All Scopes') {
      filter.branchScope = branchScope;
    }

    const roles = await Role.find(filter).sort({ name: 1 });

    const reportData = roles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      description: r.description || '',
      status: 'INACTIVE',
      branchScope: r.branchScope,
      selectedBranches: r.selectedBranches || [],
      approvalLevel: r.approvalLevel ?? 0,
      approvalLimit: r.approvalLimit !== null ? r.approvalLimit : null,
      usersAssigned: r.usersAssigned ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.status(200).json({
      success: true,
      reportName: 'Inactive Roles Report',
      meta: {
        totalInactiveRoles: reportData.length,
      },
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export?type=summary|matrix|assignment|inactive&format=csv
 * Universal Export Handler with Audit Logging
 */
export const exportReport = async (req, res, next) => {
  try {
    const { type = 'summary', q, status, branchScope, roleId, module: targetModule } = req.query;
    const dateStr = new Date().toISOString().slice(0, 10);

    let csvContent = '';
    let reportTitle = '';
    let filename = `report_${type}_${dateStr}.csv`;

    if (type === 'summary') {
      reportTitle = 'Role Summary Report';
      filename = `role_summary_${dateStr}.csv`;
      const filter = {};
      if (q && q.trim()) filter.$or = [{ name: { $regex: q.trim(), $options: 'i' } }, { description: { $regex: q.trim(), $options: 'i' } }];
      if (status && status !== 'ALL') filter.status = status.toUpperCase();
      if (branchScope && branchScope !== 'ALL') filter.branchScope = branchScope;

      const roles = await Role.find(filter).sort({ name: 1 });
      const headers = ['Role Name', 'Description', 'Status', 'Branch Scope', 'Selected Branches', 'Approval Level', 'Approval Limit', 'Users Assigned', 'Is System', 'Created Date'];

      const rows = roles.map((r) => [
        escapeCsv(r.name),
        escapeCsv(r.description || ''),
        escapeCsv(r.status),
        escapeCsv(r.branchScope),
        escapeCsv((r.selectedBranches || []).join('; ')),
        escapeCsv(r.approvalLevel),
        escapeCsv(r.approvalLimit !== null && r.approvalLimit !== undefined ? r.approvalLimit : 'Unlimited'),
        escapeCsv(r.usersAssigned),
        escapeCsv(r.isSystem ? 'Yes' : 'No'),
        escapeCsv(r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
      ]);

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    } else if (type === 'matrix') {
      reportTitle = 'Permission Matrix Report';
      filename = `permission_matrix_${dateStr}.csv`;
      const filter = {};
      if (roleId && roleId !== 'ALL') filter._id = roleId;
      if (status && status !== 'ALL') filter.status = status.toUpperCase();

      const [roles, allPerms] = await Promise.all([
        Role.find(filter).sort({ name: 1 }),
        getAllRolesEffectivePermissions(),
      ]);
      const modules = targetModule && targetModule !== 'ALL'
        ? MODULES_METADATA.filter((m) => m.id.toLowerCase() === targetModule.toLowerCase())
        : MODULES_METADATA;

      const headers = ['Role Name', 'Module', 'View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Granted Count'];
      const rows = [];

      roles.forEach((role) => {
        const rolePerms = allPerms[role._id.toString()] || {};
        const isSysAdmin = role.isSystem || role.name.toLowerCase() === 'system administrator';
        modules.forEach((mod) => {
          const modPerms = rolePerms[mod.id] || {};
          const actValues = {};
          let granted = 0;

          PERMISSION_ACTIONS_METADATA.forEach((act) => {
            const isApp = (mod.applicableActions || []).includes(act.id);
            if (!isApp) {
              actValues[act.id] = 'N/A';
            } else if (isSysAdmin || modPerms[act.id]) {
              actValues[act.id] = 'GRANTED';
              granted++;
            } else {
              actValues[act.id] = 'DENIED';
            }
          });

          rows.push([
            escapeCsv(role.name),
            escapeCsv(mod.name),
            escapeCsv(actValues.view),
            escapeCsv(actValues.create),
            escapeCsv(actValues.edit),
            escapeCsv(actValues.delete),
            escapeCsv(actValues.approve),
            escapeCsv(actValues.export),
            escapeCsv(granted),
          ]);
        });
      });

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    } else if (type === 'assignment') {
      reportTitle = 'Role Assignment Report';
      filename = `role_assignment_${dateStr}.csv`;
      const filter = {};
      if (q && q.trim()) filter.name = { $regex: q.trim(), $options: 'i' };

      const roles = await Role.find(filter).sort({ usersAssigned: -1, name: 1 });
      const totalUsers = roles.reduce((sum, r) => sum + (r.usersAssigned || 0), 0);

      const headers = ['Role Name', 'Role Type', 'Status', 'Branch Scope', 'Users Assigned', 'User Share (%)', 'Approval Authority', 'Identity Provider Note'];
      const rows = roles.map((r) => {
        const assigned = r.usersAssigned || 0;
        const share = totalUsers > 0 ? ((assigned / totalUsers) * 100).toFixed(1) : '0.0';
        return [
          escapeCsv(r.name),
          escapeCsv(r.isSystem ? 'System' : 'Custom'),
          escapeCsv(r.status),
          escapeCsv(r.branchScope),
          escapeCsv(assigned),
          escapeCsv(`${share}%`),
          escapeCsv(r.approvalLevel > 0 ? `Level ${r.approvalLevel}` : 'None'),
          escapeCsv('User profiles managed externally in PDD-003'),
        ];
      });

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    } else if (type === 'inactive') {
      reportTitle = 'Inactive Roles Report';
      filename = `inactive_roles_${dateStr}.csv`;
      const filter = { status: 'INACTIVE' };
      if (q && q.trim()) filter.$or = [{ name: { $regex: q.trim(), $options: 'i' } }, { description: { $regex: q.trim(), $options: 'i' } }];
      if (branchScope && branchScope !== 'ALL') filter.branchScope = branchScope;

      const roles = await Role.find(filter).sort({ name: 1 });
      const headers = ['Role Name', 'Description', 'Branch Scope', 'Approval Level', 'Approval Limit', 'Users Assigned', 'Created Date'];

      const rows = roles.map((r) => [
        escapeCsv(r.name),
        escapeCsv(r.description || ''),
        escapeCsv(r.branchScope),
        escapeCsv(r.approvalLevel),
        escapeCsv(r.approvalLimit !== null ? r.approvalLimit : 'Unlimited'),
        escapeCsv(r.usersAssigned),
        escapeCsv(r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
      ]);

      csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    } else {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unknown report type "${type}". Valid types: summary, matrix, assignment, inactive.`,
          code: 'INVALID_REPORT_TYPE',
        },
      });
    }

    // Record persistent audit log for the report export
    await recordAuditLog({
      action: 'REPORT_EXPORTED',
      actionDisplay: 'Report Exported',
      entityType: 'Report',
      entityName: reportTitle,
      details: {
        reportType: type,
        format: 'CSV',
        filename,
      },
      req,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
