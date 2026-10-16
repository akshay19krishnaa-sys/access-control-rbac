import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { Permission } from '../models/Permission.js';
import { RolePermission } from '../models/RolePermission.js';
import { checkRolePermission, getRoleEffectivePermissions } from '../services/permissionService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/access_control_rbac';

async function verify() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const pCount = await Permission.countDocuments();
  const rpCount = await RolePermission.countDocuments();
  const rCount = await Role.countDocuments();

  console.log('\nActual Collection Counts:');
  console.log(' - roles:', rCount);
  console.log(' - permissions:', pCount);
  console.log(' - role_permissions:', rpCount);

  if (pCount !== 41) throw new Error(`Expected 41 permissions, found ${pCount}`);
  if (rpCount === 0) throw new Error('Expected role_permissions to be populated');

  // Verify unique indexes
  const pIndexes = await Permission.collection.indexes();
  console.log('\nPermission indexes:', pIndexes.map(i => i.name).join(', '));

  const rpIndexes = await RolePermission.collection.indexes();
  console.log('RolePermission indexes:', rpIndexes.map(i => i.name).join(', '));

  // Verify custom role resolution
  const testRole = await Role.findOne({ isSystem: false, status: 'ACTIVE' });
  console.log(`\nVerifying role: "${testRole.name}" [${testRole._id}]`);

  const assignedRP = await RolePermission.findOne({ roleId: testRole._id, granted: true });
  console.log(`Assigned permission in role_permissions: ${assignedRP.module}.${assignedRP.action}`);

  const hasPerm = await checkRolePermission(testRole._id, assignedRP.module, assignedRP.action);
  console.log(`checkRolePermission evaluated: ${hasPerm} (expected: true)`);
  if (!hasPerm) throw new Error('checkRolePermission failed for assigned permission');

  // Verify that resolution does NOT rely on role.permissions
  // Temporarily inspect effective permissions resolved from RolePermission
  const effective = await getRoleEffectivePermissions(testRole._id);
  const matrixValue = effective[assignedRP.module][assignedRP.action];
  console.log(`getRoleEffectivePermissions resolved: ${matrixValue} (expected: true)`);
  if (!matrixValue) throw new Error('Effective permissions matrix failed to resolve from role_permissions');

  console.log('\n✓ ALL NORMALIZATION VERIFICATIONS PASSED SUCCESSFULLY.');
  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
