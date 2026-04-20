/**
 * AuthContext.jsx
 * Global authentication state using React Context API.
 * 
 * Provides: { user, token, loading, login, logout, isAdmin }
 * Wrap the entire app with <AuthProvider> so any component can access auth state.
 * 
 * Member 4 - Auth Context
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import { googleLogin, getCurrentUser } from '../services/authApi';
import { saveToken, saveUser, clearAuth, getToken, getSavedUser } from '../utils/tokenUtils';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  /**
   * On app start: check if a token is already stored in localStorage.
   * If yes, try to fetch the user profile to confirm it's still valid.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getToken();
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        // Try to load from cache first for instant UI
        const cachedUser = getSavedUser();
        if (cachedUser) setUser(cachedUser);

        // Then verify token with server and get fresh user data
        const res = await getCurrentUser();
        if (res.success) {
          setUser(res.data);
          saveUser(res.data);
        }
      } catch (err) {
        // Token is invalid/expired - clear everything
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Called after Google Sign-In succeeds.
   * Sends credential to backend, stores JWT, updates user state.
   */
  const login = useCallback(async (googleCredential) => {
    try {
      const res = await googleLogin(googleCredential);
      if (res.success) {
        const { token, user: userData } = res.data;
        saveToken(token);
        saveUser(userData);
        setUser(userData);
        toast.success(`Welcome, ${userData.name}! 🎉`);
        return { success: true, user: userData };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false };
    }
  }, []);

  /**
   * Logout: clear JWT, clear user state.
   */
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  /** Convenience helpers */
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isTechnician,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
