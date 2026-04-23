/**
 * authApi.js
 * API service for authentication endpoints.
 * 
 * Member 4 - Auth API
 */

import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios instance with base URL and default headers
const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * POST /api/auth/oauth-success
 * Send Google ID token to backend, receive JWT + user profile.
 * Called after Google Sign-In succeeds.
 */
export const googleLogin = async (credential) => {
  const response = await api.post('/api/auth/oauth-success', { credential });
  return response.data; // { success, message, data: { token, user } }
};

/**
 * GET /api/auth/me
 * Fetch the currently logged-in user's profile.
 * Requires valid JWT in Authorization header.
 */
export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data; // { success, message, data: UserResponseDto }
};

/**
 * POST /api/auth/login
 * Traditional email/password admin login.
 */
export const credentialLogin = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data; // { success, message, data: { token } }
};
