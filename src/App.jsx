import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import Roles from './pages/Roles';
import PermissionMatrix from './pages/PermissionMatrix';
import ApprovalLevels from './pages/ApprovalLevels';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

/**
 * App — Root component.
 * Sets up React Router with the DashboardLayout as the parent route.
 * Each page is rendered inside the layout via <Outlet />.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard shell wraps all pages */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Default redirect to /overview */}
          <Route index element={<Navigate to="/overview" replace />} />

          {/* Main pages */}
          <Route path="overview"          element={<Overview />} />
          <Route path="roles"             element={<Roles />} />
          <Route path="permission-matrix" element={<PermissionMatrix />} />
          <Route path="approval-levels"   element={<ApprovalLevels />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="settings"          element={<Settings />} />

          {/* Catch-all — redirect unknown paths back to overview */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
