
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const getInitials = (name) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const formatDate = (str) =>
  new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const SCOPE_CONFIG = {
  'All Branches':      { className: 'scope-badge all-branches',      label: 'All Branches'      },
  'Assigned Branch':   { className: 'scope-badge assigned-branch',   label: 'Assigned Branch'   },
  'Selected Branches': { className: 'scope-badge selected-branches', label: 'Selected Branches' },
};

function RoleDetailPanel({ role, onClose, onEdit }) {
  const scopeConf = SCOPE_CONFIG[role.branchScope] || { className: 'scope-badge', label: role.branchScope };
  const initials  = getInitials(role.name);

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="slide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
      >

        <div className="slide-panel__header">
          <div className="slide-panel__title-group">
            <span className="slide-panel__title" id="detail-panel-title">Role Details</span>
            <span className="slide-panel__subtitle">Read-only view</span>
          </div>
          <button className="slide-panel__close" onClick={onClose} aria-label="Close panel">
            <CloseIcon />
          </button>
        </div>

        <div className="slide-panel__body">

          <div className="detail-hero">
            <div className="detail-hero__icon" style={{ background: role.iconColor }} aria-hidden="true">
              {initials}
            </div>
            <div>
              <div className="detail-hero__name">
                {role.name}
                {role.isSystem && (
                  <span className="role-name-cell__system-tag">System</span>
                )}
                <span className={`status-badge ${role.status}`}>
                  {role.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-hero__id">{role.id}</div>
            </div>
          </div>

          <div className="detail-section">
            <div className="form-section-title">Basic Information</div>

            <div className="detail-field">
              <div className="detail-field__label">Description</div>
              <div className="detail-field__value" style={{ color: 'var(--color-text-secondary)' }}>
                {role.description || (
                  <span className="detail-field__value is-muted">No description provided.</span>
                )}
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <div className="detail-field" style={{ flex: 1, minWidth: '140px' }}>
                <div className="detail-field__label">Users Assigned</div>
                <div className="detail-field__value">
                  {role.usersAssigned} {role.usersAssigned === 1 ? 'user' : 'users'}
                </div>
              </div>
              <div className="detail-field" style={{ flex: 1, minWidth: '140px' }}>
                <div className="detail-field__label">Created Date</div>
                <div className="detail-field__value is-mono">{formatDate(role.createdDate)}</div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="form-section-title">Access Scope</div>

            <div className="detail-field">
              <div className="detail-field__label">Branch Scope</div>
              <span className={scopeConf.className}>{scopeConf.label}</span>
            </div>

            {role.branchScope === 'Selected Branches' && role.selectedBranches.length > 0 && (
              <div className="detail-field">
                <div className="detail-field__label">
                  Assigned Branches ({role.selectedBranches.length})
                </div>
                <div className="branch-tags">
                  {role.selectedBranches.map((b) => (
                    <span key={b} className="branch-tag">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="detail-section">
            <div className="form-section-title">Approval Configuration</div>

            <div className="flex gap-6 flex-wrap">
              <div className="detail-field" style={{ flex: 1, minWidth: '140px' }}>
                <div className="detail-field__label">Approval Level</div>
                <div className="detail-field__value">
                  {role.approvalLevel === 0
                    ? 'Level 0 — No Authority'
                    : `Level ${role.approvalLevel}`}
                </div>
              </div>
              <div className="detail-field" style={{ flex: 1, minWidth: '140px' }}>
                <div className="detail-field__label">Approval Limit</div>
                <div className="detail-field__value">
                  {role.approvalLimit !== null && role.approvalLimit !== undefined
                    ? `$${Number(role.approvalLimit).toLocaleString()}`
                    : <span className="detail-field__value is-muted">Unlimited</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="slide-panel__footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            id="detail-close-btn"
          >
            Close
          </button>
          {!role.isSystem && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onEdit(role)}
              id="detail-edit-btn"
            >
              <EditIcon />
              Edit Role
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default RoleDetailPanel;
