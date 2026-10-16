import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ACTION_COLOR_MAP = {
  ROLE_CREATED: '#10b981',
  ROLE_UPDATED: '#3b82f6',
  PERMISSION_MODIFIED: '#8b5cf6',
  BRANCH_SCOPE_CHANGED: '#0284c7',
  APPROVAL_LEVEL_CHANGED: '#f59e0b',
  ROLE_ACTIVATED: '#10b981',
  ROLE_DEACTIVATED: '#ef4444',
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function NotificationsDropdown({
  isOpen,
  onClose,
  notifications = [],
  loading = false,
  unreadCount = 0,
  onMarkAllAsRead,
}) {
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {

      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !e.target.closest('#topbar-notifications-btn')
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="notifications-popover"
      role="region"
      aria-label="Notifications Panel"
      id="notifications-popover"
    >

      <div className="notifications-popover__header">
        <div className="notifications-popover__title">
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <span className="notifications-popover__badge" id="notifications-unread-count">
              {unreadCount} new
            </span>
          ) : (
            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Up to date
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-[#176B87] hover:text-[#0e4253] font-semibold underline"
              onClick={onMarkAllAsRead}
              id="mark-all-read-btn"
            >
              Mark all as read
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="notifications-popover__list">
        {loading && notifications.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            <svg
              className="animate-spin h-5 w-5 text-[#176B87] mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading security events from MongoDB...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">No security events recorded yet</p>
            <p>Role and permission changes will appear here in real-time.</p>
          </div>
        )}

        {notifications.map((item) => {
          const color = ACTION_COLOR_MAP[item.action] || '#176B87';
          const isUnread = item.isUnread;

          return (
            <div
              key={item._id || item.id}
              className={`notifications-popover__item ${isUnread ? 'unread' : ''}`}
            >
              <div
                className="notifications-popover__dot"
                style={{ background: color }}
                aria-hidden="true"
              />
              <div className="notifications-popover__content">
                <div className="notifications-popover__action">
                  <span>{item.actionDisplay || item.action}</span>
                  {item.entityName && (
                    <span className="text-slate-800">
                      {' '}
                      for <strong>{item.entityName}</strong>
                    </span>
                  )}
                </div>
                <div className="notifications-popover__meta">
                  <span>by {item.actor?.name || 'Super Admin'}</span>
                  <span className="mx-1">•</span>
                  <span>{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>
              {isUnread && (
                <span
                  className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"
                  title="Unread event"
                  aria-label="Unread"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="notifications-popover__footer">
        <span className="text-[11px] text-slate-500">
          Persistent audit logs in MongoDB
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-[#176B87] hover:text-[#0e4253] flex items-center gap-1"
          onClick={() => {
            onClose();
            navigate('/settings?section=audit');
          }}
          id="view-full-audit-btn"
        >
          View Full Audit Trail →
        </button>
      </div>
    </div>
  );
}
