import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuditLogsApi } from '../../services/api';
import GlobalSearchModal from './GlobalSearchModal';
import NotificationsDropdown from './NotificationsDropdown';
import HelpModal from './HelpModal';
import UserProfileModal from './UserProfileModal';

const ROUTE_META = {
  '/overview':          { title: 'Overview',          breadcrumb: 'Dashboard' },
  '/roles':             { title: 'Roles',              breadcrumb: 'Access Control' },
  '/permission-matrix': { title: 'Permission Matrix',  breadcrumb: 'Access Control' },
  '/approval-levels':   { title: 'Approval Levels',    breadcrumb: 'Access Control' },
  '/reports':           { title: 'Reports & Exports',  breadcrumb: 'Analytics & Compliance' },
  '/settings':          { title: 'Settings',           breadcrumb: 'Configuration' },
};

const Icons = {
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Help: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

const STORAGE_KEY_NOTIF_READ = 'rbac_notifications_read_timestamp';

function TopBar({ onMenuToggle, onOpenUserProfile }) {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] ?? { title: 'Dashboard', breadcrumb: 'Home' };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await getAuditLogsApi({ limit: 12 });
      const rawLogs = Array.isArray(res.data) ? res.data : [];

      const lastReadRaw = localStorage.getItem(STORAGE_KEY_NOTIF_READ);

      const lastReadTimestamp = lastReadRaw ? Number(lastReadRaw) : Date.now() - 3600000;

      let unread = 0;
      const annotated = rawLogs.map((log) => {
        const logTime = new Date(log.createdAt).getTime();
        const isUnread = logTime > lastReadTimestamp;
        if (isUnread) unread += 1;
        return { ...log, isUnread };
      });

      setNotifications(annotated);
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications from audit logs:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const load = () => {
      getAuditLogsApi({ limit: 12 })
        .then((res) => {
          if (ignore) return;
          const rawLogs = Array.isArray(res.data) ? res.data : [];
          const lastReadRaw = localStorage.getItem(STORAGE_KEY_NOTIF_READ);
          const lastReadTimestamp = lastReadRaw ? Number(lastReadRaw) : Date.now() - 3600000;

          let unread = 0;
          const annotated = rawLogs.map((log) => {
            const logTime = new Date(log.createdAt).getTime();
            const isUnread = logTime > lastReadTimestamp;
            if (isUnread) unread += 1;
            return { ...log, isUnread };
          });

          setNotifications(annotated);
          setUnreadCount(unread);
          setNotifLoading(false);
        })
        .catch((err) => {
          if (!ignore) {
            console.error('Failed to load notifications from audit logs:', err);
            setNotifLoading(false);
          }
        });
    };

    load();

    const interval = setInterval(load, 60000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllAsRead = () => {
    localStorage.setItem(STORAGE_KEY_NOTIF_READ, String(Date.now()));
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setUnreadCount(0);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {

      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k') || e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleOpenUser = () => {
    if (onOpenUserProfile) {
      onOpenUserProfile();
    } else {
      setIsUserProfileOpen(true);
    }
  };

  return (
    <>
      <header className="topbar" role="banner">

        <div className="flex items-center gap-4">

          <button
            className="topbar-icon-btn md:hidden"
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
            id="mobile-menu-btn"
          >
            <Icons.Menu />
          </button>

          <div className="topbar__left">
            <h1 className="topbar__page-title">{meta.title}</h1>
            <nav className="topbar__breadcrumb" aria-label="Breadcrumb">
              <span>AccessControl</span>
              <span className="topbar__breadcrumb-sep">
                <Icons.ChevronRight />
              </span>
              <span>{meta.breadcrumb}</span>
              <span className="topbar__breadcrumb-sep">
                <Icons.ChevronRight />
              </span>
              <span className="topbar__breadcrumb-current">{meta.title}</span>
            </nav>
          </div>
        </div>

        <div className="topbar__right relative">

          <button
            className="topbar-icon-btn"
            aria-label="Search roles catalog (Ctrl+K or /)"
            title="Search roles (Ctrl+K or /)"
            id="topbar-search-btn"
            onClick={() => setIsSearchOpen(true)}
          >
            <Icons.Search />
          </button>

          <button
            className="topbar-icon-btn"
            aria-label="RBAC System Reference & Help"
            title="RBAC Guide & Help"
            id="topbar-help-btn"
            onClick={() => setIsHelpOpen(true)}
          >
            <Icons.Help />
          </button>

          <button
            className="topbar-icon-btn"
            aria-label={`Notifications — ${unreadCount} unread`}
            title={`Notifications (${unreadCount} unread)`}
            id="topbar-notifications-btn"
            aria-expanded={isNotificationsOpen}
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              if (!isNotificationsOpen) {
                fetchNotifications();
              }
            }}
          >
            <Icons.Bell />
            {unreadCount > 0 && (
              <span
                className="topbar-icon-btn__badge flex items-center justify-center text-[10px] text-white font-bold"
                style={{ width: '18px', height: '18px', top: '-4px', right: '-4px', fontSize: '9px' }}
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationsDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            loading={notifLoading}
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          <div className="topbar__divider" aria-hidden="true" />

          <button
            className="topbar-user-chip"
            aria-label="User account details"
            title="Super Admin • System Administrator"
            id="topbar-user-btn"
            onClick={handleOpenUser}
          >
            <div className="topbar-user-chip__avatar" aria-hidden="true">SA</div>
            <div className="hidden sm:block text-left">
              <div className="topbar-user-chip__name">Super Admin</div>
              <div className="topbar-user-chip__role">System Administrator</div>
            </div>
          </button>
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {!onOpenUserProfile && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
        />
      )}
    </>
  );
}

export default TopBar;
