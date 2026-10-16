import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function HelpModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="help-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF5FF] text-[#176B87] flex items-center justify-center font-bold text-sm border border-[#B4D4FF]">
              ?
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800" id="help-modal-title">
                RBAC System Quick Reference & Guide
              </h2>
              <p className="text-xs text-slate-500">
                Core concepts, security rules, and architectural standards
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1.5 text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close help modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 bg-slate-50/50">
          {/* Quick Nav Cards */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                className="p-3 bg-white rounded-lg border border-slate-200 text-left hover:border-[#86B6F6] hover:bg-[#EEF5FF] transition"
                onClick={() => navigateTo('/roles')}
              >
                <div className="font-semibold text-xs text-[#176B87]">Roles Directory</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Manage 61 roles</div>
              </button>
              <button
                type="button"
                className="p-3 bg-white rounded-lg border border-slate-200 text-left hover:border-[#86B6F6] hover:bg-[#EEF5FF] transition"
                onClick={() => navigateTo('/permission-matrix')}
              >
                <div className="font-semibold text-xs text-[#176B87]">Permission Matrix</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Configure 8 modules</div>
              </button>
              <button
                type="button"
                className="p-3 bg-white rounded-lg border border-slate-200 text-left hover:border-[#86B6F6] hover:bg-[#EEF5FF] transition"
                onClick={() => navigateTo('/approval-levels')}
              >
                <div className="font-semibold text-xs text-[#176B87]">Approval Levels</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Multi-tier thresholds</div>
              </button>
              <button
                type="button"
                className="p-3 bg-white rounded-lg border border-slate-200 text-left hover:border-[#86B6F6] hover:bg-[#EEF5FF] transition"
                onClick={() => navigateTo('/reports')}
              >
                <div className="font-semibold text-xs text-[#176B87]">Reports & Exports</div>
                <div className="text-[11px] text-slate-500 mt-0.5">4 CSV audit reports</div>
              </button>
            </div>
          </div>

          {/* Key Security Safeguards */}
          <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#176B87] flex items-center gap-2">
              <span>🛡️</span> Mandatory Security Rules
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>System Administrator Protection:</strong> The System Administrator role is protected against deletion, deactivation, and permission modification to prevent privilege escalation.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Minimum Permission Rule:</strong> Every role must possess at least one granted permission. Creating or saving a role with zero permissions is strictly blocked with HTTP 400.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Inactive Role Protection:</strong> Inactive roles cannot be assigned to users, and roles with active assigned users cannot be deactivated until reassigned.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Branch Scope Enforcement:</strong> Backend authorization checks enforce whether access requests originate within the user&apos;s assigned branch, selected branch list, or all branches.
                </div>
              </li>
            </ul>
          </div>

          {/* Module Capabilities */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span>📋</span> Granular Actions
            </h3>
            <p className="text-xs text-slate-500">
              Each module supports applicable action permissions: <strong>View</strong>, <strong>Create</strong>, <strong>Edit</strong>, <strong>Delete</strong>, <strong>Approve</strong>, and <strong>Export</strong>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">View:</span> Read records & dashboards
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Create:</span> Instantiate new records
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Edit:</span> Modify existing records
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Delete:</span> Soft delete / remove
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Approve:</span> Sign off on workflows
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Export:</span> Download CSV & data
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Access Control RBAC Platform v1.0
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
