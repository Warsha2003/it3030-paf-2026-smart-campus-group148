/**
 * userApi.js
 * API service for user/role management endpoints (Admin only).
 * 
 * Member 4 - User/Role Management API
 */

import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** GET /api/users — get all users (ADMIN only) */
export const getAllUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};

/** PATCH /api/users/{id}/role — update a user's role (ADMIN only) */
export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/api/users/${userId}/role`, { role });
  return response.data;
};

/** PATCH /api/users/{id}/toggle-active — activate/deactivate a user (ADMIN only) */
export const toggleUserActive = async (userId) => {
  const response = await api.patch(`/api/users/${userId}/toggle-active`);
  return response.data;
};
