/**
 * useAuth.js
 * Custom hook to access the AuthContext.
 * 
 * Usage: const { user, login, logout, isAdmin } = useAuth();
 * 
 * Member 4 - Auth Hook
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
