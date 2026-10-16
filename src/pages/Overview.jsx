import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRolesApi, getAuditLogsApi } from '../services/api';

/* ── Stat card data ── */
const STATS = [
  {
    id: 'total-roles',
    label: 'Total Roles',
    value: '6',
    change: '+2 this month',
    trend: 'positive',
    iconBg: 'rgba(23, 107, 135, 0.12)',
    iconColor: '#176B87',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'total-permissions',
    label: 'Permissions',
    value: '48',
    change: '+8 new',
    trend: 'positive',
    iconBg: 'rgba(16, 185, 129, 0.1)',
    iconColor: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    id: 'active-users',
    label: 'Active Users',
    value: '214',
    change: '+12 today',
    trend: 'positive',
    iconBg: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    value: '7',
    change: '3 urgent',
    trend: 'warning',
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

/* ── Fallback recent activity feed ── */
const FALLBACK_ACTIVITY = [
  { id: 1, action: 'Role <strong>Finance Manager</strong> was created by', actor: 'Alice Johnson', time: '2 minutes ago', color: '#176B87' },
  { id: 2, action: 'Permission <strong>export:reports</strong> added to', actor: 'HR Admin role', time: '18 minutes ago', color: '#10b981' },
  { id: 3, action: 'User <strong>Bob Smith</strong> was assigned to', actor: 'Sales Executive', time: '1 hour ago', color: '#f59e0b' },
  { id: 4, action: 'Approval level <strong>L3</strong> configured for', actor: 'Finance workflows', time: '3 hours ago', color: '#8b5cf6' },
  { id: 5, action: 'Role <strong>Viewer</strong> permissions were updated by', actor: 'Super Admin', time: '5 hours ago', color: '#ec4899' },
];

/* ── Quick access links ── */
const QUICK_LINKS = [
  { label: 'Manage Roles',            to: '/roles' },
  { label: 'Edit Permission Matrix',  to: '/permission-matrix' },
  { label: 'Configure Approvals',     to: '/approval-levels' },
  { label: 'Audit & Logging Settings',to: '/settings?section=audit' },
];

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ACTION_COLORS = {
  ROLE_CREATED: '#10b981',
  ROLE_UPDATED: '#3b82f6',
  PERMISSION_MODIFIED: '#8b5cf6',
  BRANCH_SCOPE_CHANGED: '#0284c7',
  APPROVAL_LEVEL_CHANGED: '#f59e0b',
  ROLE_ACTIVATED: '#10b981',
  ROLE_DEACTIVATED: '#ef4444',
};

function Overview() {
  const [roleCount, setRoleCount] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    let ignore = false;
    getRolesApi()
      .then((roles) => {
        if (!ignore && Array.isArray(roles)) {
          setRoleCount(roles.length);
        }
      })
      .catch(() => {});

    getAuditLogsApi({ limit: 5 })
      .then((res) => {
        if (!ignore && Array.isArray(res.data) && res.data.length > 0) {
          setRecentLogs(res.data);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h2 className="page-header__title">Dashboard Overview</h2>
          <p className="page-header__description">
            Monitor your access control system — roles, permissions, and activity at a glance.
          </p>
        </div>
        <div className="page-header__actions">
          <span className="status-badge active">System Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="overview-stats-grid">
        {STATS.map((stat) => (
          <div key={stat.id} className="stat-card" id={`stat-${stat.id}`}>
            <div
              className="stat-card__icon-wrap"
              style={{ background: stat.iconBg }}
              aria-hidden="true"
            >
              <span style={{ color: stat.iconColor }}>{stat.icon}</span>
            </div>
            <div className="stat-card__label">{stat.label}</div>
            <div className="stat-card__value">
              {stat.id === 'total-roles' && roleCount !== null ? roleCount : stat.value}
            </div>
            <div className={`stat-card__change ${stat.trend}`}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="overview-content-grid">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest changes across the RBAC system</div>
            </div>
            <Link
              to="/settings?section=audit"
              className="btn btn-ghost btn-sm text-indigo-600 hover:text-indigo-800 text-xs"
            >
              View Full Audit Trail →
            </Link>
          </div>
          <div className="card-body">
            <div className="activity-feed">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  const color = ACTION_COLORS[log.action] || '#176B87';
                  const actorName = log.actor?.name || 'System';
                  return (
                    <div key={log._id || log.id} className="activity-item">
                      <div
                        className="activity-item__dot"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <div className="activity-item__content">
                        <p className="activity-item__text">
                          <strong>{log.actionDisplay || log.action}</strong> for{' '}
                          <strong>{log.entityName}</strong> by{' '}
                          <strong>{actorName}</strong>
                        </p>
                        <div className="activity-item__time">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                FALLBACK_ACTIVITY.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div
                      className="activity-item__dot"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                    <div className="activity-item__content">
                      <p
                        className="activity-item__text"
                        dangerouslySetInnerHTML={{
                          __html: `${item.action} <strong>${item.actor}</strong>`,
                        }}
                      />
                      <div className="activity-item__time">{item.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Access</div>
              <div className="card-subtitle">Navigate to key sections</div>
            </div>
          </div>
          <div className="card-body">
            <div className="quick-access-list">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="quick-access-item"
                  id={`quick-link-${link.to.replace('/', '').replace('-', '_')}`}
                >
                  <span className="quick-access-item__label">{link.label}</span>
                  <span className="quick-access-item__icon">
                    <ChevronRightIcon />
                  </span>
                </Link>
              ))}
            </div>

            {/* System Health Indicator */}
            <div className="mt-6 p-4 rounded-xl border border-emerald-100 bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-emerald-800">All Systems Operational</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Last checked: just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
