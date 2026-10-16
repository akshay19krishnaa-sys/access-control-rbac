import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import UserProfileModal from './UserProfileModal';

/**
 * DashboardLayout — Root shell that composes:
 * Sidebar (left) + [TopBar + page content] (right).
 *
 * Manages sidebar collapse, mobile open states, and shared user profile modal.
 */
function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);
  const openUserProfile = () => setUserProfileOpen(true);
  const closeUserProfile = () => setUserProfileOpen(false);

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        onOpenUserProfile={openUserProfile}
      />

      {/* ── Main content shell ── */}
      <div className="content-shell">
        {/* Top navigation bar */}
        <TopBar
          onMenuToggle={openMobile}
          onOpenUserProfile={openUserProfile}
        />

        {/* Routed page content */}
        <main className="content-main" id="main-content" role="main">
          <Outlet />
        </main>
      </div>

      {/* Shared User Profile Modal */}
      <UserProfileModal
        isOpen={userProfileOpen}
        onClose={closeUserProfile}
      />
    </div>
  );
}

export default DashboardLayout;
