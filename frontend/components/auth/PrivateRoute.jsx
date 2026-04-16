// src/components/auth/PrivateRoute.jsx
// Module E – Route guard for authenticated users

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps any route that requires the user to be authenticated.
 *
 * Usage in App.jsx:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * While the auth state is loading (initial /api/auth/me call),
 * a spinner is shown to prevent a flash-redirect to /login.
 */
const PrivateRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="route-loading">
                <div className="spinner" />
            </div>
        );
    }

    return isAuthenticated
        ? <Outlet />
        : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;