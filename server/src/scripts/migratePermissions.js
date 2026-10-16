/**
 * migratePermissions.js — Migration script for Option A Database Normalization
 *
 * Implements:
 * 1. Seed catalog of 41 applicable permissions into `permissions` collection.
 * 2. Migrate existing 43 roles' permissions into `role_permissions` collection.
 * 3. Verify effective permissions before vs after migration for all roles.
 * 4. Idempotent execution (can be run repeatedly safely).
 * 5. Rollback support via --rollback flag.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Role } from '../models/Role.js';
import { Permission } from '../models/Permission.js';
import { RolePermission } from '../models/RolePermission.js';
import { seedPermissionCatalog, getRoleEffectivePermissions } from '../services/permissionService.js';
import { MODULES_METADATA } from '../data/seedData.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/access_control_rbac';
const BACKUP_DIR = path.resolve('backups/backup-2026-10-16-pre-normalization');

async function verifyBackup() {
  const metaPath = path.join(BACKUP_DIR, 'backup-metadata.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Backup metadata not found at ${metaPath}. Aborting migration.`);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  for (const [col, info] of Object.entries(meta.collections)) {
    if (!fs.existsSync(info.file)) {
      throw new Error(`Backup file missing for collection "${col}". Aborting migration.`);
    }
  }
  console.log('✓ Pre-migration backup files verified on disk.');
}

async function rollback() {
  console.log('--- ROLLING BACK NORMALIZATION ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const deletedRP = await RolePermission.deleteMany({});
  console.log(`Deleted ${deletedRP.deletedCount} records from role_permissions.`);

  const deletedP = await Permission.deleteMany({});
  console.log(`Deleted ${deletedP.deletedCount} records from permissions.`);

  console.log('✓ Rollback completed. Original roles collection remains untouched.');
  await mongoose.disconnect();
}

async function migrate() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('STARTING OPTION A: STRICT DATABASE NORMALIZATION MIGRATION');
  console.log('══════════════════════════════════════════════════════════════');

  await verifyBackup();

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  // 1. Snapshot pre-migration state
  console.log('\n[Phase 1] Taking pre-migration snapshot of roles & permissions...');
  const existingRoles = await Role.find({}).lean();
  console.log(`Found ${existingRoles.length} roles in database.`);

  const preSnapshot = new Map();
  for (const r of existingRoles) {
    preSnapshot.set(r._id.toString(), {
      name: r.name,
      isSystem: Boolean(r.isSystem),
      status: r.status,
      permissions: JSON.parse(JSON.stringify(r.permissions || {})),
    });
  }

  // 2. Seed permissions catalog
  console.log('\n[Phase 2] Seeding permissions catalog (41 applicable module/action pairs)...');
  const catalog = await seedPermissionCatalog();
  const catalogCount = await Permission.countDocuments();
  console.log(`✓ Permissions catalog seeded: ${catalogCount} records in "permissions" collection.`);
  if (catalogCount !== 41) {
    throw new Error(`Expected exactly 41 permissions, but found ${catalogCount}!`);
  }

  const catalogMap = new Map();
  for (const p of catalog) {
    catalogMap.set(`${p.module}:${p.action}`, p._id);
  }

  // 3. Migrate each role's permissions into role_permissions
  console.log('\n[Phase 3] Migrating role permissions into "role_permissions" collection...');
  let totalAssignmentsCreated = 0;

  for (const role of existingRoles) {
    const rId = role._id;
    const isSysAdmin = Boolean(role.isSystem || role.name?.toLowerCase() === 'system administrator');
    const existingPerms = role.permissions || {};

    const roleAssignments = [];

    for (const mod of MODULES_METADATA) {
      const applicable = mod.applicable || [];
      const modPerms = existingPerms[mod.id] || {};

      for (const act of applicable) {
        // System Admin has all applicable permissions; custom roles check explicit true
        const isGranted = isSysAdmin ? true : Boolean(modPerms[act]);
        if (isGranted) {
          const permId = catalogMap.get(`${mod.id}:${act}`);
          if (permId) {
            roleAssignments.push({
              roleId: rId,
              permissionId: permId,
              module: mod.id,
              action: act,
              granted: true,
            });
          }
        }
      }
    }

    // Idempotent upsert: remove existing role_permissions for this role and insert fresh
    await RolePermission.deleteMany({ roleId: rId });
    if (roleAssignments.length > 0) {
      await RolePermission.insertMany(roleAssignments);
      totalAssignmentsCreated += roleAssignments.length;
    }
  }

  const rolePermCount = await RolePermission.countDocuments();
  console.log(`✓ Created ${totalAssignmentsCreated} assignments. Total in "role_permissions": ${rolePermCount}.`);

  // 4. Verification: Compare effective permissions before vs after
  console.log('\n[Phase 4] Verifying effective permissions for all roles...');
  let verifiedRoles = 0;
  let mismatchedRoles = 0;

  for (const role of existingRoles) {
    const rIdStr = role._id.toString();
    const pre = preSnapshot.get(rIdStr);
    const postMatrix = await getRoleEffectivePermissions(role._id);

    const isSysAdmin = Boolean(role.isSystem || role.name?.toLowerCase() === 'system administrator');

    // Compare each applicable module & action
    for (const mod of MODULES_METADATA) {
      const applicable = mod.applicable || [];
      const preMod = pre.permissions[mod.id] || {};

      for (const act of applicable) {
        const expected = isSysAdmin ? true : Boolean(preMod[act]);
        const actual = Boolean(postMatrix[mod.id]?.[act]);

        if (expected !== actual) {
          console.error(`MISMATCH on Role "${role.name}" [${rIdStr}] -> ${mod.id}:${act}. Expected: ${expected}, Actual: ${actual}`);
          mismatchedRoles++;
        }
      }
    }
    verifiedRoles++;
  }

  console.log(`Verification complete: ${verifiedRoles} roles checked, ${mismatchedRoles} mismatches.`);
  if (mismatchedRoles > 0) {
    throw new Error(`CRITICAL: Found ${mismatchedRoles} permission mismatches after migration!`);
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('MIGRATION COMPLETED SUCCESSFULLY WITH 100% PARITY!');
  console.log(`- roles: ${existingRoles.length}`);
  console.log(`- permissions: ${catalogCount}`);
  console.log(`- role_permissions: ${rolePermCount}`);
  console.log('══════════════════════════════════════════════════════════════');

  await mongoose.disconnect();
}

const isRollback = process.argv.includes('--rollback');
if (isRollback) {
  rollback().catch((err) => {
    console.error('Rollback failed:', err);
    process.exit(1);
  });
} else {
  migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
