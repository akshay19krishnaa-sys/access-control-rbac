
import { useState, useEffect, useCallback, useRef } from 'react';
import { getApprovalLevelsApi, createApprovalLevelApi } from '../services/api';
import AddApprovalLevelModal from '../components/approval/AddApprovalLevelModal';

const ApprovalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

function ApprovalLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const fetchLevels = useCallback(() => {
    setLoading(true);
    setError(null);
    getApprovalLevelsApi()
      .then((data) => {
        setLevels(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load approval levels:', err);
        setError(err.message || 'Failed to load approval levels from server.');
        showToast(err.message || 'Failed to load approval levels.', 'error');
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    getApprovalLevelsApi()
      .then((data) => {
        if (!ignore) {
          setLevels(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load approval levels:', err);
          setError(err.message || 'Failed to load approval levels from server.');
          showToast(err.message || 'Failed to load approval levels.', 'error');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  const handleSaveLevel = async (newLevelData) => {
    const created = await createApprovalLevelApi(newLevelData);
    setLevels((prev) => {
      const next = [...prev, created];
      return next.sort((a, b) => Number(a.levelNumber || 0) - Number(b.levelNumber || 0));
    });
    showToast(
      `Approval Level "${created.name}" (Level ${created.levelNumber}) created successfully in MongoDB.`
    );
  };

  return (
    <div className="approval-levels-page">

      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-header__title">Approval Levels</h2>
          <p className="page-header__description">
            Configure multi-tier approval workflows, roles, and financial thresholds for access requests.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={fetchLevels}
            disabled={loading}
            title="Reload approval levels"
          >
            <RefreshIcon />
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            id="add-level-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Level
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#B4D4FF] mb-8">
          <svg className="animate-spin h-8 w-8 text-[#176B87] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-semibold text-[#176B87]">Loading approval levels from database...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircleIcon />
            <span>{error}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm text-xs"
            onClick={fetchLevels}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="approval-levels-grid">
          {levels.map((level) => {
            const badgeId = level.levelId || `L${level.levelNumber}`;
            const levelLabel = level.level || `Level ${level.levelNumber}`;
            const cardId = `approval-level-${badgeId.toLowerCase()}`;
            const statusClass = (level.statusLower || level.status || 'active').toLowerCase();

            return (
              <div
                key={level.id || level._id || badgeId}
                className="card"
                id={cardId}
                aria-label={`Approval ${levelLabel}`}
              >
                <div className="card-header">
                  <div className="flex items-center gap-3">

                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: level.color || '#176B87' }}
                      aria-hidden="true"
                    >
                      {badgeId}
                    </div>
                    <div>
                      <div className="card-title">
                        {levelLabel} — {level.name}
                      </div>
                      <div className="card-subtitle">Approver: {level.approver}</div>
                    </div>
                  </div>
                  <span className={`status-badge ${statusClass === 'inactive' ? 'inactive' : 'active'}`}>
                    {statusClass === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </div>
                <div className="card-body">
                  {level.description && (
                    <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                      {level.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Threshold
                      </div>
                      <div className="font-semibold text-slate-700">
                        {level.threshold || (level.approvalLimit ? `Up to $${Number(level.approvalLimit).toLocaleString()}` : 'No Limit')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Turnaround
                      </div>
                      <div className="font-semibold text-slate-700">
                        {level.turnaround || '24 hours'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && levels.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-[#B4D4FF] mb-8">
          <p className="text-slate-500 mb-4">No approval levels configured yet.</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            Add Your First Level
          </button>
        </div>
      )}

      <div className="coming-soon-card">
        <div className="coming-soon-card__icon" aria-hidden="true">
          <ApprovalIcon />
        </div>
        <h3 className="coming-soon-card__title">Workflow Configuration Engine</h3>
        <p className="coming-soon-card__desc">
          Drag-and-drop workflow builder, conditional escalation rules, notification templates,
          and SLA tracking will be added in a future phase.
        </p>
        <span className="coming-soon-card__phase">Coming in Phase 3</span>
      </div>

      <AddApprovalLevelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLevel}
        existingLevels={levels}
      />

      {toast && (
        <div className="toast-container" aria-live="polite">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast__icon">
              {toast.type === 'success' ? (
                <CheckCircleIcon />
              ) : (
                <AlertCircleIcon />
              )}
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalLevels;
