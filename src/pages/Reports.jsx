
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getRoleSummaryReportApi,
  getPermissionMatrixReportApi,
  getRoleAssignmentReportApi,
  getInactiveRolesReportApi,
  exportReportCsvApi,
} from '../services/api';
import { BRANCH_SCOPES } from '../data/roles';
import { MODULES } from '../data/permissions';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} style={spinning ? { animation: 'spin 1s linear infinite' } : {}}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CheckIcon = () => (
  <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem' }} title="Granted">✓</span>
);

const CrossIcon = () => (
  <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.9rem' }} title="Denied">✕</span>
);

const DashIcon = () => (
  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }} title="Not Applicable">—</span>
);

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const [summaryData, setSummaryData] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [assignmentData, setAssignmentData] = useState([]);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [inactiveData, setInactiveData] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('ALL');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchReportData = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        if (activeTab === 'summary') {
          const res = await getRoleSummaryReportApi({
            q: searchQuery,
            status: statusFilter,
            branchScope: scopeFilter,
          });
          if (!ignore) setSummaryData(res.data || []);
        } else if (activeTab === 'matrix') {
          const res = await getPermissionMatrixReportApi({
            roleId: selectedRoleFilter,
            module: selectedModuleFilter,
            status: statusFilter,
          });
          if (!ignore) setMatrixData(res.data || []);
        } else if (activeTab === 'assignment') {
          const res = await getRoleAssignmentReportApi({
            q: searchQuery,
          });
          if (!ignore) {
            setAssignmentData(res.data || []);
            if (res.notice) setAssignmentNotice(res.notice);
          }
        } else if (activeTab === 'inactive') {
          const res = await getInactiveRolesReportApi({
            q: searchQuery,
            branchScope: scopeFilter,
          });
          if (!ignore) setInactiveData(res.data || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load report:', err);
          showToast(err.message || 'Failed to load report from server.', 'error');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, searchQuery, statusFilter, scopeFilter, selectedRoleFilter, selectedModuleFilter, refreshTrigger, showToast]);

  const filteredAssignmentData = useMemo(() => {
    return assignmentData.filter((r) => {
      if (assignmentFilter === 'ASSIGNED') return (r.usersAssigned || 0) > 0;
      if (assignmentFilter === 'UNASSIGNED') return (r.usersAssigned || 0) === 0;
      return true;
    });
  }, [assignmentData, assignmentFilter]);

  const matrixRoleOptions = useMemo(() => {
    const map = new Map();
    matrixData.forEach((row) => {
      if (!map.has(row.roleId)) {
        map.set(row.roleId, row.roleName);
      }
    });
    return Array.from(map.entries());
  }, [matrixData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReportCsvApi(activeTab, {
        q: searchQuery,
        status: statusFilter,
        branchScope: scopeFilter,
        roleId: selectedRoleFilter,
        module: selectedModuleFilter,
      });
      showToast(`Exported ${activeTab.toUpperCase()} report to CSV successfully.`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast(err.message || 'Failed to export report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setScopeFilter('ALL');
    setSelectedRoleFilter('ALL');
    setSelectedModuleFilter('ALL');
    setAssignmentFilter('ALL');
  };

  return (
    <div className="reports-page">

      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-header__title" id="reports-heading">Reports & Exports</h2>
          <p className="page-header__description">
            Audit compliance, role configurations, permission matrix distribution, and dormant roles across your organization.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchReportData}
            disabled={loading}
            title="Refresh current report data"
            id="report-refresh-btn"
          >
            <RefreshIcon spinning={loading} />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={loading || exporting}
            title="Download report data as CSV"
            id="report-export-btn"
          >
            <DownloadIcon />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Compliance Reports" style={{ marginBottom: '20px' }}>
        <button
          className={`settings-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          id="tab-role-summary"
          role="tab"
          aria-selected={activeTab === 'summary'}
          onClick={() => { setActiveTab('summary'); handleClearFilters(); }}
        >
          <span>📋</span> Role Summary Report
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          id="tab-permission-matrix"
          role="tab"
          aria-selected={activeTab === 'matrix'}
          onClick={() => { setActiveTab('matrix'); handleClearFilters(); }}
        >
          <span>🛡️</span> Permission Matrix Report
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}
          id="tab-role-assignment"
          role="tab"
          aria-selected={activeTab === 'assignment'}
          onClick={() => { setActiveTab('assignment'); handleClearFilters(); }}
        >
          <span>👥</span> Role Assignment Report
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
          id="tab-inactive-roles"
          role="tab"
          aria-selected={activeTab === 'inactive'}
          onClick={() => { setActiveTab('inactive'); handleClearFilters(); }}
        >
          <span>⏸️</span> Inactive Roles Report
        </button>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            color: toast.type === 'error' ? '#991b1b' : '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      <div className="roles-toolbar" role="region" aria-label="Report filters" style={{ marginBottom: '18px' }}>

        {activeTab !== 'matrix' && (
          <div className="roles-search">
            <span className="roles-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="roles-search__input"
              placeholder={`Search ${activeTab === 'inactive' ? 'inactive roles' : 'roles'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="report-search-input"
              aria-label="Search report"
            />
          </div>
        )}

        {activeTab === 'matrix' && (
          <>
            <select
              className="roles-filter-select"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              id="matrix-filter-role"
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles ({matrixRoleOptions.length})</option>
              {matrixRoleOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select
              className="roles-filter-select"
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              id="matrix-filter-module"
              aria-label="Filter by module"
            >
              <option value="ALL">All Modules ({MODULES.length})</option>
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </>
        )}

        {(activeTab === 'summary' || activeTab === 'matrix') && (
          <select
            className="roles-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="report-status-filter"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        )}

        {(activeTab === 'summary' || activeTab === 'inactive') && (
          <select
            className="roles-filter-select"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            id="report-scope-filter"
            aria-label="Filter by branch scope"
          >
            <option value="ALL">All Branch Scopes</option>
            {BRANCH_SCOPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}

        {activeTab === 'assignment' && (
          <select
            className="roles-filter-select"
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            id="report-assignment-filter"
            aria-label="Filter by assignment status"
          >
            <option value="ALL">All Roles</option>
            <option value="ASSIGNED">Roles with Users Assigned</option>
            <option value="UNASSIGNED">Roles with Zero Users</option>
          </select>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleClearFilters}
          id="report-clear-filters-btn"
          title="Clear search and filters"
        >
          Reset Filters
        </button>
      </div>

      {activeTab === 'summary' && (
        <div className="roles-table-wrap">
          <div className="roles-table-scroll">
            <table className="roles-table" aria-label="Role Summary Report">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '22%' }}>Role Name</th>
                  <th scope="col" style={{ width: '26%' }}>Description</th>
                  <th scope="col" style={{ width: '10%' }}>Status</th>
                  <th scope="col" style={{ width: '14%' }}>Branch Scope</th>
                  <th scope="col" className="col-center" style={{ width: '10%' }}>Users</th>
                  <th scope="col" style={{ width: '10%' }}>Authority</th>
                  <th scope="col" style={{ width: '8%' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#176B87' }}>
                      Loading Role Summary Report from MongoDB...
                    </td>
                  </tr>
                ) : summaryData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No roles match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  summaryData.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{role.name}</span>
                          {role.isSystem && <span className="role-name-cell__system-tag">System</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                          {role.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No description</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${(role.status || '').toLowerCase()}`}>
                          {role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className="scope-badge assigned-branch">{role.branchScope}</span>
                      </td>
                      <td className="col-center">
                        <span className="users-count">{role.usersAssigned}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>
                          {role.approvalLevel > 0 ? `Level ${role.approvalLevel}` : 'Level 0'}
                          {role.approvalLimit && <div style={{ fontSize: '0.75rem', color: '#406882' }}>${Number(role.approvalLimit).toLocaleString()}</div>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {role.createdAt ? new Date(role.createdAt).toISOString().slice(0, 10) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 18px', fontSize: '0.8125rem', color: '#406882', fontWeight: 600, borderTop: '1px solid var(--color-border)' }}>
            Showing {summaryData.length} role records
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="roles-table-wrap">
          <div className="roles-table-scroll">
            <table className="roles-table" aria-label="Permission Matrix Report">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '22%' }}>Role Name</th>
                  <th scope="col" style={{ width: '18%' }}>Module</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>View</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>Create</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>Edit</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>Delete</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>Approve</th>
                  <th scope="col" className="col-center" style={{ width: '9%' }}>Export</th>
                  <th scope="col" className="col-center" style={{ width: '6%' }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: '#176B87' }}>
                      Loading Permission Matrix Report from MongoDB...
                    </td>
                  </tr>
                ) : matrixData.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No permission matrix entries match your filters.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((row, idx) => (
                    <tr key={`${row.roleId}-${row.moduleId}-${idx}`}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{row.roleName}</span>
                        {row.isSystem && <span className="role-name-cell__system-tag" style={{ marginLeft: '6px' }}>System</span>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.moduleName}</span>
                      </td>
                      <td className="col-center">
                        {row.actions.view === 'GRANTED' ? <CheckIcon /> : row.actions.view === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        {row.actions.create === 'GRANTED' ? <CheckIcon /> : row.actions.create === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        {row.actions.edit === 'GRANTED' ? <CheckIcon /> : row.actions.edit === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        {row.actions.delete === 'GRANTED' ? <CheckIcon /> : row.actions.delete === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        {row.actions.approve === 'GRANTED' ? <CheckIcon /> : row.actions.approve === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        {row.actions.export === 'GRANTED' ? <CheckIcon /> : row.actions.export === 'DENIED' ? <CrossIcon /> : <DashIcon />}
                      </td>
                      <td className="col-center">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#176B87' }}>
                          {row.grantedCount}/{row.totalApplicable}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 18px', fontSize: '0.8125rem', color: '#406882', fontWeight: 600, borderTop: '1px solid var(--color-border)' }}>
            Displaying {matrixData.length} role-module permission pairs
          </div>
        </div>
      )}

      {activeTab === 'assignment' && (
        <div>

          <div
            role="note"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'rgba(23, 107, 135, 0.08)',
              border: '1px solid rgba(23, 107, 135, 0.3)',
              color: '#051923',
              marginBottom: '18px',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#176B87' }}>
                Role Assignment Governance & Dependency Note
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#406882', marginTop: '2px' }}>
                {assignmentNotice || 'Individual user identities, accounts, and credentials are governed externally in User Management (PDD-003). Aggregated user counts per role are tracked above based on active ERP role memberships.'}
              </div>
            </div>
          </div>

          <div className="roles-table-wrap">
            <div className="roles-table-scroll">
              <table className="roles-table" aria-label="Role Assignment Report">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '24%' }}>Role Name</th>
                    <th scope="col" style={{ width: '12%' }}>Type</th>
                    <th scope="col" style={{ width: '12%' }}>Status</th>
                    <th scope="col" style={{ width: '16%' }}>Branch Scope</th>
                    <th scope="col" className="col-center" style={{ width: '14%' }}>Users Assigned</th>
                    <th scope="col" className="col-center" style={{ width: '10%' }}>Share (%)</th>
                    <th scope="col" style={{ width: '12%' }}>Identity Source</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#176B87' }}>
                        Loading Role Assignment Report from MongoDB...
                      </td>
                    </tr>
                  ) : filteredAssignmentData.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        No roles match the specified assignment filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignmentData.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{r.name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: '#406882', fontWeight: 500 }}>
                            {r.isSystem ? 'System Template' : 'Custom Defined'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${(r.status || '').toLowerCase()}`}>
                            {r.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="scope-badge assigned-branch">{r.branchScope}</span>
                        </td>
                        <td className="col-center">
                          <span className="users-count" style={{ fontWeight: 700 }}>{r.usersAssigned}</span>
                        </td>
                        <td className="col-center">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '48px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${r.userSharePercent}%`, height: '100%', background: '#176B87' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.userSharePercent}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PDD-003 (External)</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 18px', fontSize: '0.8125rem', color: '#406882', fontWeight: 600, borderTop: '1px solid var(--color-border)' }}>
              Total Assigned User Base: {assignmentData.reduce((sum, r) => sum + (r.usersAssigned || 0), 0)} users across {filteredAssignmentData.length} roles
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inactive' && (
        <div>

          <div
            role="note"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#991b1b',
              marginBottom: '18px',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⏸️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Inactive & Decommissioned Role Compliance
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                Per Sections 17 & 18 of the Access Control Specification, inactive roles cannot be assigned to users and cannot execute permissions. Ensure zero active users are linked before deactivation.
              </div>
            </div>
          </div>

          <div className="roles-table-wrap">
            <div className="roles-table-scroll">
              <table className="roles-table" aria-label="Inactive Roles Report">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '24%' }}>Role Name</th>
                    <th scope="col" style={{ width: '26%' }}>Description</th>
                    <th scope="col" style={{ width: '16%' }}>Branch Scope</th>
                    <th scope="col" style={{ width: '12%' }}>Approval Level</th>
                    <th scope="col" className="col-center" style={{ width: '10%' }}>Users</th>
                    <th scope="col" style={{ width: '12%' }}>Deactivated Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#176B87' }}>
                        Loading Inactive Roles Report from MongoDB...
                      </td>
                    </tr>
                  ) : inactiveData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        No inactive roles found. All defined roles are currently active.
                      </td>
                    </tr>
                  ) : (
                    inactiveData.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{r.name}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '320px' }}>
                            {r.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No description</span>}
                          </div>
                        </td>
                        <td>
                          <span className="scope-badge selected-branches">{r.branchScope}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem' }}>{r.approvalLevel > 0 ? `Level ${r.approvalLevel}` : 'Level 0'}</span>
                        </td>
                        <td className="col-center">
                          <span className="users-count" style={r.usersAssigned > 0 ? { color: '#dc2626', fontWeight: 700 } : {}}>
                            {r.usersAssigned}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                            {r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 18px', fontSize: '0.8125rem', color: '#406882', fontWeight: 600, borderTop: '1px solid var(--color-border)' }}>
              Showing {inactiveData.length} inactive role records
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
