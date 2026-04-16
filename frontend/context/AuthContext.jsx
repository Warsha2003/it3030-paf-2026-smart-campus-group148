// src/context/AuthContext.jsx
// Module E – Authentication context

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser, logoutUser } from '../api/authApi';

/**
 * AuthContext provides authentication state and helpers to the entire React tree.
 *
 * Shape:
 *   user        – UserDTO from the backend (null if not logged in)
 *   token       – JWT string stored in localStorage
 *   loading     – true while the initial /api/auth/me check is in flight
 *   isAuthenticated – derived boolean
 *   hasRole(role)   – checks if current user holds a role
 *   login(token)    – stores token and fetches user profile
 *   logout()        – clears token and user
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user,    setUser]    = useState(null);
    const [token,   setToken]   = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount (or when token changes), restore the session from the API
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getCurrentUser()
            .then((res) => {
                setUser(res.data.data);
            })
            .catch(() => {
                // Token invalid / expired → clear everything
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [token]);

    /**
     * Called by OAuthRedirectHandler after the backend redirects with ?token=...
     * Stores the JWT and triggers the useEffect above to fetch the user profile.
     */
    const login = useCallback((newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    /**
     * Clears local state and notifies the backend.
     */
    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch (_) {
            // Swallow – we clear client-side regardless
        } finally {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    }, []);

    /**
     * Check whether the current user holds a given role.
     * @param {string} role – e.g. 'ADMIN', 'TECHNICIAN'
     */
    const hasRole = useCallback(
        (role) => user?.roles?.includes(role) ?? false,
        [user]
    );

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        hasRole,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};

export default AuthContext;