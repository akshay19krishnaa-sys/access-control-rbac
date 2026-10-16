import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import Roles from './pages/Roles';
import PermissionMatrix from './pages/PermissionMatrix';
import ApprovalLevels from './pages/ApprovalLevels';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<DashboardLayout />}>

          <Route index element={<Navigate to="/overview" replace />} />

          <Route path="overview"          element={<Overview />} />
          <Route path="roles"             element={<Roles />} />
          <Route path="permission-matrix" element={<PermissionMatrix />} />
          <Route path="approval-levels"   element={<ApprovalLevels />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="settings"          element={<Settings />} />

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
