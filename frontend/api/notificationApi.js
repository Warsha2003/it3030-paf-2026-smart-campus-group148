// src/api/notificationApi.js
// Module D – Notification API helpers

import axiosInstance from './axiosInstance';

/**
 * GET /api/notifications?page=0&size=20
 * Paginated full notification history for the authenticated user.
 */
export const getNotifications = (page = 0, size = 20) =>
    axiosInstance.get('/notifications', { params: { page, size } });

/**
 * GET /api/notifications/unread
 * All unread notifications – used to populate the dropdown panel.
 */
export const getUnreadNotifications = () =>
    axiosInstance.get('/notifications/unread');

/**
 * GET /api/notifications/unread/count
 * Returns { count: number } – used for the bell badge.
 */
export const getUnreadCount = () =>
    axiosInstance.get('/notifications/unread/count');

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markNotificationRead = (id) =>
    axiosInstance.patch(`/notifications/${id}/read`);

/**
 * PATCH /api/notifications/read-all
 * Mark ALL unread notifications as read.
 */
export const markAllNotificationsRead = () =>
    axiosInstance.patch('/notifications/read-all');

/**
 * DELETE /api/notifications/:id
 * Delete a single notification owned by the current user.
 */
export const deleteNotification = (id) =>
    axiosInstance.delete(`/notifications/${id}`);