
import { useState, useEffect } from 'react';
import { BRANCH_SCOPES, APPROVAL_LEVELS, AVAILABLE_BRANCHES } from '../../data/roles';
import { MODULES } from '../../data/permissions';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const EMPTY_FORM = {
  name: '',
  description: '',
  branchScope: 'Assigned Branch',
  selectedBranches: [],
  approvalLevel: 0,
  approvalLimit: '',
  status: 'active',
  permissions: { dashboard: { view: true } },
};

function hasAtLeastOnePerm(permissions) {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    return false;
  }
  return Object.values(permissions).some((actions) => {
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
      return false;
    }
    return Object.values(actions).some((v) => v === true);
  });
}

function validate(form, existingNames, mode, originalName) {
  const errors = {};
  const trimmedName = form.name.trim();

  if (!trimmedName) {
    errors.name = 'Role name is required.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Role name must be 100 characters or fewer.';
  } else {
    const lower = trimmedName.toLowerCase();
    const isDuplicate = existingNames.some((n) => {

      if (mode === 'edit' && originalName && n.toLowerCase() === originalName.toLowerCase()) return false;
      return n.toLowerCase() === lower;
    });
    if (isDuplicate) errors.name = 'A role with this name already exists.';
  }

  if (form.description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  if (form.branchScope === 'Selected Branches' && form.selectedBranches.length === 0) {
    errors.selectedBranches = 'Please select at least one branch.';
  }

  if (form.approvalLimit !== '' && form.approvalLimit !== null) {
    const n = Number(form.approvalLimit);
    if (isNaN(n) || n < 0) {
      errors.approvalLimit = 'Approval limit must be a valid positive number.';
    }
  }

  if (!hasAtLeastOnePerm(form.permissions)) {
    errors.permissions = 'Every role must have at least one permission assigned.';
  }

  return errors;
}

const PANEL_META = {
  create: { title: 'Create Role',  subtitle: 'Define a new role and configure its access scope' },
  edit:   { title: 'Edit Role',    subtitle: 'Update role configuration and permissions' },
  clone:  { title: 'Clone Role',   subtitle: 'Create a copy of an existing role' },
};

function RoleFormPanel({ mode, roleData, existingNames, onSave, onClose }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [submitted, setSubmitted] = useState(false);

  const meta = PANEL_META[mode] || PANEL_META.create;

  useEffect(() => {
    queueMicrotask(() => {
      if (roleData && (mode === 'edit' || mode === 'clone')) {
        setForm({
          name:             mode === 'clone' ? `Copy of ${roleData.name}` : roleData.name,
          description:      roleData.description || '',
          branchScope:      roleData.branchScope,
          selectedBranches: [...(roleData.selectedBranches || [])],
          approvalLevel:    roleData.approvalLevel ?? 0,
          approvalLimit:    roleData.approvalLimit !== null && roleData.approvalLimit !== undefined
                              ? String(roleData.approvalLimit) : '',
          status:           mode === 'clone' ? 'active' : roleData.status,
          permissions:      roleData.permissions && typeof roleData.permissions === 'object'
                              ? JSON.parse(JSON.stringify(roleData.permissions))
                              : { dashboard: { view: true } },
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setSubmitted(false);
    });
  }, [mode, roleData]);

  useEffect(() => {
    if (!submitted) return;
    queueMicrotask(() => {
      setErrors(validate(form, existingNames, mode, roleData?.name));
    });
  }, [form, submitted, existingNames, mode, roleData?.name]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleBranch = (branch) =>
    setForm((prev) => ({
      ...prev,
      selectedBranches: prev.selectedBranches.includes(branch)
        ? prev.selectedBranches.filter((b) => b !== branch)
        : [...prev.selectedBranches, branch],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form, existingNames, mode, roleData?.name);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      ...form,
      name:          form.name.trim(),
      approvalLevel: Number(form.approvalLevel),
      approvalLimit: form.approvalLimit !== '' ? Number(form.approvalLimit) : null,
      permissions:   form.permissions,
    });
  };

  const nameLen = form.name.length;
  const descLen = form.description.length;

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="slide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-panel-title"
      >

        <div className="slide-panel__header">
          <div className="slide-panel__title-group">
            <span className="slide-panel__title" id="form-panel-title">{meta.title}</span>
            <span className="slide-panel__subtitle">{meta.subtitle}</span>
          </div>
          <button
            className="slide-panel__close"
            onClick={onClose}
            type="button"
            aria-label="Close panel"
          >
            <CloseIcon />
          </button>
        </div>

        <form
          id="role-form"
          className="slide-panel__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="slide-panel__body">

            <div className="form-section">
              <div className="form-section-title">Basic Information</div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-name">
                  Role Name <span className="required">*</span>
                </label>
                <input
                  id="field-name"
                  type="text"
                  className={`form-input ${errors.name ? 'is-error' : ''}`}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Branch Manager"
                  maxLength={110}
                  autoComplete="off"
                  autoFocus
                />
                <div className={`form-char-count ${nameLen > 90 ? (nameLen >= 100 ? 'over' : 'warn') : ''}`}>
                  {nameLen}/100
                </div>
                {errors.name && (
                  <div className="form-error-msg"><AlertIcon /> {errors.name}</div>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-desc">
                  Description <span className="optional">(optional)</span>
                </label>
                <textarea
                  id="field-desc"
                  className={`form-textarea ${errors.description ? 'is-error' : ''}`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the purpose and responsibilities of this role..."
                  rows={3}
                />
                <div className={`form-char-count ${descLen > 450 ? (descLen >= 500 ? 'over' : 'warn') : ''}`}>
                  {descLen}/500
                </div>
                {errors.description && (
                  <div className="form-error-msg"><AlertIcon /> {errors.description}</div>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Status</label>
                <div className="status-toggle" role="radiogroup" aria-label="Role status">
                  <label
                    className={`status-toggle__option ${form.status === 'active' ? 'sel-active' : ''}`}
                    id="label-status-active"
                  >
                    <input
                      type="radio"
                      name="role-status"
                      value="active"
                      checked={form.status === 'active'}
                      onChange={() => set('status', 'active')}
                    />
                    <span className="status-toggle__dot" />
                    Active
                  </label>
                  <label
                    className={`status-toggle__option ${form.status === 'inactive' ? 'sel-inactive' : ''}`}
                    id="label-status-inactive"
                  >
                    <input
                      type="radio"
                      name="role-status"
                      value="inactive"
                      checked={form.status === 'inactive'}
                      onChange={() => set('status', 'inactive')}
                    />
                    <span className="status-toggle__dot" />
                    Inactive
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Access Scope</div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-scope">
                  Branch Scope <span className="required">*</span>
                </label>
                <select
                  id="field-scope"
                  className="form-select"
                  value={form.branchScope}
                  onChange={(e) => {
                    const val = e.target.value;
                    set('branchScope', val);
                    if (val !== 'Selected Branches') {
                      set('selectedBranches', []);
                    }
                  }}
                >
                  {BRANCH_SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="form-hint">
                  {form.branchScope === 'Assigned Branch' &&
                    'Access limited to the branch this user is directly assigned to.'}
                  {form.branchScope === 'Selected Branches' &&
                    'Access granted to the specific branches chosen below.'}
                  {form.branchScope === 'All Branches' &&
                    'Access extends across all branches in the organisation.'}
                </div>
              </div>

              {form.branchScope === 'Selected Branches' && (
                <div className="form-field">
                  <label className="form-label">
                    Select Branches <span className="required">*</span>
                  </label>
                  <div className={`branch-checkbox-grid ${errors.selectedBranches ? 'is-error' : ''}`}>
                    {AVAILABLE_BRANCHES.map((branch) => (
                      <label key={branch} className="branch-checkbox-label">
                        <input
                          type="checkbox"
                          checked={form.selectedBranches.includes(branch)}
                          onChange={() => toggleBranch(branch)}
                        />
                        {branch}
                      </label>
                    ))}
                  </div>
                  {errors.selectedBranches && (
                    <div className="form-error-msg"><AlertIcon /> {errors.selectedBranches}</div>
                  )}
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title">Approval Configuration</div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-approval-level">
                  Approval Level
                </label>
                <select
                  id="field-approval-level"
                  className="form-select"
                  value={form.approvalLevel}
                  onChange={(e) => set('approvalLevel', e.target.value)}
                >
                  {APPROVAL_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === 0 ? 'Level 0 — No Approval Authority' : `Level ${lvl}`}
                    </option>
                  ))}
                </select>
                <div className="form-hint">Higher levels represent greater approval authority.</div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-approval-limit">
                  Approval Limit <span className="optional">(optional)</span>
                </label>
                <div className="form-input-prefix-wrap">
                  <span className="form-input-prefix">$</span>
                  <input
                    id="field-approval-limit"
                    type="number"
                    className={`form-input ${errors.approvalLimit ? 'is-error' : ''}`}
                    value={form.approvalLimit}
                    onChange={(e) => set('approvalLimit', e.target.value)}
                    placeholder="e.g. 50000"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="form-hint">Leave blank for unlimited approval authority.</div>
                {errors.approvalLimit && (
                  <div className="form-error-msg"><AlertIcon /> {errors.approvalLimit}</div>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                Initial Module Permissions <span className="required">*</span>
              </div>
              <div className="form-hint" style={{ marginBottom: '10px' }}>
                Every role must have at least one permission. Full granular actions can be configured in the Permission Matrix.
              </div>

              {errors.permissions && (
                <div className="form-error-msg" style={{ marginBottom: '10px' }}>
                  <AlertIcon /> {errors.permissions}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MODULES.map((mod) => {
                  const isChecked = Boolean(form.permissions?.[mod.id]?.view);
                  const isSysAdmin = mode === 'edit' && Boolean(roleData?.isSystem || roleData?.name?.toLowerCase() === 'system administrator');

                  return (
                    <label
                      key={mod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: isChecked ? 'rgba(23, 107, 135, 0.06)' : 'transparent',
                        fontSize: '0.8125rem',
                        cursor: isSysAdmin ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSysAdmin}
                        onChange={() => {
                          if (isSysAdmin) return;
                          setForm((prev) => ({
                            ...prev,
                            permissions: {
                              ...prev.permissions,
                              [mod.id]: {
                                ...(prev.permissions?.[mod.id] || {}),
                                view: !isChecked,
                              },
                            },
                          }));
                        }}
                      />
                      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {mod.name} (View)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="slide-panel__footer">
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={onClose}
              id="form-cancel-btn"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              id="form-save-btn"
            >
              <SaveIcon />
              {mode === 'create' ? 'Create Role' : mode === 'clone' ? 'Save Clone' : 'Save Changes'}
            </button>
          </div>
        </form>

      </aside>
    </>
  );
}

export default RoleFormPanel;
