/**
 * tokenUtils.js
 * Utility functions for JWT token management in localStorage.
 * 
 * We store the JWT in localStorage after Google login.
 * All API calls include this token in the Authorization header.
 * 
 * Member 4 - Auth Utilities
 */

const TOKEN_KEY = 'smart_campus_token';
const USER_KEY = 'smart_campus_user';

/** Save JWT token to localStorage */
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/** Get saved JWT token from localStorage */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/** Remove JWT token (on logout) */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/** Save user profile to localStorage (cache) */
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/** Get cached user profile from localStorage */
export const getSavedUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/** Remove cached user profile */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/** Clear all auth data (full logout) */
export const clearAuth = () => {
  removeToken();
  removeUser();
};

/** Check if user is currently logged in */
export const isLoggedIn = () => {
  return !!getToken();
};
