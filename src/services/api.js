
const API_BASE = 'https://access-control-rbac-sepia.vercel.app/api';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = payload?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload;
}

export async function getRolesApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.branchScope) params.set('branchScope', filters.branchScope);

  const url = `${API_BASE}/roles${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result.data;
}

export async function getRoleByIdApi(id) {
  const result = await handleResponse(await fetch(`${API_BASE}/roles/${id}`));
  return result.data;
}

export async function createRoleApi(roleData) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    })
  );
  return result.data;
}

export async function updateRoleApi(id, roleData) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    })
  );
  return result.data;
}

export async function patchRoleStatusApi(id, status) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/roles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  );
  return result.data;
}

export async function cloneRoleApi(id) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/roles/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  );
  return result.data;
}

export async function getPermissionsApi() {
  const result = await handleResponse(await fetch(`${API_BASE}/permissions`));
  return result.data;
}

export async function updateRolePermissionsApi(roleId, permissions) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    })
  );
  return result.data;
}

export async function getApprovalLevelsApi() {
  const result = await handleResponse(await fetch(`${API_BASE}/approval-levels`));
  return result.data;
}

export async function createApprovalLevelApi(levelData) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/approval-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(levelData),
    })
  );
  return result.data;
}

export async function getAuditSettingsApi() {
  const result = await handleResponse(await fetch(`${API_BASE}/settings/audit`));
  return result.data;
}

export async function updateAuditSettingsApi(settingsData) {
  const result = await handleResponse(
    await fetch(`${API_BASE}/settings/audit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    })
  );
  return result.data;
}

export async function getAuditLogsApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.action && filters.action !== 'ALL') params.set('action', filters.action);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));

  const url = `${API_BASE}/audit-logs${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result;
}

export async function exportAuditLogsApi(format = 'csv', filters = {}) {
  const params = new URLSearchParams();
  params.set('format', format);
  if (filters.q) params.set('q', filters.q);
  if (filters.action && filters.action !== 'ALL') params.set('action', filters.action);

  const url = `${API_BASE}/audit-logs/export?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `rbac-audit-logs.${format.toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function getRoleSummaryReportApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.branchScope && filters.branchScope !== 'ALL') params.set('branchScope', filters.branchScope);

  const url = `${API_BASE}/reports/role-summary${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result;
}

export async function getPermissionMatrixReportApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.roleId && filters.roleId !== 'ALL') params.set('roleId', filters.roleId);
  if (filters.module && filters.module !== 'ALL') params.set('module', filters.module);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);

  const url = `${API_BASE}/reports/permission-matrix${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result;
}

export async function getRoleAssignmentReportApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.minUsers) params.set('minUsers', filters.minUsers);

  const url = `${API_BASE}/reports/role-assignment${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result;
}

export async function getInactiveRolesReportApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.branchScope && filters.branchScope !== 'ALL') params.set('branchScope', filters.branchScope);

  const url = `${API_BASE}/reports/inactive-roles${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await handleResponse(await fetch(url));
  return result;
}

export async function exportReportCsvApi(type, filters = {}) {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('format', 'csv');
  if (filters.q) params.set('q', filters.q);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.branchScope && filters.branchScope !== 'ALL') params.set('branchScope', filters.branchScope);
  if (filters.roleId && filters.roleId !== 'ALL') params.set('roleId', filters.roleId);
  if (filters.module && filters.module !== 'ALL') params.set('module', filters.module);

  const url = `${API_BASE}/reports/export?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `rbac-report-${type}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
  return true;
}

export function getClientPreference(key, defaultValue) {
  try {
    const val = localStorage.getItem(`rbac_pref_${key}`);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setClientPreference(key, value) {
  try {
    localStorage.setItem(`rbac_pref_${key}`, JSON.stringify(value));
  } catch {

  }
}
