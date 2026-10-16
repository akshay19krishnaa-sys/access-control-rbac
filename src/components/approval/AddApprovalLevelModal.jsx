import { useState, useEffect } from 'react';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const PALETTE_COLORS = [
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Rose' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#176B87', label: 'Deep Teal' },
  { value: '#0284c7', label: 'Sky' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
];

function AddApprovalLevelDialog({ onClose, onSave, existingLevels = [] }) {

  const nextLevelNumber = existingLevels.reduce(
    (max, l) => Math.max(max, Number(l.levelNumber || 0)),
    0
  ) + 1;

  const defaultColor = PALETTE_COLORS[(nextLevelNumber - 1) % PALETTE_COLORS.length].value;

  const [form, setForm] = useState({
    name: '',
    levelNumber: nextLevelNumber,
    approver: '',
    description: '',
    approvalLimit: '',
    threshold: '',
    turnaround: '24 hours',
    color: defaultColor,
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const validate = (data) => {
    const errs = {};
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      errs.name = 'Level name is required.';
    } else if (trimmedName.length > 100) {
      errs.name = 'Level name must be 100 characters or fewer.';
    } else {
      const lower = trimmedName.toLowerCase();
      const isDuplicate = existingLevels.some(
        (l) => l.name && l.name.toLowerCase() === lower
      );
      if (isDuplicate) {
        errs.name = 'An approval level with this name already exists.';
      }
    }

    const trimmedApprover = data.approver.trim();
    if (!trimmedApprover) {
      errs.approver = 'Approver role/title is required.';
    } else if (trimmedApprover.length > 100) {
      errs.approver = 'Approver cannot exceed 100 characters.';
    }

    const num = Number(data.levelNumber);
    if (!Number.isInteger(num) || num < 1) {
      errs.levelNumber = 'Level number must be a positive integer (e.g., 1, 2, 3...).';
    } else {
      const exists = existingLevels.some((l) => Number(l.levelNumber) === num);
      if (exists) {
        errs.levelNumber = `Level ${num} is already configured. Choose another number.`;
      }
    }

    if (data.description.length > 500) {
      errs.description = 'Description must be 500 characters or fewer.';
    }

    if (data.approvalLimit !== '' && data.approvalLimit !== null) {
      const limit = Number(data.approvalLimit);
      if (isNaN(limit) || limit < 0) {
        errs.approvalLimit = 'Approval limit must be a positive number.';
      }
    }

    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (submitted) {
        setErrors(validate(updated));
      }
      return updated;
    });
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        name: form.name.trim(),
        levelNumber: Number(form.levelNumber),
        approver: form.approver.trim(),
        description: form.description.trim(),
        approvalLimit: form.approvalLimit !== '' ? Number(form.approvalLimit) : null,
        threshold: form.threshold.trim() || undefined,
        turnaround: form.turnaround.trim() || '24 hours',
        color: form.color,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to save approval level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameLen = form.name.length;
  const descLen = form.description.length;

  return (
    <div
      className="modal-backdrop"
      onClick={!isSubmitting ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-level-title"
    >
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="modal-add-level-title">
              Add Approval Level
            </h3>
            <p className="modal-subtitle">
              Configure a new authorization tier and financial threshold.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {serverError && (
              <div
                className="mb-4 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700 flex items-center gap-2"
                role="alert"
              >
                <AlertIcon />
                <span>{serverError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

              <div className="form-field sm:col-span-1">
                <label className="form-label" htmlFor="field-level-number">
                  Level # <span className="required">*</span>
                </label>
                <input
                  id="field-level-number"
                  type="number"
                  min="1"
                  step="1"
                  className={`form-input ${errors.levelNumber ? 'is-error' : ''}`}
                  value={form.levelNumber}
                  onChange={(e) => handleChange('levelNumber', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {errors.levelNumber && (
                  <div className="form-error-msg">
                    <AlertIcon /> {errors.levelNumber}
                  </div>
                )}
              </div>

              <div className="form-field sm:col-span-2">
                <label className="form-label" htmlFor="field-level-name">
                  Level Name <span className="required">*</span>
                </label>
                <input
                  id="field-level-name"
                  type="text"
                  className={`form-input ${errors.name ? 'is-error' : ''}`}
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Regional Executive Approval"
                  maxLength={110}
                  autoComplete="off"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
                <div
                  className={`form-char-count ${
                    nameLen > 90 ? (nameLen >= 100 ? 'over' : 'warn') : ''
                  }`}
                >
                  {nameLen}/100
                </div>
                {errors.name && (
                  <div className="form-error-msg">
                    <AlertIcon /> {errors.name}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field mb-4">
              <label className="form-label" htmlFor="field-approver">
                Approver Role / Title <span className="required">*</span>
              </label>
              <input
                id="field-approver"
                type="text"
                className={`form-input ${errors.approver ? 'is-error' : ''}`}
                value={form.approver}
                onChange={(e) => handleChange('approver', e.target.value)}
                placeholder="e.g. Regional Director, C-Suite, Audit Committee"
                maxLength={100}
                disabled={isSubmitting}
                required
              />
              {errors.approver && (
                <div className="form-error-msg">
                  <AlertIcon /> {errors.approver}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

              <div className="form-field">
                <label className="form-label" htmlFor="field-approval-limit">
                  Approval Limit ($) <span className="optional">(optional)</span>
                </label>
                <input
                  id="field-approval-limit"
                  type="number"
                  min="0"
                  step="100"
                  className={`form-input ${errors.approvalLimit ? 'is-error' : ''}`}
                  value={form.approvalLimit}
                  onChange={(e) => handleChange('approvalLimit', e.target.value)}
                  placeholder="e.g. 75000 (leave blank for unlimited)"
                  disabled={isSubmitting}
                />
                {errors.approvalLimit && (
                  <div className="form-error-msg">
                    <AlertIcon /> {errors.approvalLimit}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="field-turnaround">
                  Turnaround SLA <span className="optional">(optional)</span>
                </label>
                <input
                  id="field-turnaround"
                  type="text"
                  className="form-input"
                  value={form.turnaround}
                  onChange={(e) => handleChange('turnaround', e.target.value)}
                  placeholder="e.g. 24 hours, 3 business days"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-field mb-4">
              <label className="form-label" htmlFor="field-threshold">
                Display Threshold <span className="optional">(optional override)</span>
              </label>
              <input
                id="field-threshold"
                type="text"
                className="form-input"
                value={form.threshold}
                onChange={(e) => handleChange('threshold', e.target.value)}
                placeholder={
                  form.approvalLimit
                    ? `Auto: Up to $${Number(form.approvalLimit).toLocaleString()}`
                    : 'Auto: No Limit (or enter e.g. > $50,000)'
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="form-field mb-4">
              <label className="form-label" htmlFor="field-description">
                Description <span className="optional">(optional)</span>
              </label>
              <textarea
                id="field-description"
                className={`form-textarea ${errors.description ? 'is-error' : ''}`}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Briefly describe the scope, authorization criteria, or escalations for this level..."
                rows={2}
                disabled={isSubmitting}
              />
              <div
                className={`form-char-count ${
                  descLen > 450 ? (descLen >= 500 ? 'over' : 'warn') : ''
                }`}
              >
                {descLen}/500
              </div>
              {errors.description && (
                <div className="form-error-msg">
                  <AlertIcon /> {errors.description}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Badge Accent Color</label>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    className="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer"
                    style={{
                      backgroundColor: col.value,
                      borderColor: form.color === col.value ? '#176B87' : 'transparent',
                      transform: form.color === col.value ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: form.color === col.value ? '0 0 0 2px #B4D4FF' : 'none',
                    }}
                    title={col.label}
                    onClick={() => handleChange('color', col.value)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="level-modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              id="level-modal-save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save Level
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddApprovalLevelModal({ isOpen, onClose, onSave, existingLevels = [] }) {
  if (!isOpen) return null;
  return (
    <AddApprovalLevelDialog
      onClose={onClose}
      onSave={onSave}
      existingLevels={existingLevels}
    />
  );
}

export default AddApprovalLevelModal;
