import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, ClipboardList, FileText, Zap } from 'lucide-react';
import { ToastProvider } from './components/Toast.jsx';
import UploadPage from './pages/UploadPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/upload', label: 'Upload Data', icon: UploadCloud },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function App() {
  return (
    <ToastProvider>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-mark"><Zap size={20} fill="currentColor" /></div>
            <div>
              <div className="brand-name">Order System</div>
              <div className="brand-sub">Exception management</div>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Main">
            <div className="nav-label">Workspace</div>
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="status-dot" /> System operational
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}