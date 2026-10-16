import { useState, useEffect } from 'react';
import NavItem from '../ui/NavItem';
import { getRolesApi } from '../../services/api';

const Icons = {
  Brand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Overview: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Roles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Matrix: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  Approval: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
};

const SETTINGS_ITEMS = [
  { to: '/settings', icon: <Icons.Settings />, label: 'Settings' },
];

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onOpenUserProfile }) {
  const [roleCount, setRoleCount] = useState(null);

  useEffect(() => {
    let ignore = false;
    getRolesApi()
      .then((roles) => {
        if (!ignore && Array.isArray(roles)) {
          setRoleCount(roles.length);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const navItems = [
    { to: '/overview',          icon: <Icons.Overview />, label: 'Overview' },
    { to: '/roles',             icon: <Icons.Roles />,    label: 'Roles',    badge: roleCount !== null ? roleCount : undefined },
    { to: '/permission-matrix', icon: <Icons.Matrix />,   label: 'Permission Matrix' },
    { to: '/approval-levels',   icon: <Icons.Approval />, label: 'Approval Levels' },
    { to: '/reports',           icon: <Icons.Reports />,  label: 'Reports' },
  ];

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside className={sidebarClass} aria-label="Main navigation">

        <div className="sidebar-brand">
          <div className="sidebar-brand__icon" aria-hidden="true">
            <Icons.Brand />
          </div>
          <div className="sidebar-brand__text">
            <span className="sidebar-brand__title">AccessControl</span>
            <span className="sidebar-brand__subtitle">RBAC Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <span className="sidebar-nav__section-label">Main Menu</span>

          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
            />
          ))}

          <div className="mt-4">
            <span className="sidebar-nav__section-label">Configuration</span>
            {SETTINGS_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            role="button"
            tabIndex={0}
            aria-label="User profile details"
            id="sidebar-user-btn"
            onClick={onOpenUserProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenUserProfile?.();
              }
            }}
          >
            <div className="sidebar-user__avatar" aria-hidden="true">SA</div>
            <div className="sidebar-user__info">
              <div className="sidebar-user__name">Super Admin</div>
              <div className="sidebar-user__role">System Administrator</div>
            </div>
          </div>
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <Icons.ChevronLeft />
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
