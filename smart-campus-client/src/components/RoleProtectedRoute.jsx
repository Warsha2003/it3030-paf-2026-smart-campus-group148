/**
 * RoleProtectedRoute.jsx
 * Redirects users who lack the required role to an "Unauthorized" page.
 * 
 * Usage: Wrap admin-only routes:
 *   <Route path="/admin/users" element={
 *     <ProtectedRoute>
 *       <RoleProtectedRoute requiredRole="ADMIN">
 *         <AdminUsersPage />
 *       </RoleProtectedRoute>
 *     </ProtectedRoute>
 *   } />
 * 
 * Member 4 - Role-Based Route Protection
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RoleProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
