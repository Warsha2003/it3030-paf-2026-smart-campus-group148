// src/components/auth/RoleRoute.jsx
// Module E – Route guard for role-based access control

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps routes that require a specific role.
 * Must be nested inside <PrivateRoute /> so loading is already handled.
 *
 * Props:
 *   roles – string[] – e.g. ['ADMIN'] or ['ADMIN', 'MANAGER']
 *           The user must hold AT LEAST ONE of the listed roles.
 *
 * Usage in App.jsx:
 *   <Route element={<PrivateRoute />}>
 *     <Route element={<RoleRoute roles={['ADMIN']} />}>
 *       <Route path="/admin" element={<AdminPanel />} />
 *     </Route>
 *   </Route>
 */
const RoleRoute = ({ roles = [] }) => {
    const { hasRole } = useAuth();

    const authorized = roles.some((r) => hasRole(r));

    return authorized
        ? <Outlet />
        : <Navigate to="/unauthorized" replace />;
};

export default RoleRoute;