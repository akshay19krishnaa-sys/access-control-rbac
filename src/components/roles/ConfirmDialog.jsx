/**
 * ConfirmDialog.jsx
 * Small centered modal that asks the user to confirm activating or
 * deactivating a role before the state change is applied.
 */

const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

/**
 * @param {'activate'|'deactivate'} action — the action being confirmed
 * @param {object}  role      — the role object being acted on
 * @param {Function} onConfirm — called when the user clicks the confirm button
 * @param {Function} onCancel  — called when the user cancels or clicks backdrop
 */
function ConfirmDialog({ action, role, onConfirm, onCancel }) {
  const isDeactivate = action === 'deactivate';

  return (
    <div className="confirm-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      {/* Stop propagation so clicking the dialog body does not close it */}
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-dialog__icon ${isDeactivate ? 'is-warn' : 'is-ok'}`} aria-hidden="true">
          {isDeactivate ? <WarnIcon /> : <CheckCircleIcon />}
        </div>

        <h3 className="confirm-dialog__title" id="confirm-title">
          {isDeactivate ? 'Deactivate Role' : 'Activate Role'}
        </h3>

        <p className="confirm-dialog__body">
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate <strong>{role.name}</strong>?
              Users assigned to this role will lose access to associated permissions immediately.
            </>
          ) : (
            <>
              Are you sure you want to activate <strong>{role.name}</strong>?
              Users assigned to this role will regain their associated permissions.
            </>
          )}
        </p>

        <div className="confirm-dialog__actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            id="confirm-cancel-btn"
          >
            Cancel
          </button>
          <button
            className={`btn btn-sm ${isDeactivate ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            id="confirm-action-btn"
          >
            {isDeactivate ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
