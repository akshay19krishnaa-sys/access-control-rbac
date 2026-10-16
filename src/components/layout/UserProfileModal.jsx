import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function UserProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const modalRef = useRef(null);

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
      aria-labelledby="user-profile-title"
    >
      <div
        ref={modalRef}
        className="user-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-base font-bold text-slate-800" id="user-profile-title">
              User Account & Profile
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1.5 text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close user profile"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm bg-slate-50/50">
          {/* Identity Card */}
          <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#176B87] text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Super Admin</span>
                <span className="role-name-cell__system-tag">System</span>
              </div>
              <div className="text-xs text-[#176B87] font-semibold mt-0.5">
                System Administrator
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                admin@system.local
              </div>
            </div>
          </div>

          {/* RBAC Security Credentials */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Assigned Access & Scope
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Active Role</span>
              <span className="font-semibold text-slate-800">System Administrator</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Branch Scope</span>
              <span className="scope-badge all-branches text-[11px]">All Branches</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Approval Authority</span>
              <span className="font-semibold text-slate-800">Level 5 (Unlimited)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Security Safeguard</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Protected against modification
              </span>
            </div>
          </div>

          {/* Quick Access Actions */}
          <div className="space-y-1.5">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">
              Configuration Shortcuts
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-[#86B6F6] hover:bg-[#EEF5FF] text-left transition"
              onClick={() => navigateTo('/settings?section=audit')}
            >
              <span className="font-medium text-xs text-slate-800">Audit & Logging Console</span>
              <span className="text-xs text-[#176B87]">Configure →</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-[#86B6F6] hover:bg-[#EEF5FF] text-left transition"
              onClick={() => navigateTo('/permission-matrix')}
            >
              <span className="font-medium text-xs text-slate-800">Permission Matrix</span>
              <span className="text-xs text-[#176B87]">View Matrix →</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 hover:border-[#86B6F6] hover:bg-[#EEF5FF] text-left transition"
              onClick={() => navigateTo('/roles')}
            >
              <span className="font-medium text-xs text-slate-800">Roles Management</span>
              <span className="text-xs text-[#176B87]">Manage Roles →</span>
            </button>
          </div>

          {/* Notice */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
            <strong>Active Administrator Session:</strong> Standard single-administrator demo instance. Real-time RBAC authorizations and audit trails are logged for every action.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
