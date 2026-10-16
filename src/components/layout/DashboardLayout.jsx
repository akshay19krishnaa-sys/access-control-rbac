import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import UserProfileModal from './UserProfileModal';

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

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        onOpenUserProfile={openUserProfile}
      />

      <div className="content-shell">

        <TopBar
          onMenuToggle={openMobile}
          onOpenUserProfile={openUserProfile}
        />

        <main className="content-main" id="main-content" role="main">
          <Outlet />
        </main>
      </div>

      <UserProfileModal
        isOpen={userProfileOpen}
        onClose={closeUserProfile}
      />
    </div>
  );
}

export default DashboardLayout;
