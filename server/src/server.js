import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';
import { Role } from './models/Role.js';
import { ApprovalLevel } from './models/ApprovalLevel.js';
import { AuditLog } from './models/AuditLog.js';
import { AuditSetting } from './models/AuditSetting.js';
import { INITIAL_SEED_ROLES, INITIAL_SEED_APPROVAL_LEVELS } from './data/seedData.js';

import { seedPermissionCatalog, setRolePermissions } from './services/permissionService.js';

const PORT = process.env.PORT || 5000;

const seedDatabaseIfEmpty = async () => {
  try {
    // Ensure the 41-permission catalog is seeded in MongoDB
    await seedPermissionCatalog();

    const count = await Role.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database is empty. Seeding initial RBAC roles and permissions...');
      const createdRoles = await Role.insertMany(INITIAL_SEED_ROLES);
      for (const r of createdRoles) {
        if (r.permissions && Object.keys(r.permissions).length > 0) {
          await setRolePermissions(r._id, r.permissions, { isInternalSeed: true });
        }
      }
      console.log(`[Seed] Successfully seeded ${INITIAL_SEED_ROLES.length} initial roles and role_permissions into MongoDB.`);
    } else {
      console.log(`[Seed] Database already contains ${count} roles. Skipping initial seed.`);
    }

    const levelCount = await ApprovalLevel.countDocuments();
    if (levelCount === 0) {
      console.log('[Seed] Approval levels collection empty. Seeding initial levels...');
      await ApprovalLevel.insertMany(INITIAL_SEED_APPROVAL_LEVELS);
      console.log(`[Seed] Successfully seeded ${INITIAL_SEED_APPROVAL_LEVELS.length} initial approval levels.`);
    }

    const settingsCount = await AuditSetting.countDocuments();
    if (settingsCount === 0) {
      console.log('[Seed] Audit settings empty. Seeding default settings...');
      await AuditSetting.create({
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
      });
      console.log('[Seed] Default audit settings seeded.');
    }

    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      console.log('[Seed] Audit log collection empty. Seeding realistic historical logs...');
      const now = Date.now();
      await AuditLog.insertMany([
        {
          action: 'ROLE_CREATED',
          actionDisplay: 'Role Created',
          entityType: 'Role',
          entityName: 'System Administrator',
          details: { branchScope: 'All Branches', approvalLevel: 4, status: 'ACTIVE' },
          actor: { id: null, name: 'System / Initialization', role: 'System Engine', isSystem: true, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 24 * 7),
        },
        {
          action: 'ROLE_CREATED',
          actionDisplay: 'Role Created',
          entityType: 'Role',
          entityName: 'Branch Manager',
          details: { branchScope: 'Assigned Branch', approvalLevel: 3, status: 'ACTIVE' },
          actor: { id: 'usr-admin-demo', name: 'demo_admin', role: 'System Administrator', isSystem: false, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 24 * 5),
        },
        {
          action: 'PERMISSION_MODIFIED',
          actionDisplay: 'Permission Modified',
          entityType: 'Role',
          entityName: 'Branch Manager',
          details: { summary: 'Granular permissions configured for 8 modules' },
          actor: { id: 'usr-admin-demo', name: 'demo_admin', role: 'System Administrator', isSystem: false, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 24 * 4),
        },
        {
          action: 'BRANCH_SCOPE_CHANGED',
          actionDisplay: 'Branch Scope Changed',
          entityType: 'Role',
          entityName: 'Compliance Officer',
          details: { previousScope: 'Assigned Branch', newScope: 'All Branches' },
          actor: { id: 'usr-admin-demo', name: 'demo_admin', role: 'System Administrator', isSystem: false, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 24 * 3),
        },
        {
          action: 'APPROVAL_LEVEL_CHANGED',
          actionDisplay: 'Approval Level Changed',
          entityType: 'ApprovalLevel',
          entityName: 'Branch Operations Approval',
          details: { levelNumber: 1, approver: 'Branch Operations Manager', threshold: 'Up to $10,000' },
          actor: { id: 'usr-admin-demo', name: 'demo_admin', role: 'System Administrator', isSystem: false, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 24 * 2),
        },
        {
          action: 'ROLE_ACTIVATED',
          actionDisplay: 'Role Activated',
          entityType: 'Role',
          entityName: 'Loan Officer',
          details: { previousStatus: 'INACTIVE', newStatus: 'ACTIVE' },
          actor: { id: 'usr-admin-demo', name: 'demo_admin', role: 'System Administrator', isSystem: false, ipAddress: '127.0.0.1' },
          status: 'SUCCESS',
          createdAt: new Date(now - 3600000 * 12),
        },
      ]);
      console.log('[Seed] Initial audit logs seeded.');
    }
  } catch (error) {
    console.error('[Seed] Error seeding initial data:', error.message);
  }
};

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Seed database if empty
    await seedDatabaseIfEmpty();

    // 3. Start listening
    const server = app.listen(PORT, () => {
      console.log(`[Server] RBAC API Server is running on http://localhost:${PORT}`);
      console.log(`[Server] Health check available at: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
