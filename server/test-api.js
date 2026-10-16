/**
 * test-api.js — Comprehensive API & business rule test runner
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('─── RBAC REST API VERIFICATION SUITE ───\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Healthcheck
    console.log('[1] Testing GET /api/health');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(healthRes.status === 200 && health.status === 'healthy', 'Health check returns 200 OK');

    // 2. GET /api/roles
    console.log('\n[2] Testing GET /api/roles');
    const rolesRes = await fetch(`${BASE_URL}/roles`);
    const rolesData = await rolesRes.json();
    assert(rolesRes.status === 200 && Array.isArray(rolesData.data), 'GET /api/roles returns array of roles');
    assert(rolesData.data.length >= 7, `Roles count is ${rolesData.data.length} (at least 7 seeded roles)`);

    const adminRole = rolesData.data.find(r => r.name === 'System Administrator');
    assert(Boolean(adminRole), 'System Administrator role is present');
    const roleId = adminRole ? adminRole.id || adminRole._id : null;

    // 3. GET /api/roles/:id
    console.log(`\n[3] Testing GET /api/roles/:id for System Administrator (${roleId})`);
    const singleRes = await fetch(`${BASE_URL}/roles/${roleId}`);
    const singleData = await singleRes.json();
    assert(singleRes.status === 200 && singleData.data.name === 'System Administrator', 'GET single role returns correct record');

    // 4. POST /api/roles (Valid Creation with initial permissions)
    console.log('\n[4] Testing POST /api/roles (Valid Creation with Minimum Permissions)');
    const testRoleName = `Test Role ${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testRoleName,
        description: 'Temporary test role for automated test suite',
        branchScope: 'Assigned Branch',
        approvalLevel: 1,
        approvalLimit: 10000,
        status: 'ACTIVE',
        permissions: { dashboard: { view: true } },
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.data.name === testRoleName, `Created role "${testRoleName}"`);
    const createdId = createData.data ? (createData.data.id || createData.data._id) : null;

    // 4b. Priority 1: Reject role creation with empty permissions or missing permissions
    console.log('\n[4b] Testing Priority 1: Reject role creation without permissions');
    const noPermsRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Zero Perm Role ${Date.now()}`,
        branchScope: 'Assigned Branch',
      }),
    });
    const noPermsData = await noPermsRes.json();
    assert(
      noPermsRes.status === 400 && noPermsData.error?.code === 'MINIMUM_PERMISSION_REQUIRED',
      `Role creation with missing permissions rejected with 400 & MINIMUM_PERMISSION_REQUIRED: ${noPermsData.error?.message}`
    );

    // 4c. Priority 1: Reject role creation with all false permissions
    console.log('\n[4c] Testing Priority 1: Reject role creation with all false permissions');
    const allFalseRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `All False Role ${Date.now()}`,
        branchScope: 'Assigned Branch',
        permissions: { dashboard: { view: false, export: false }, savings: { view: false } },
      }),
    });
    const allFalseData = await allFalseRes.json();
    assert(
      allFalseRes.status === 400 && allFalseData.error?.code === 'MINIMUM_PERMISSION_REQUIRED',
      `Role creation with all-false permissions rejected with 400 & MINIMUM_PERMISSION_REQUIRED: ${allFalseData.error?.message}`
    );

    // 5. POST /api/roles (Duplicate name check -> 409)
    console.log('\n[5] Testing POST /api/roles Duplicate Name Validation');
    const dupRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testRoleName.toLowerCase(), // case-insensitive check
        branchScope: 'Assigned Branch',
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, `Duplicate role name correctly rejected with 409 Conflict: ${dupData.error?.message}`);

    // 6. POST /api/roles (Validation: name > 100 chars -> 400)
    console.log('\n[6] Testing POST /api/roles Length Validation');
    const longNameRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A'.repeat(101),
        branchScope: 'Assigned Branch',
      }),
    });
    assert(longNameRes.status === 400, 'Role name > 100 characters correctly rejected with 400 Bad Request');

    // 7. PUT /api/roles/:id (Update role)
    console.log(`\n[7] Testing PUT /api/roles/:id (${createdId})`);
    const updateRes = await fetch(`${BASE_URL}/roles/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${testRoleName} Updated`,
        description: 'Updated description for test role',
        approvalLevel: 2,
        approvalLimit: 25000,
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.data.approvalLevel === 2, 'Role updated successfully in MongoDB');

    // 7b. Priority 1: Reject role update with zero permissions
    console.log('\n[7b] Testing Priority 1: Reject role update with all false permissions');
    const updateZeroPermsRes = await fetch(`${BASE_URL}/roles/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: { dashboard: { view: false }, customers: { view: false } },
      }),
    });
    const updateZeroPermsData = await updateZeroPermsRes.json();
    assert(
      updateZeroPermsRes.status === 400 && updateZeroPermsData.error?.code === 'MINIMUM_PERMISSION_REQUIRED',
      `Role update with zero permissions rejected with 400 & MINIMUM_PERMISSION_REQUIRED: ${updateZeroPermsData.error?.message}`
    );

    // 7c. Priority 2: Protect System Administrator role permissions against modification via PUT /api/roles/:id
    console.log('\n[7c] Testing Priority 2: Block System Administrator permission update via PUT /api/roles/:id');
    const updateAdminRoleRes = await fetch(`${BASE_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: { dashboard: { view: false } },
      }),
    });
    const updateAdminRoleData = await updateAdminRoleRes.json();
    assert(
      updateAdminRoleRes.status === 403 && updateAdminRoleData.error?.code === 'SYSTEM_PERMISSIONS_PROTECTED',
      `Privilege escalation blocked with 403 & SYSTEM_PERMISSIONS_PROTECTED: ${updateAdminRoleData.error?.message}`
    );

    // 8. PATCH /api/roles/:id/status (Deactivate System Administrator -> should be FORBIDDEN 403)
    console.log('\n[8] Testing Rule: Prevent Deactivation of System Administrator');
    const deactAdminRes = await fetch(`${BASE_URL}/roles/${roleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    const deactAdminData = await deactAdminRes.json();
    assert(deactAdminRes.status === 403, `System Administrator deactivation correctly blocked with 403: ${deactAdminData.error?.message}`);

    // 9. PATCH /api/roles/:id/status (Rule: Inactive roles cannot have users assigned)
    console.log('\n[9] Testing Rule: Inactive roles cannot have users assigned');
    const cashierRole = rolesData.data.find(r => r.name === 'Cashier');
    const cashierId = cashierRole.id || cashierRole._id;
    const deactCashierRes = await fetch(`${BASE_URL}/roles/${cashierId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    const deactCashierData = await deactCashierRes.json();
    assert(deactCashierRes.status === 400, `Deactivation of role with active users correctly blocked: ${deactCashierData.error?.message}`);

    // 10. PATCH /api/roles/:id/status (Toggle custom test role status)
    console.log('\n[10] Testing PATCH /api/roles/:id/status (Valid toggle)');
    const deactTestRes = await fetch(`${BASE_URL}/roles/${createdId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    const deactTestData = await deactTestRes.json();
    assert(deactTestRes.status === 200 && deactTestData.data.status === 'INACTIVE', 'Custom role deactivated successfully');

    // 11. POST /api/roles/:id/clone
    console.log('\n[11] Testing POST /api/roles/:id/clone');
    const cloneRes = await fetch(`${BASE_URL}/roles/${createdId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const cloneData = await cloneRes.json();
    assert(cloneRes.status === 201 && cloneData.data.name.startsWith('Copy of'), `Cloned role name is "${cloneData.data?.name}"`);

    // 12. DELETE /api/roles/:id (Permanent deletion rejection -> 405)
    console.log('\n[12] Testing Rule: Reject Permanent Role Deletion');
    const deleteRes = await fetch(`${BASE_URL}/roles/${createdId}`, {
      method: 'DELETE',
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 405, `Permanent deletion rejected with 405 Method Not Allowed: ${deleteData.error?.message}`);

    // 13. GET /api/permissions
    console.log('\n[13] Testing GET /api/permissions');
    const permsRes = await fetch(`${BASE_URL}/permissions`);
    const permsData = await permsRes.json();
    assert(permsRes.status === 200, 'GET /api/permissions returned 200');
    assert(permsData.data.modules.length === 8, `Returned ${permsData.data.modules.length} modules (expected 8)`);
    assert(permsData.data.actions.length === 6, `Returned ${permsData.data.actions.length} actions (expected 6)`);
    assert(typeof permsData.data.matrix === 'object', 'Permissions matrix object is present');

    // 14. PUT /api/roles/:id/permissions
    console.log('\n[14] Testing PUT /api/roles/:id/permissions');
    const testPerms = {
      dashboard: { view: true, export: true },
      savings: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
    };
    const updatePermsRes = await fetch(`${BASE_URL}/roles/${createdId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: testPerms }),
    });
    const updatePermsData = await updatePermsRes.json();
    assert(updatePermsRes.status === 200, 'PUT /api/roles/:id/permissions returned 200');
    assert(updatePermsData.data.permissions.savings.create === true, 'Updated permissions verified in response');

    // Verify persistence by fetching single role again
    const verifyPermsRes = await fetch(`${BASE_URL}/roles/${createdId}`);
    const verifyPermsData = await verifyPermsRes.json();
    assert(verifyPermsData.data.permissions.savings?.create === true, 'Role permissions persisted in MongoDB');

    // 14b. Priority 1: Reject PUT /api/roles/:id/permissions with zero permissions
    console.log('\n[14b] Testing Priority 1: PUT /api/roles/:id/permissions with zero permissions');
    const emptyPermsRes = await fetch(`${BASE_URL}/roles/${createdId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: {
          dashboard: { view: false, export: false },
          savings: { view: false, create: false },
        },
      }),
    });
    const emptyPermsData = await emptyPermsRes.json();
    assert(
      emptyPermsRes.status === 400 && emptyPermsData.error?.code === 'MINIMUM_PERMISSION_REQUIRED',
      `Permission update with zero permissions rejected with 400 & MINIMUM_PERMISSION_REQUIRED: ${emptyPermsData.error?.message}`
    );

    // 14c. Priority 2: Protect System Administrator permissions via PUT /api/roles/:id/permissions
    console.log('\n[14c] Testing Priority 2: Protect System Administrator via PUT /api/roles/:id/permissions');
    const adminPermsRes = await fetch(`${BASE_URL}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: {
          dashboard: { view: false },
        },
      }),
    });
    const adminPermsData = await adminPermsRes.json();
    assert(
      adminPermsRes.status === 403 && adminPermsData.error?.code === 'SYSTEM_PERMISSIONS_PROTECTED',
      `System Administrator permission modification rejected with 403 & SYSTEM_PERMISSIONS_PROTECTED: ${adminPermsData.error?.message}`
    );
    assert(verifyPermsData.data.permissions.savings.create === true, 'Permissions verified persisted in MongoDB');

    // 15. GET /api/settings/audit
    console.log('\n[15] Testing GET /api/settings/audit');
    const getSettingsRes = await fetch(`${BASE_URL}/settings/audit`);
    const getSettingsData = await getSettingsRes.json();
    assert(getSettingsRes.status === 200 && getSettingsData.success === true, 'GET /api/settings/audit returned 200 OK');
    assert(typeof getSettingsData.data.retentionDays === 'number', `Persistent retentionDays is ${getSettingsData.data.retentionDays}`);
    assert(getSettingsData.data.enabledEvents?.roleCreated === true, 'enabledEvents.roleCreated is true by default');

    // 16. PUT /api/settings/audit (Valid update & persistence)
    console.log('\n[16] Testing PUT /api/settings/audit (Valid Update)');
    const updateSettingsRes = await fetch(`${BASE_URL}/settings/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        retentionDays: 180,
        logLevel: 'WARNING',
        exportFormat: 'CSV',
        complianceReportSchedule: 'MONTHLY',
        enabledEvents: {
          roleCreated: true,
          roleUpdated: true,
          permissionModified: true,
          branchScopeChanged: true,
          approvalLevelChanged: true,
          roleStatusChanged: true,
        },
      }),
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert(updateSettingsRes.status === 200 && updateSettingsData.data.retentionDays === 180, 'Updated retentionDays to 180 in MongoDB');
    assert(updateSettingsData.data.complianceReportSchedule === 'MONTHLY', 'Updated complianceReportSchedule to MONTHLY');

    // Verify persistence in MongoDB by fetching again
    const verifySettingsRes = await fetch(`${BASE_URL}/settings/audit`);
    const verifySettingsData = await verifySettingsRes.json();
    assert(verifySettingsData.data.retentionDays === 180, 'Settings verified persisted in MongoDB via GET');

    // 17. PUT /api/settings/audit (Validation: negative days -> 400)
    console.log('\n[17] Testing PUT /api/settings/audit Validation');
    const invalidSettingsRes = await fetch(`${BASE_URL}/settings/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retentionDays: -5 }),
    });
    assert(invalidSettingsRes.status === 400, 'Invalid retentionDays correctly rejected with 400 Bad Request');

    // 18. GET /api/audit-logs
    console.log('\n[18] Testing GET /api/audit-logs');
    const auditRes = await fetch(`${BASE_URL}/audit-logs`);
    const auditData = await auditRes.json();
    assert(auditRes.status === 200 && Array.isArray(auditData.data), 'GET /api/audit-logs returned array of audit logs');
    assert(auditData.data.length > 0, `Audit logs count is ${auditData.data.length}`);

    // Check structure of first audit log
    const sampleLog = auditData.data[0];
    assert(Boolean(sampleLog.action && sampleLog.entityName && sampleLog.createdAt), 'Audit log contains action, entityName, createdAt');
    assert(Boolean(sampleLog.actor && sampleLog.actor.name), `Actor is legitimate: "${sampleLog.actor?.name}" (Role: ${sampleLog.actor?.role})`);

    // 19. Verify audit logging of events performed in this test suite
    console.log('\n[19] Verifying Event Audit Trails for Performed Actions');
    const createdRoleLog = auditData.data.find(l => l.action === 'ROLE_CREATED' && l.entityName === testRoleName);
    assert(Boolean(createdRoleLog), `Audit log for ROLE_CREATED found for "${testRoleName}"`);

    const permModifiedLog = auditData.data.find(l => l.action === 'PERMISSION_MODIFIED');
    assert(Boolean(permModifiedLog), 'Audit log for PERMISSION_MODIFIED found');

    const statusLog = auditData.data.find(l => l.action === 'ROLE_DEACTIVATED' || l.action === 'ROLE_ACTIVATED');
    assert(Boolean(statusLog), 'Audit log for ROLE_ACTIVATED/DEACTIVATED found');

    // 20. GET /api/audit-logs with action filter
    console.log('\n[20] Testing GET /api/audit-logs?action=ROLE_CREATED');
    const filterRes = await fetch(`${BASE_URL}/audit-logs?action=ROLE_CREATED`);
    const filterData = await filterRes.json();
    assert(filterRes.status === 200, 'Action filter returned 200 OK');
    const allRoleCreated = filterData.data.every(l => l.action === 'ROLE_CREATED');
    assert(allRoleCreated && filterData.data.length > 0, 'All returned records have action ROLE_CREATED');

    // 21. GET /api/audit-logs with search query
    console.log('\n[21] Testing GET /api/audit-logs?q=Administrator');
    const searchRes = await fetch(`${BASE_URL}/audit-logs?q=Administrator`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Search query returned 200 OK');
    assert(searchData.data.length > 0, `Search returned ${searchData.data.length} records matching "Administrator"`);

    // 22. GET /api/audit-logs/export (CSV export)
    console.log('\n[22] Testing GET /api/audit-logs/export?format=csv');
    const exportRes = await fetch(`${BASE_URL}/audit-logs/export?format=csv`);
    const exportCsv = await exportRes.text();
    assert(exportRes.status === 200, 'Export CSV returned 200 OK');
    assert(exportCsv.includes('Timestamp,Action,Entity Type'), 'CSV header row verified');
    assert(exportCsv.includes('Role Created'), 'CSV contains Role Created rows');

    // ──────────────────────────────────────────────────────────────────────────
    // PRIORITY 4: BACKEND AUTHORIZATION & BRANCH SCOPE ENFORCEMENT
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n─── [PRIORITY 4] BACKEND AUTHORIZATION & BRANCH SCOPE TESTS ───');

    // 23. Test Session Token Generation & Authentication Guard (HTTP 401)
    console.log('\n[23] Testing Authentication Guard & Impersonation Prevention');
    const unauthRes = await fetch(`${BASE_URL}/business/savings`);
    const unauthData = await unauthRes.json();
    assert(
      unauthRes.status === 401 && unauthData.error?.code === 'AUTHENTICATION_REQUIRED',
      `Unauthenticated request correctly rejected with 401 AUTHENTICATION_REQUIRED: ${unauthData.error?.message}`
    );

    const invalidTokenRes = await fetch(`${BASE_URL}/business/savings`, {
      headers: { Authorization: 'Bearer forged.invalid.token.signature' },
    });
    const invalidTokenData = await invalidTokenRes.json();
    assert(
      invalidTokenRes.status === 401 && invalidTokenData.error?.code === 'AUTHENTICATION_REQUIRED',
      `Forged/invalid bearer token rejected with 401 AUTHENTICATION_REQUIRED: ${invalidTokenData.error?.message}`
    );

    // Impersonation attempt: client sends roleId in body or header without valid credentials
    const impersonationRes = await fetch(`${BASE_URL}/business/savings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role-id': roleId, // System Administrator ID
        'x-user-id': 'hacker',
      },
      body: JSON.stringify({ roleId: roleId, branch: 'Head Office' }),
    });
    const impersonationData = await impersonationRes.json();
    assert(
      impersonationRes.status === 401,
      `Client impersonation attempt via roleId header/body rejected with 401: ${impersonationData.error?.message}`
    );

    // Generate trusted server-side test sessions
    const adminSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-admin',
        username: 'sys_admin',
        roleName: 'System Administrator',
        assignedBranch: 'Head Office',
      }),
    });
    const { token: adminToken } = await adminSessionRes.json();

    const cashierSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-cashier-1',
        username: 'alice_cashier',
        roleName: 'Cashier',
        assignedBranch: 'Downtown Branch',
      }),
    });
    const { token: cashierToken } = await cashierSessionRes.json();

    const managerSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-manager-1',
        username: 'bob_manager',
        roleName: 'Branch Manager',
        assignedBranch: 'Downtown Branch',
      }),
    });
    const { token: managerToken } = await managerSessionRes.json();

    // 24. Role Validity: Missing Role & Inactive Role (HTTP 403)
    console.log('\n[24] Testing Missing Role & Inactive Role Handling');
    const missingRoleSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-ghost',
        username: 'ghost_user',
        roleId: '600000000000000000000000', // Non-existent ObjectId
      }),
    });
    const { token: missingRoleToken } = await missingRoleSessionRes.json();

    const missingRoleRes = await fetch(`${BASE_URL}/business/savings`, {
      headers: { Authorization: `Bearer ${missingRoleToken}` },
    });
    const missingRoleData = await missingRoleRes.json();
    assert(
      missingRoleRes.status === 403 && missingRoleData.error?.code === 'ROLE_NOT_FOUND',
      `Non-existent role correctly rejected with 403 ROLE_NOT_FOUND: ${missingRoleData.error?.message}`
    );

    // Create an inactive role to verify inactive enforcement
    const inactiveRoleRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Inactive Role ${Date.now()}`,
        status: 'INACTIVE',
        branchScope: 'Assigned Branch',
        permissions: { savings: { view: true, create: true } },
      }),
    });
    const inactiveRoleData = await inactiveRoleRes.json();
    const inactiveRoleId = inactiveRoleData.data?.id || inactiveRoleData.data?._id;

    const inactiveSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-inactive',
        username: 'inactive_user',
        roleId: inactiveRoleId,
      }),
    });
    const { token: inactiveRoleToken } = await inactiveSessionRes.json();

    const inactiveAccessRes = await fetch(`${BASE_URL}/business/savings`, {
      headers: { Authorization: `Bearer ${inactiveRoleToken}` },
    });
    const inactiveAccessData = await inactiveAccessRes.json();
    assert(
      inactiveAccessRes.status === 403 && inactiveAccessData.error?.code === 'ROLE_INACTIVE',
      `Inactive role access blocked with 403 ROLE_INACTIVE: ${inactiveAccessData.error?.message}`
    );

    // 25. Granular Module & Action Permissions (Allowed vs Denied)
    console.log('\n[25] Testing Granular Action Permissions (View, Create, Edit, Delete, Approve, Export)');
    // Cashier has savings.view = true
    const cashierViewRes = await fetch(`${BASE_URL}/business/savings`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(cashierViewRes.status === 200, 'Cashier with savings.view=true allowed access (200 OK)');

    // Cashier has savings.delete = false
    const cashierDeleteRes = await fetch(`${BASE_URL}/business/savings/sav-101`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const cashierDeleteData = await cashierDeleteRes.json();
    assert(
      cashierDeleteRes.status === 403 && cashierDeleteData.error?.code === 'PERMISSION_DENIED',
      `Cashier denied delete action with 403 PERMISSION_DENIED: ${cashierDeleteData.error?.message}`
    );

    // Cashier has loan.approve = false
    const cashierApproveRes = await fetch(`${BASE_URL}/business/loan/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({ loanId: 'LN-7721' }),
    });
    const cashierApproveData = await cashierApproveRes.json();
    assert(
      cashierApproveRes.status === 403 && cashierApproveData.error?.code === 'PERMISSION_DENIED',
      `Cashier denied loan approval with 403 PERMISSION_DENIED: ${cashierApproveData.error?.message}`
    );

    // Branch Manager has loan.approve = true
    const managerApproveRes = await fetch(`${BASE_URL}/business/loan/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ loanId: 'LN-7721' }),
    });
    assert(managerApproveRes.status === 200, 'Branch Manager with loan.approve=true allowed access (200 OK)');

    // System Administrator blanket authorization: can execute all actions
    const adminDeleteRes = await fetch(`${BASE_URL}/business/savings/sav-101`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDeleteRes.status === 200, 'System Administrator possesses blanket authorization (200 OK)');

    // Reports export action
    const adminExportRes = await fetch(`${BASE_URL}/business/reports/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminExportRes.status === 200, 'Reports export permission verified (200 OK)');

    // 26. Branch Scope Enforcement (Assigned Branch, Selected Branches, All Branches)
    console.log('\n[26] Testing Branch Scope Enforcement');
    // Cashier has branchScope: 'Assigned Branch' with assignedBranch: 'Downtown Branch'
    const cashierOwnBranchRes = await fetch(`${BASE_URL}/business/branches/Downtown Branch/data`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(cashierOwnBranchRes.status === 200, 'Assigned Branch access to home branch allowed (200 OK)');

    const cashierForeignBranchRes = await fetch(`${BASE_URL}/business/branches/Uptown Branch/data`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const cashierForeignData = await cashierForeignBranchRes.json();
    assert(
      cashierForeignBranchRes.status === 403 && cashierForeignData.error?.code === 'BRANCH_SCOPE_VIOLATION',
      `Assigned Branch out-of-scope access rejected with 403 BRANCH_SCOPE_VIOLATION: ${cashierForeignData.error?.message}`
    );

    // Create a role with branchScope: 'Selected Branches'
    const selectedBranchesRoleName = `Selected Scope Role ${Date.now()}`;
    const selectedRoleRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: selectedBranchesRoleName,
        branchScope: 'Selected Branches',
        selectedBranches: ['Downtown Branch', 'East End Branch'],
        permissions: { savings: { view: true } },
      }),
    });
    const selectedRoleData = await selectedRoleRes.json();
    const selectedRoleId = selectedRoleData.data?.id || selectedRoleData.data?._id;

    const selectedSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-selected',
        username: 'selected_user',
        roleId: selectedRoleId,
        assignedBranch: 'Downtown Branch',
      }),
    });
    const { token: selectedToken } = await selectedSessionRes.json();

    // Access permitted branch in selected list
    const selectedAllowedRes = await fetch(`${BASE_URL}/business/branches/East End Branch/data`, {
      headers: { Authorization: `Bearer ${selectedToken}` },
    });
    assert(selectedAllowedRes.status === 200, 'Selected Branches allowed branch access verified (200 OK)');

    // Attempt access to branch NOT in selected list
    const selectedDeniedRes = await fetch(`${BASE_URL}/business/branches/West Side Branch/data`, {
      headers: { Authorization: `Bearer ${selectedToken}` },
    });
    const selectedDeniedData = await selectedDeniedRes.json();
    assert(
      selectedDeniedRes.status === 403 && selectedDeniedData.error?.code === 'BRANCH_SCOPE_VIOLATION',
      `Selected Branches unauthorized branch rejected with 403 BRANCH_SCOPE_VIOLATION: ${selectedDeniedData.error?.message}`
    );

    // Create a role with branchScope: 'All Branches'
    const allBranchesRoleName = `All Branches Scope Role ${Date.now()}`;
    const allRoleRes = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: allBranchesRoleName,
        branchScope: 'All Branches',
        permissions: { savings: { view: true } },
      }),
    });
    const allRoleData = await allRoleRes.json();
    const allRoleId = allRoleData.data?.id || allRoleData.data?._id;

    const allSessionRes = await fetch(`${BASE_URL}/business/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr-all-branches',
        username: 'roaming_auditor',
        roleId: allRoleId,
      }),
    });
    const { token: allToken } = await allSessionRes.json();

    const allAccessRes = await fetch(`${BASE_URL}/business/branches/West Side Branch/data`, {
      headers: { Authorization: `Bearer ${allToken}` },
    });
    assert(allAccessRes.status === 200, 'All Branches scope allowed access to any branch (200 OK)');

    // ──────────────────────────────────────────────────────────────────────────
    // PRIORITY 5: COMPLIANCE REPORTS & CSV EXPORT
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n─── [PRIORITY 5] COMPLIANCE REPORTS & EXPORT TESTS ───');

    // 27. Report A: Role Summary Report & Filters
    console.log('\n[27] Testing Report A: Role Summary Report');
    const roleSummaryRes = await fetch(`${BASE_URL}/reports/role-summary`);
    const roleSummaryData = await roleSummaryRes.json();
    assert(roleSummaryRes.status === 200 && roleSummaryData.reportName === 'Role Summary Report', 'GET /api/reports/role-summary returns 200 OK');
    assert(Array.isArray(roleSummaryData.data) && roleSummaryData.data.length > 0, `Role summary returned ${roleSummaryData.data.length} roles`);
    const firstRole = roleSummaryData.data[0];
    assert(Boolean(firstRole.name && firstRole.status && firstRole.branchScope), 'Role summary contains name, status, branchScope');

    // Test filters: status=ACTIVE
    const activeRolesRes = await fetch(`${BASE_URL}/reports/role-summary?status=ACTIVE`);
    const activeRolesData = await activeRolesRes.json();
    const allActive = activeRolesData.data.every((r) => r.status === 'ACTIVE');
    assert(allActive && activeRolesData.data.length > 0, 'Role summary status filter (ACTIVE) verified');

    // Test empty filter result (no matching search query)
    const emptyQueryRes = await fetch(`${BASE_URL}/reports/role-summary?q=NonExistentRoleXYZ_999`);
    const emptyQueryData = await emptyQueryRes.json();
    assert(emptyQueryRes.status === 200 && emptyQueryData.data.length === 0, 'Empty dataset handled gracefully with 200 OK');

    // 28. Report B: Permission Matrix Report
    console.log('\n[28] Testing Report B: Permission Matrix Report');
    const permMatrixRes = await fetch(`${BASE_URL}/reports/permission-matrix`);
    const permMatrixData = await permMatrixRes.json();
    assert(permMatrixRes.status === 200 && permMatrixData.reportName === 'Permission Matrix Report', 'GET /api/reports/permission-matrix returns 200 OK');
    assert(permMatrixData.meta.rolesCount >= 7, `Roles count is ${permMatrixData.meta.rolesCount}`);
    assert(permMatrixData.meta.modulesCount === 8, 'Modules count in report is 8');
    const sampleMatrixRow = permMatrixData.data[0];
    assert(Boolean(sampleMatrixRow.roleName && sampleMatrixRow.moduleName && sampleMatrixRow.actions), 'Matrix row contains roleName, moduleName, actions mapping');

    // Test module filter: module=savings
    const savingsModuleRes = await fetch(`${BASE_URL}/reports/permission-matrix?module=savings`);
    const savingsModuleData = await savingsModuleRes.json();
    const allSavings = savingsModuleData.data.every((r) => r.moduleId === 'savings');
    assert(allSavings && savingsModuleData.data.length > 0, 'Permission matrix module filter (savings) verified');

    // 29. Report C: Role Assignment Report
    console.log('\n[29] Testing Report C: Role Assignment Report');
    const assignmentRes = await fetch(`${BASE_URL}/reports/role-assignment`);
    const assignmentData = await assignmentRes.json();
    assert(assignmentRes.status === 200 && assignmentData.reportName === 'Role Assignment Report', 'GET /api/reports/role-assignment returns 200 OK');
    assert(assignmentData.notice.includes('PDD-003'), 'Report C explicitly notes user profiles managed externally in PDD-003');
    assert(typeof assignmentData.meta.totalAssignedUsers === 'number', `Total assigned users calculated: ${assignmentData.meta.totalAssignedUsers}`);
    const sampleAssign = assignmentData.data[0];
    assert(typeof sampleAssign.usersAssigned === 'number' && typeof sampleAssign.userSharePercent === 'number', 'Role assignment row has usersAssigned and userSharePercent');

    // 30. Report D: Inactive Roles Report
    console.log('\n[30] Testing Report D: Inactive Roles Report');
    const inactiveRepRes = await fetch(`${BASE_URL}/reports/inactive-roles`);
    const inactiveRepData = await inactiveRepRes.json();
    assert(inactiveRepRes.status === 200 && inactiveRepData.reportName === 'Inactive Roles Report', 'GET /api/reports/inactive-roles returns 200 OK');
    assert(Array.isArray(inactiveRepData.data) && inactiveRepData.data.length > 0, `Inactive roles report returned ${inactiveRepData.data.length} inactive role(s)`);
    const allInactive = inactiveRepData.data.every((r) => r.status === 'INACTIVE');
    assert(allInactive, 'All roles in Inactive Roles Report have status INACTIVE');

    // 31. CSV Exports for all 4 Reports
    console.log('\n[31] Testing CSV Exports for all 4 Reports');
    const exportSummaryRes = await fetch(`${BASE_URL}/reports/export?type=summary&format=csv`);
    const exportSummaryCsv = await exportSummaryRes.text();
    assert(exportSummaryRes.status === 200 && exportSummaryCsv.includes('Role Name,Description,Status'), 'Role Summary CSV export generated');

    const exportMatrixRes = await fetch(`${BASE_URL}/reports/export?type=matrix&format=csv`);
    const exportMatrixCsv = await exportMatrixRes.text();
    assert(exportMatrixRes.status === 200 && exportMatrixCsv.includes('Role Name,Module,View,Create'), 'Permission Matrix CSV export generated');

    const exportAssignmentRes = await fetch(`${BASE_URL}/reports/export?type=assignment&format=csv`);
    const exportAssignmentCsv = await exportAssignmentRes.text();
    assert(exportAssignmentRes.status === 200 && exportAssignmentCsv.includes('Identity Provider Note'), 'Role Assignment CSV export generated with PDD-003 transparency');

    const exportInactiveRes = await fetch(`${BASE_URL}/reports/export?type=inactive&format=csv`);
    const exportInactiveCsv = await exportInactiveRes.text();
    assert(exportInactiveRes.status === 200 && exportInactiveCsv.includes('Role Name,Description,Branch Scope'), 'Inactive Roles CSV export generated');

    // 32. Report Authorization & Audit Trail Verification
    console.log('\n[32] Testing Report Authorization & Export Audit Logging');
    // Calling protected-export without token -> 401
    const unauthExportRes = await fetch(`${BASE_URL}/reports/protected-export?type=summary`);
    assert(unauthExportRes.status === 401, 'Protected export without credentials rejected with 401');

    // Calling protected-export with Cashier token (Cashier has reports.export = false) -> 403
    const cashierExportRes = await fetch(`${BASE_URL}/reports/protected-export?type=summary`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(cashierExportRes.status === 403, 'User without reports.export permission rejected with 403');

    // Calling protected-export with Admin token -> 200
    const adminPermExportRes = await fetch(`${BASE_URL}/reports/protected-export?type=summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPermExportRes.status === 200, 'Admin with reports.export permission allowed export (200 OK)');

    // Verify persistent audit log for REPORT_EXPORTED
    const auditCheckRes = await fetch(`${BASE_URL}/audit-logs`);
    const auditCheckData = await auditCheckRes.json();
    const reportExportLog = auditCheckData.data.find((l) => l.action === 'REPORT_EXPORTED');
    assert(Boolean(reportExportLog), `Audit log record found for REPORT_EXPORTED ("${reportExportLog?.entityName}")`);

    console.log(`\n══════════════════════════════════════════════`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} Failed`);
    console.log(`══════════════════════════════════════════════\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTests();
