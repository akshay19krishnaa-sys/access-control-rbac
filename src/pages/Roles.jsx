import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRANCH_SCOPES } from '../data/roles';
import {
  getRolesApi,
  createRoleApi,
  updateRoleApi,
  patchRoleStatusApi,
  cloneRoleApi,
} from '../services/api';
import RoleFormPanel from '../components/roles/RoleFormPanel';
import RoleDetailPanel from '../components/roles/RoleDetailPanel';
import ConfirmDialog from '../components/roles/ConfirmDialog';

/* ── Icons ── */
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EmptyBoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

/* Helper to get initials */
const getInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

/* Avatar background palette */
const AVATAR_COLORS = [
  '#176B87', '#1f8aa8', '#2a94b5', '#4b98cf', '#86B6F6',
  '#0891b2', '#0e7490', '#135870', '#5c9ce6'
];

function Roles() {
  /* ── State ── */
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast notification
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  }, []);

  useEffect(() => {
    let ignore = false;
    getRolesApi()
      .then((data) => {
        if (!ignore) {
          setRoles(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load roles from backend:', err);
          showToast(err.message || 'Failed to load roles from server.', 'error');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedScope, setSelectedScope] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      queueMicrotask(() => setSearchQuery(q));
    }
  }, [searchParams]);

  // Priority 3: Role list sorting state
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Active dropdown menu for actions: roleId or null
  const [activeMenuRoleId, setActiveMenuRoleId] = useState(null);

  // Modal / Panel states
  const [formPanel, setFormPanel] = useState({ isOpen: false, mode: 'create', roleData: null });
  const [detailRole, setDetailRole] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: 'activate', role: null });

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu')) {
        setActiveMenuRoleId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  /* ── Filtered, Searched & Sorted Roles ── */
  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = roles.filter((role) => {
      // Search matching role name or description
      const matchesSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        (role.description && role.description.toLowerCase().includes(query));

      // Scope match
      const matchesScope =
        selectedScope === 'all' || role.branchScope === selectedScope;

      // Status match (case-insensitive for both ACTIVE and active)
      const matchesStatus =
        selectedStatus === 'all' ||
        (role.status || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesScope && matchesStatus;
    });

    // Priority 3: Sort by Name, Users Assigned, or Created Date
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      } else if (sortField === 'usersAssigned') {
        const aCount = Number(a.usersAssigned) || 0;
        const bCount = Number(b.usersAssigned) || 0;
        comparison = aCount - bCount;
      } else if (sortField === 'createdAt') {
        const aTime = new Date(a.createdAt || a.createdDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.createdDate || 0).getTime();
        comparison = aTime - bTime;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [roles, searchQuery, selectedScope, selectedStatus, sortField, sortDirection]);

  /* ── Handlers ── */
  const handleOpenCreate = () => {
    setActiveMenuRoleId(null);
    setFormPanel({ isOpen: true, mode: 'create', roleData: null });
  };

  const handleOpenEdit = (role) => {
    setActiveMenuRoleId(null);
    setDetailRole(null);
    setFormPanel({ isOpen: true, mode: 'edit', roleData: role });
  };

  const handleOpenClone = (role) => {
    setActiveMenuRoleId(null);
    setFormPanel({ isOpen: true, mode: 'clone', roleData: role });
  };

  const handleOpenView = (role) => {
    setActiveMenuRoleId(null);
    setDetailRole(role);
  };

  const handleOpenConfirmStatus = (role, action) => {
    setActiveMenuRoleId(null);
    setConfirmDialog({ isOpen: true, action, role });
  };

  const handleConfirmStatusChange = async () => {
    const { action, role } = confirmDialog;
    if (!role) return;

    const targetStatus = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
    try {
      const updated = await patchRoleStatusApi(role.id, targetStatus);
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? updated : r))
      );

      // If detail view is open for this role, update it too
      if (detailRole && detailRole.id === role.id) {
        setDetailRole(updated);
      }

      showToast(
        `Role "${role.name}" has been ${targetStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`,
        targetStatus === 'ACTIVE' ? 'success' : 'warning'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmDialog({ isOpen: false, action: 'activate', role: null });
    }
  };

  const handleSaveForm = async (formData) => {
    const { mode, roleData } = formPanel;

    try {
      if (mode === 'create') {
        const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const created = await createRoleApi({
          ...formData,
          iconColor: randomColor,
          status: formData.status ? formData.status.toUpperCase() : 'ACTIVE',
        });
        setRoles((prev) => [created, ...prev]);
        showToast(`Role "${created.name}" created successfully in MongoDB.`);
      } else if (mode === 'clone') {
        const cloned = await cloneRoleApi(roleData.id);
        setRoles((prev) => [cloned, ...prev]);
        showToast(`Cloned role "${cloned.name}" created successfully in MongoDB.`);
      } else if (mode === 'edit') {
        const updated = await updateRoleApi(roleData.id, {
          ...formData,
          status: formData.status ? formData.status.toUpperCase() : 'ACTIVE',
        });
        setRoles((prev) =>
          prev.map((r) => (r.id === roleData.id ? updated : r))
        );
        if (detailRole && detailRole.id === roleData.id) {
          setDetailRole(updated);
        }
        showToast(`Role "${formData.name}" updated successfully.`);
      }
      setFormPanel({ isOpen: false, mode: 'create', roleData: null });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /* ── CSV Export ── */
  const handleExportCSV = () => {
    if (filteredRoles.length === 0) {
      showToast('No roles to export based on current filters.', 'warning');
      return;
    }

    const headers = [
      'Role ID',
      'Role Name',
      'Description',
      'Users Assigned',
      'Branch Scope',
      'Selected Branches',
      'Approval Level',
      'Approval Limit',
      'Status',
      'Created Date',
      'Is System',
    ];

    const rows = filteredRoles.map((r) => [
      r.id,
      r.name,
      r.description || '',
      r.usersAssigned,
      r.branchScope,
      (r.selectedBranches || []).join('; '),
      r.approvalLevel,
      r.approvalLimit !== null && r.approvalLimit !== undefined ? r.approvalLimit : 'Unlimited',
      r.status,
      r.createdDate,
      r.isSystem ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `roles_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredRoles.length} ${filteredRoles.length === 1 ? 'role' : 'roles'} to CSV.`, 'info');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedScope('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedScope !== 'all' || selectedStatus !== 'all';
  const existingRoleNames = roles.map((r) => r.name);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-header__title" id="roles-heading">Role Management</h2>
          <p className="page-header__description">
            Configure system roles, access scopes, and approval levels that govern permissions across your organisation.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreate}
            id="create-role-btn"
            aria-label="Create new role"
          >
            <PlusIcon />
            Create Role
          </button>
        </div>
      </div>

      {/* ── Toolbar: Search, Filters, Export ── */}
      <div className="roles-toolbar" role="region" aria-label="Role filters and search">
        {/* Search */}
        <div className="roles-search">
          <span className="roles-search__icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="roles-search__input"
            placeholder="Search roles by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="role-search-input"
            aria-label="Search roles"
          />
        </div>

        {/* Branch Scope Filter */}
        <select
          className="roles-filter-select"
          value={selectedScope}
          onChange={(e) => setSelectedScope(e.target.value)}
          id="scope-filter-select"
          aria-label="Filter by branch scope"
        >
          <option value="all">All Branch Scopes</option>
          {BRANCH_SCOPES.map((scope) => (
            <option key={scope.value} value={scope.value}>
              {scope.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="roles-filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          id="status-filter-select"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Clear Filters (if active) */}
        {hasActiveFilters && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleClearFilters}
            id="clear-filters-btn"
            title="Reset search and filters"
          >
            <CloseIcon />
            Clear
          </button>
        )}

        {/* CSV Export Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportCSV}
          id="export-roles-btn"
          title="Download displayed roles as CSV"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      {/* ── Table Container ── */}
      <div className="roles-table-wrap">
        <div className="roles-table-scroll">
          <table className="roles-table" aria-label="Roles list">
            <thead>
              <tr>
                {/* Role Name (Sortable) */}
                <th
                  scope="col"
                  style={{ width: '28%', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('name')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('name'); }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  title={`Click to sort by Role Name (${sortField === 'name' && sortDirection === 'asc' ? 'currently ascending' : 'click for ascending'})`}
                  id="sort-header-name"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span>Role Name</span>
                    <span
                      className="sort-indicator"
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        marginLeft: '6px',
                        color: sortField === 'name' ? '#176B87' : 'inherit',
                        opacity: sortField === 'name' ? 1 : 0.35,
                        fontWeight: sortField === 'name' ? 'bold' : 'normal',
                        fontSize: '0.75rem',
                      }}
                    >
                      {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>

                <th scope="col" style={{ width: '28%' }}>Description</th>

                {/* Users Assigned (Sortable) */}
                <th
                  scope="col"
                  className="col-center"
                  style={{ width: '12%', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('usersAssigned')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('usersAssigned'); }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortField === 'usersAssigned' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  title={`Click to sort by Users Assigned (${sortField === 'usersAssigned' && sortDirection === 'asc' ? 'currently ascending' : 'click for ascending'})`}
                  id="sort-header-users"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Users Assigned</span>
                    <span
                      className="sort-indicator"
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        marginLeft: '6px',
                        color: sortField === 'usersAssigned' ? '#176B87' : 'inherit',
                        opacity: sortField === 'usersAssigned' ? 1 : 0.35,
                        fontWeight: sortField === 'usersAssigned' ? 'bold' : 'normal',
                        fontSize: '0.75rem',
                      }}
                    >
                      {sortField === 'usersAssigned' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>

                <th scope="col" style={{ width: '14%' }}>Branch Scope</th>
                <th scope="col" style={{ width: '8%' }}>Status</th>

                {/* Created Date (Sortable) */}
                <th
                  scope="col"
                  style={{ width: '10%', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('createdAt')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('createdAt'); }}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortField === 'createdAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  title={`Click to sort by Created Date (${sortField === 'createdAt' && sortDirection === 'asc' ? 'currently ascending' : 'click for ascending'})`}
                  id="sort-header-date"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span>Created Date</span>
                    <span
                      className="sort-indicator"
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        marginLeft: '6px',
                        color: sortField === 'createdAt' ? '#176B87' : 'inherit',
                        opacity: sortField === 'createdAt' ? 1 : 0.35,
                        fontWeight: sortField === 'createdAt' ? 'bold' : 'normal',
                        fontSize: '0.75rem',
                      }}
                    >
                      {sortField === 'createdAt' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </div>
                </th>

                <th scope="col" className="col-right" style={{ width: '6%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#176B87' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>Loading roles from MongoDB database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length > 0 ? (
                filteredRoles.map((role, idx) => {
                  const isMenuOpen = activeMenuRoleId === role.id;
                  const isLastRows = idx >= filteredRoles.length - 2 && filteredRoles.length > 2;

                  return (
                    <tr key={role.id} id={`role-row-${role.id}`}>
                      {/* Role Name + Avatar + System Tag */}
                      <td>
                        <div className="role-name-cell">
                          <div
                            className="role-name-cell__icon"
                            style={{ background: role.iconColor || '#176B87' }}
                            aria-hidden="true"
                          >
                            {getInitials(role.name)}
                          </div>
                          <div className="role-name-cell__text">
                            <div className="role-name-cell__name">
                              <span>{role.name}</span>
                              {role.isSystem && (
                                <span className="role-name-cell__system-tag">System</span>
                              )}
                            </div>
                            <div className="role-name-cell__desc" title={role.id}>
                              {role.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td>
                        <div
                          className="role-name-cell__desc"
                          style={{ maxWidth: '320px' }}
                          title={role.description}
                        >
                          {role.description || <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No description</span>}
                        </div>
                      </td>

                      {/* Users Assigned */}
                      <td className="col-center">
                        <span className="users-count">
                          <UsersIcon />
                          {role.usersAssigned}
                        </span>
                      </td>

                      {/* Branch Scope */}
                      <td>
                        <span
                          className={`scope-badge ${
                            role.branchScope === 'All Branches'
                              ? 'all-branches'
                              : role.branchScope === 'Assigned Branch'
                              ? 'assigned-branch'
                              : 'selected-branches'
                          }`}
                        >
                          {role.branchScope === 'Selected Branches' && role.selectedBranches?.length
                            ? `Selected (${role.selectedBranches.length})`
                            : role.branchScope}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge ${(role.status || '').toLowerCase()}`}>
                          {(role.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td>
                        <span className="created-date">
                          {role.createdDate || (role.createdAt ? new Date(role.createdAt).toISOString().slice(0, 10) : '—')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="col-right">
                        <div className="action-menu">
                          <button
                            className="action-menu__trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRoleId(isMenuOpen ? null : role.id);
                            }}
                            aria-label={`Actions for ${role.name}`}
                            id={`action-btn-${role.id}`}
                            aria-expanded={isMenuOpen}
                          >
                            <MoreVerticalIcon />
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`action-menu__dropdown ${isLastRows ? 'drop-up' : ''}`}
                              role="menu"
                              aria-label="Role actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* View Action */}
                              <button
                                className="action-menu__item"
                                role="menuitem"
                                onClick={() => handleOpenView(role)}
                                id={`action-view-${role.id}`}
                              >
                                <EyeIcon />
                                View Details
                              </button>

                              {/* Edit Action */}
                              <button
                                className="action-menu__item"
                                role="menuitem"
                                onClick={() => !role.isSystem && handleOpenEdit(role)}
                                disabled={role.isSystem}
                                title={role.isSystem ? 'System roles cannot be edited' : 'Edit role'}
                                id={`action-edit-${role.id}`}
                              >
                                <EditIcon />
                                Edit Role
                              </button>

                              {/* Clone Action */}
                              <button
                                className="action-menu__item"
                                role="menuitem"
                                onClick={() => handleOpenClone(role)}
                                id={`action-clone-${role.id}`}
                              >
                                <CopyIcon />
                                Clone Role
                              </button>

                              <div className="action-menu__divider" />

                              {/* Activate / Deactivate Action */}
                              {(role.status || '').toLowerCase() === 'active' ? (
                                <button
                                  className="action-menu__item deactivate"
                                  role="menuitem"
                                  onClick={() => !role.isSystem && handleOpenConfirmStatus(role, 'deactivate')}
                                  disabled={role.isSystem}
                                  title={role.isSystem ? 'System roles cannot be deactivated' : 'Deactivate role'}
                                  id={`action-deactivate-${role.id}`}
                                >
                                  <PowerIcon />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  className="action-menu__item activate"
                                  role="menuitem"
                                  onClick={() => handleOpenConfirmStatus(role, 'activate')}
                                  id={`action-activate-${role.id}`}
                                >
                                  <CheckCircleIcon />
                                  Activate
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty state when filters return no results */
                <tr>
                  <td colSpan="7">
                    <div className="roles-empty">
                      <div className="roles-empty__icon" aria-hidden="true">
                        <EmptyBoxIcon />
                      </div>
                      <div className="roles-empty__title">No roles found</div>
                      <p className="roles-empty__desc">
                        No roles matched your current search and filter criteria. Try clearing or adjusting your filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: 'var(--spacing-md)' }}
                          onClick={handleClearFilters}
                          id="empty-clear-filters-btn"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="roles-table-footer">
          <div className="roles-count-text">
            Showing <strong>{filteredRoles.length}</strong> of <strong>{roles.length}</strong> total roles
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Active: <strong>{roles.filter((r) => (r.status || '').toLowerCase() === 'active').length}</strong>
            </span>
            <span>•</span>
            <span>
              Inactive: <strong>{roles.filter((r) => (r.status || '').toLowerCase() === 'inactive').length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Role Detail Slide-Over Panel ── */}
      {detailRole && (
        <RoleDetailPanel
          role={detailRole}
          onClose={() => setDetailRole(null)}
          onEdit={(role) => handleOpenEdit(role)}
        />
      )}

      {/* ── Role Form Slide-Over Panel (Create / Edit / Clone) ── */}
      {formPanel.isOpen && (
        <RoleFormPanel
          mode={formPanel.mode}
          roleData={formPanel.roleData}
          existingNames={existingRoleNames}
          onSave={handleSaveForm}
          onClose={() => setFormPanel({ isOpen: false, mode: 'create', roleData: null })}
        />
      )}

      {/* ── Confirm Activate/Deactivate Dialog ── */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          action={confirmDialog.action}
          role={confirmDialog.role}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => setConfirmDialog({ isOpen: false, action: 'activate', role: null })}
        />
      )}

      {/* ── Feedback Toast ── */}
      {toast && (
        <div className="toast-container" aria-live="polite">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast__icon">
              {toast.type === 'success' ? (
                <CheckCircleIcon />
              ) : (
                <PowerIcon />
              )}
            </span>
            <span>{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
