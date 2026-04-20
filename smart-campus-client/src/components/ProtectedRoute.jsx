/**
 * ProtectedRoute.jsx
 * Redirects unauthenticated users to the login page.
 * 
 * Usage: Wrap any route that requires login:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 * 
 * Member 4 - Route Protection
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking token on app start
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Smart Campus...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserve the attempted URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
