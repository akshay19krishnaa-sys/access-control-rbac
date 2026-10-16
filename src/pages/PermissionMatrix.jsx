import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MODULES,
  PERMISSION_ACTIONS,
  isActionApplicable,
  createEmptyRolePermissions,
} from '../data/permissions';
import {
  getRolesApi,
  getPermissionsApi,
  updateRolePermissionsApi,
  getClientPreference,
  setClientPreference,
} from '../services/api';

const ModuleIcons = {
  dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  customers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  membership: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  savings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3z" />
      <circle cx="15.5" cy="9.5" r=".5" fill="currentColor" />
    </svg>
  ),
  rd: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  loan: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="9" />
      <line x1="10" y1="18" x2="10" y2="9" />
      <line x1="14" y1="18" x2="14" y2="9" />
      <line x1="18" y1="18" x2="18" y2="9" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  chitty: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="m7 6 5 5" />
      <path d="m17 17 2 2" />
    </svg>
  ),
  reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
};

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const CheckAllIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClearAllIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  return parts.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

const TOTAL_APPLICABLE_SLOTS = MODULES.reduce((sum, mod) => sum + mod.applicable.length, 0);

function PermissionMatrix() {
  const [searchParams] = useSearchParams();
  const urlRoleId = searchParams.get('roleId');

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedRoleId, setSelectedRoleId] = useState(urlRoleId || '');
  const [currentRolePerms, setCurrentRolePerms] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchModule, setSearchModule] = useState('');

  const [pendingRoleId, setPendingRoleId] = useState(null);

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
    async function loadData() {
      try {
        setLoading(true);
        const [rolesData, permsData] = await Promise.all([
          getRolesApi(),
          getPermissionsApi(),
        ]);

        setRoles(rolesData);

        const matrix = permsData?.matrix || {};

        rolesData.forEach((r) => {
          const rId = r.id || r._id;
          if (!matrix[rId]) {
            matrix[rId] = r.permissions || createEmptyRolePermissions();
          }
        });
        setAllPermissions(matrix);

        const preferredId = getClientPreference('selected_role_id', null);
        const targetRole =
          (urlRoleId && rolesData.find((r) => (r.id || r._id) === urlRoleId)) ||
          rolesData.find((r) => (r.id || r._id) === preferredId) ||
          rolesData[0];

        if (targetRole) {
          const targetId = targetRole.id || targetRole._id;
          setSelectedRoleId(targetId);
          const initialPerms =
            matrix[targetId] || targetRole.permissions || createEmptyRolePermissions();
          setCurrentRolePerms(initialPerms);
        }
      } catch (err) {
        console.error('Failed to load matrix data from backend:', err);
        showToast(err.message || 'Failed to connect to backend server.', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [showToast, urlRoleId]);

  useEffect(() => {
    if (urlRoleId && roles.length > 0 && urlRoleId !== selectedRoleId) {
      const match = roles.find((r) => (r.id || r._id) === urlRoleId);
      if (match) {
        queueMicrotask(() => {
          setSelectedRoleId(urlRoleId);
          setCurrentRolePerms(allPermissions[urlRoleId] || match.permissions || createEmptyRolePermissions());
        });
      }
    }
  }, [urlRoleId, roles, allPermissions, selectedRoleId]);

  const currentRole = useMemo(() => {
    return (
      roles.find((r) => (r.id || r._id) === selectedRoleId) ||
      roles[0] ||
      {}
    );
  }, [roles, selectedRoleId]);

  const isSystemAdmin = useMemo(() => {
    if (!currentRole) return false;
    return Boolean(
      currentRole.isSystem ||
      (currentRole.name && currentRole.name.trim().toLowerCase() === 'system administrator')
    );
  }, [currentRole]);

  const savedRolePerms = useMemo(() => {
    return allPermissions[selectedRoleId] || createEmptyRolePermissions();
  }, [allPermissions, selectedRoleId]);

  const isDirty = useMemo(() => {
    return JSON.stringify(currentRolePerms) !== JSON.stringify(savedRolePerms);
  }, [currentRolePerms, savedRolePerms]);

  const activeCount = useMemo(() => {
    let count = 0;
    MODULES.forEach((mod) => {
      mod.applicable.forEach((actionId) => {
        if (currentRolePerms[mod.id]?.[actionId]) count++;
      });
    });
    return count;
  }, [currentRolePerms]);

  const activePercent = Math.round((activeCount / TOTAL_APPLICABLE_SLOTS) * 100);

  const filteredModules = useMemo(() => {
    const q = searchModule.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        m.description.toLowerCase().includes(q)
    );
  }, [searchModule]);

  const switchRole = (newRoleId) => {
    setSelectedRoleId(newRoleId);
    setClientPreference('selected_role_id', newRoleId);
    const rolePerms = allPermissions[newRoleId] || createEmptyRolePermissions();
    setCurrentRolePerms(rolePerms);
    setPendingRoleId(null);
  };

  const handleRoleSelectChange = (e) => {
    const targetId = e.target.value;
    if (targetId === selectedRoleId) return;

    if (isDirty) {

      setPendingRoleId(targetId);
    } else {
      switchRole(targetId);
    }
  };

  const handleToggle = (moduleId, actionId) => {
    if (isSystemAdmin) return;
    if (!isActionApplicable(moduleId, actionId)) return;

    setCurrentRolePerms((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [actionId]: !prev[moduleId]?.[actionId],
      },
    }));
  };

  const handleToggleRow = (moduleId) => {
    if (isSystemAdmin) return;
    const mod = MODULES.find((m) => m.id === moduleId);
    if (!mod) return;

    const row = currentRolePerms[moduleId] || {};
    const allApplicableAreTrue = mod.applicable.every((act) => row[act] === true);
    const targetState = !allApplicableAreTrue;

    setCurrentRolePerms((prev) => {
      const updatedRow = { ...prev[moduleId] };
      mod.applicable.forEach((act) => {
        updatedRow[act] = targetState;
      });
      return { ...prev, [moduleId]: updatedRow };
    });
  };

  const handleToggleColumn = (actionId) => {
    if (isSystemAdmin) return;

    const allApplicableAreTrue = MODULES.filter((m) => m.applicable.includes(actionId)).every(
      (m) => currentRolePerms[m.id]?.[actionId] === true
    );
    const targetState = !allApplicableAreTrue;

    setCurrentRolePerms((prev) => {
      const next = { ...prev };
      MODULES.forEach((mod) => {
        if (mod.applicable.includes(actionId)) {
          next[mod.id] = {
            ...next[mod.id],
            [actionId]: targetState,
          };
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isSystemAdmin) return;
    setCurrentRolePerms((prev) => {
      const next = { ...prev };
      MODULES.forEach((mod) => {
        next[mod.id] = { ...next[mod.id] };
        mod.applicable.forEach((act) => {
          next[mod.id][act] = true;
        });
      });
      return next;
    });
    showToast('All applicable permissions selected.', 'info');
  };

  const handleClearAll = () => {
    if (isSystemAdmin) return;
    setCurrentRolePerms((prev) => {
      const next = { ...prev };
      MODULES.forEach((mod) => {
        next[mod.id] = { ...next[mod.id] };
        mod.applicable.forEach((act) => {
          next[mod.id][act] = false;
        });
      });
      return next;
    });
    showToast('All permissions cleared for this role.', 'warning');
  };

  const handleReset = () => {
    if (isSystemAdmin) return;
    setCurrentRolePerms(savedRolePerms);
    showToast('Changes discarded. Reset to saved state.', 'info');
  };

  const handleSave = async () => {
    if (isSystemAdmin) {
      showToast('Permissions for System Administrator are protected and cannot be modified.', 'warning');
      return;
    }
    if (activeCount === 0) {
      showToast('Every role must have at least one permission assigned. Zero permissions are not allowed.', 'error');
      return;
    }
    try {
      await updateRolePermissionsApi(selectedRoleId, currentRolePerms);
      const updated = {
        ...allPermissions,
        [selectedRoleId]: currentRolePerms,
      };
      setAllPermissions(updated);
      showToast(`Permissions for "${currentRole.name || 'role'}" saved successfully in MongoDB.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save permissions to server.', 'error');
    }
  };

  const handleModalSaveAndSwitch = async () => {
    if (isSystemAdmin || activeCount === 0) {
      showToast('Cannot save invalid permissions. Discarding or correcting is required.', 'error');
      return;
    }
    try {
      await updateRolePermissionsApi(selectedRoleId, currentRolePerms);
      const updated = {
        ...allPermissions,
        [selectedRoleId]: currentRolePerms,
      };
      setAllPermissions(updated);
      showToast(`Saved changes for "${currentRole.name || 'role'}".`, 'success');
      switchRole(pendingRoleId);
    } catch (err) {
      showToast(err.message || 'Failed to save permissions.', 'error');
    }
  };

  const handleModalDiscardAndSwitch = () => {
    showToast('Unsaved changes discarded.', 'info');
    switchRole(pendingRoleId);
  };

  const handleModalCancel = () => {
    setPendingRoleId(null);
  };

  return (
    <div>

      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-header__title" id="matrix-heading">Permission Matrix</h2>
          <p className="page-header__description">
            Define granular module capabilities (View, Create, Edit, Delete, Approve, Export) for each role.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            disabled={isSystemAdmin || !isDirty}
            title={isSystemAdmin ? 'System Administrator permissions are locked' : 'Reset to last saved permissions'}
            id="matrix-reset-btn"
          >
            <ResetIcon />
            Reset
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSystemAdmin || !isDirty || activeCount === 0}
            title={
              isSystemAdmin
                ? 'System Administrator permissions are permanently locked'
                : activeCount === 0
                ? 'Every role must have at least one permission'
                : !isDirty
                ? 'No unsaved changes'
                : 'Save permissions to database'
            }
            id="matrix-save-btn"
          >
            <SaveIcon />
            Save Permissions
          </button>
        </div>
      </div>

      {isSystemAdmin && (
        <div
          className="matrix-protected-banner"
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'rgba(23, 107, 135, 0.12)',
            border: '1px solid rgba(23, 107, 135, 0.4)',
            color: '#051923',
            marginBottom: '18px',
          }}
          id="matrix-protected-banner"
        >
          <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🔒</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#176B87' }}>
              Protected System Role: System Administrator
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#406882', marginTop: '2px' }}>
              Permissions for the System Administrator are permanently locked to full access and protected against modification or reduction according to privilege-escalation security rules.
            </div>
          </div>
        </div>
      )}

      {!isSystemAdmin && activeCount === 0 && (
        <div
          className="matrix-warning-banner"
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#991b1b',
            marginBottom: '18px',
          }}
          id="matrix-zero-perm-banner"
        >
          <span style={{ fontSize: '1.4rem' }} aria-hidden="true">⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Minimum Permission Required
            </div>
            <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
              Every role must have at least one permission assigned. All permissions have been cleared — the Save button is disabled until at least one permission is selected.
            </div>
          </div>
        </div>
      )}

      {isDirty && !isSystemAdmin && (
        <div className="matrix-unsaved-banner" role="alert">
          <div className="matrix-unsaved-banner__left">
            <span className="matrix-unsaved-dot" aria-hidden="true" />
            <span className="matrix-unsaved-banner__text">
              You have unsaved changes for <strong>{currentRole?.name || 'this role'}</strong>.
            </span>
          </div>
          <div className="matrix-unsaved-banner__actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              id="banner-discard-btn"
            >
              Discard Changes
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={activeCount === 0}
              id="banner-save-btn"
            >
              <SaveIcon />
              Save Now
            </button>
          </div>
        </div>
      )}

      <div className="matrix-role-card">
        <div className="matrix-role-card__left">
          <div
            className="matrix-role-card__avatar"
            style={{ background: currentRole?.iconColor || '#176B87' }}
            aria-hidden="true"
          >
            {getInitials(currentRole?.name)}
          </div>
          <div className="matrix-role-card__info">
            <span className="matrix-role-card__label">Configuring Role</span>
            <div className="matrix-role-select-wrap">
              <select
                className="matrix-role-select"
                value={selectedRoleId}
                onChange={handleRoleSelectChange}
                aria-label="Select role to configure permissions"
                id="matrix-role-selector"
              >
                {roles.length === 0 ? (
                  <option value="">{loading ? 'Loading roles...' : 'No roles available'}</option>
                ) : (
                  roles.map((r) => {
                    const rId = r.id || r._id;
                    return (
                      <option key={rId} value={rId}>
                        {r.name} {r.isSystem ? '(System)' : ''} — {r.usersAssigned || 0} users
                      </option>
                    );
                  })
                )}
              </select>

              <div className="matrix-role-badge-group">
                {currentRole?.isSystem && (
                  <span className="role-name-cell__system-tag">System</span>
                )}
                {currentRole?.branchScope && (
                  <span
                    className={`scope-badge ${
                      currentRole.branchScope === 'All Branches'
                        ? 'all-branches'
                        : currentRole.branchScope === 'Assigned Branch'
                        ? 'assigned-branch'
                        : 'selected-branches'
                    }`}
                  >
                    {currentRole.branchScope}
                  </span>
                )}
                {currentRole?.status && (
                  <span className={`status-badge ${(currentRole.status || '').toLowerCase()}`}>
                    {(currentRole.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="matrix-role-card__stats">
          <div className="matrix-stat-box">
            <span className="matrix-stat-box__label">Access Coverage</span>
            <span className="matrix-stat-box__value">
              {activeCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#406882' }}>/ {TOTAL_APPLICABLE_SLOTS}</span>
            </span>
            <div className="matrix-progress-bar-wrap" title={`${activePercent}% of permissions enabled`}>
              <div className="matrix-progress-bar-fill" style={{ width: `${activePercent}%` }} />
            </div>
          </div>

          <div className="matrix-stat-box">
            <span className="matrix-stat-box__label">Approval Authority</span>
            <span className="matrix-stat-box__value" style={{ fontSize: '1rem', color: '#176B87' }}>
              {currentRole?.approvalLevel === 0
                ? 'Level 0 (None)'
                : currentRole?.approvalLevel
                ? `Level ${currentRole.approvalLevel}`
                : '—'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#406882' }}>
              {currentRole?.approvalLimit
                ? `$${Number(currentRole.approvalLimit).toLocaleString()} limit`
                : currentRole?.name
                ? 'No Limit / Unlimited'
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="matrix-toolbar">
        <div className="matrix-toolbar__left">

          <div className="matrix-search">
            <span className="matrix-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="matrix-search__input"
              placeholder="Filter modules..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              id="matrix-module-search"
              aria-label="Filter modules"
            />
          </div>

          {searchModule && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchModule('')}
              title="Clear search"
            >
              <CloseIcon />
              Clear
            </button>
          )}
        </div>

        <div className="matrix-toolbar__right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSelectAll}
            disabled={isSystemAdmin}
            id="matrix-select-all-btn"
            title={isSystemAdmin ? 'System Administrator permissions are locked' : 'Grant all applicable permissions for this role'}
          >
            <CheckAllIcon />
            Select All
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleClearAll}
            disabled={isSystemAdmin}
            id="matrix-clear-all-btn"
            title={isSystemAdmin ? 'System Administrator permissions are locked' : 'Revoke all permissions for this role'}
          >
            <ClearAllIcon />
            Clear All
          </button>
        </div>
      </div>

      <div className="matrix-table-wrap">
        <div className="matrix-table-scroll">
          <table className="matrix-table" aria-label="Permission Matrix Table">
            <thead>
              <tr>
                <th scope="col" className="col-module">
                  Module
                </th>
                {PERMISSION_ACTIONS.map((action) => (
                  <th key={action.id} scope="col">
                    <button
                      type="button"
                      className="matrix-col-header-btn"
                      onClick={() => handleToggleColumn(action.id)}
                      disabled={isSystemAdmin}
                      title={isSystemAdmin ? 'System Administrator permissions are locked' : `Toggle "${action.label}" across all applicable modules`}
                      aria-label={`Toggle all ${action.label} permissions`}
                      id={`toggle-col-${action.id}`}
                    >
                      <span>{action.label}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="matrix-col-header-icon">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#176B87' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>Loading permission matrix from MongoDB database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredModules.length > 0 ? (
                filteredModules.map((mod) => {
                  const IconComp = ModuleIcons[mod.id] || ModuleIcons.dashboard;
                  const rowPerms = currentRolePerms[mod.id] || {};

                  return (
                    <tr key={mod.id} id={`matrix-row-${mod.id}`}>

                      <td className="col-module-cell">
                        <div className="matrix-module-info">
                          <div className="matrix-module-header">
                            <div className="matrix-module-icon-wrap" aria-hidden="true">
                              <IconComp />
                            </div>
                            <div>
                              <div className="matrix-module-name">{mod.name}</div>
                              <div className="matrix-module-desc">{mod.description}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="matrix-row-toggle-btn"
                            onClick={() => handleToggleRow(mod.id)}
                            disabled={isSystemAdmin}
                            title={isSystemAdmin ? 'System Administrator permissions are locked' : `Toggle all permissions for ${mod.name}`}
                            id={`toggle-row-${mod.id}`}
                          >
                            Toggle Row
                          </button>
                        </div>
                      </td>

                      {PERMISSION_ACTIONS.map((action) => {
                        const applicable = isActionApplicable(mod.id, action.id);
                        const isGranted = Boolean(rowPerms[action.id]);

                        return (
                          <td key={action.id}>
                            {applicable ? (
                              <label className="perm-control" title={`${action.label} on ${mod.name}: ${isGranted ? 'Granted' : 'Denied'}`}>
                                <input
                                  type="checkbox"
                                  className="perm-checkbox"
                                  checked={isGranted}
                                  disabled={isSystemAdmin}
                                  onChange={() => handleToggle(mod.id, action.id)}
                                  aria-label={`${action.label} permission for ${mod.name}`}
                                  id={`perm-${mod.id}-${action.id}`}
                                />
                              </label>
                            ) : (
                              <span
                                className="perm-na-cell"
                                title="Not applicable for this module"
                                aria-label="Not applicable"
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#406882' }}>
                    No modules match <strong>"{searchModule}"</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="matrix-table-footer">
          <div className="matrix-legend">
            <div className="matrix-legend-item">
              <span className="matrix-legend-dot granted" />
              <span>Granted Permission</span>
            </div>
            <div className="matrix-legend-item">
              <span className="matrix-legend-dot denied" />
              <span>Denied / Inactive</span>
            </div>
            <div className="matrix-legend-item">
              <span className="matrix-legend-dot na">—</span>
              <span>Not Applicable</span>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#406882', fontWeight: 600 }}>
            Showing {filteredModules.length} of {MODULES.length} modules
          </div>
        </div>
      </div>

      {pendingRoleId && (
        <div
          className="matrix-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
        >
          <div className="matrix-modal">
            <h3 className="matrix-modal__title" id="unsaved-modal-title">
              Unsaved Permission Changes
            </h3>
            <p className="matrix-modal__body">
              You have modified permissions for <strong>{currentRole?.name || 'this role'}</strong> that have not been saved yet.
              Would you like to save your changes before switching roles?
            </p>
            <div className="matrix-modal__actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleModalCancel}
                id="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleModalDiscardAndSwitch}
                id="modal-discard-btn"
              >
                Discard & Switch
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleModalSaveAndSwitch}
                id="modal-save-btn"
              >
                <SaveIcon />
                Save & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container" aria-live="polite">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast__icon">
              <CheckAllIcon />
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

export default PermissionMatrix;
