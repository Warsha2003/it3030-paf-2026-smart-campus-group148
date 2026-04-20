/**
 * notificationApi.js
 * API service for notification endpoints.
 * 
 * Member 4 - Notification API
 */

import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** GET /api/notifications — fetch all notifications for the logged-in user */
export const getNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data;
};

/** GET /api/notifications/unread-count — get badge count */
export const getUnreadCount = async () => {
  const response = await api.get('/api/notifications/unread-count');
  return response.data;
};

/** PATCH /api/notifications/{id}/read — mark one notification as read */
export const markAsRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

/** PATCH /api/notifications/read-all — mark all notifications as read */
export const markAllAsRead = async () => {
  const response = await api.patch('/api/notifications/read-all');
  return response.data;
};

/** DELETE /api/notifications/{id} — delete a notification */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/api/notifications/${id}`);
  return response.data;
};
