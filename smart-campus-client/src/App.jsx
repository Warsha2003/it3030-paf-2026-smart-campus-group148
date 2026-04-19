/**
 * App.jsx
 * Main application layout and router setup.
 *
 * Two layout shells:
 *   MainLayout    – sticky top Navbar + centred app-main
 *                   (regular user pages: /dashboard, /notifications)
 *   SidebarLayout – full-width, no Navbar
 *                   (admin pages that embed their own Sidebar)
 *
 * Route security:
 *   ProtectedRoute      → must be logged in
 *   RoleProtectedRoute  → must have ROLE_ADMIN
 *
 * Member 4 – App Setup
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }       from './context/AuthContext';
import { useAuth }            from './hooks/useAuth';
import Navbar                 from './components/Navbar';
import ProtectedRoute         from './components/ProtectedRoute';
import RoleProtectedRoute     from './components/RoleProtectedRoute';

// ── Pages ─────────────────────────────────────────────────
import LoginPage              from './pages/LoginPage';
import DashboardPage          from './pages/DashboardPage';
import BookingsPage           from './pages/BookingsPage';
import NotificationPage       from './pages/NotificationPage';
import AdminDashboard         from './pages/AdminDashboard';
import AdminBookingsPage      from './pages/AdminBookingsPage';
import AdminUsersPage         from './pages/AdminUsersPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import UnauthorizedPage       from './pages/UnauthorizedPage';
import OAuth2RedirectHandler  from './components/OAuth2RedirectHandler';

// ── Layout: top Navbar + centred content ──────────────────
function MainLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="app-container">
      {isAuthenticated && <Navbar />}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

// ── Layout: full-width, no Navbar (admin pages own sidebar) 
function SidebarLayout() {
  return <Outlet />;
}

// ── Admin route helper ────────────────────────────────────
function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <RoleProtectedRoute requiredRole="ADMIN">
        {children}
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}

// ── App ───────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        />

        <Routes>
          {/* ── Public ──────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

          {/* ── Admin panel (sidebar layout) ──────
               ALL admin pages are ROLE_ADMIN only.
               The login flow is the same Google OAuth;
               only accounts whose role === 'ADMIN'
               can reach these routes.               */}
          <Route element={<SidebarLayout />}>
            <Route
              path="/admin/dashboard"
              element={<AdminRoute><AdminDashboard /></AdminRoute>}
            />
            <Route
              path="/admin/users"
              element={<AdminRoute><AdminUsersPage /></AdminRoute>}
            />
            <Route
              path="/admin/bookings"
              element={<AdminRoute><AdminBookingsPage /></AdminRoute>}
            />
            <Route
              path="/admin/notifications"
              element={<AdminRoute><AdminNotificationsPage /></AdminRoute>}
            />
          </Route>

          {/* ── Regular pages (top Navbar) ────────── */}
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/bookings"
              element={<ProtectedRoute><BookingsPage /></ProtectedRoute>}
            />
            <Route
              path="/notifications"
              element={<ProtectedRoute><NotificationPage /></ProtectedRoute>}
            />

            {/* Error & fallback */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
