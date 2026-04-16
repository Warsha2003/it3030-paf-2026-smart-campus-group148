// src/api/userAdminApi.js
// Module E – Admin user-management API helpers

import axiosInstance from './axiosInstance';

/**
 * GET /api/admin/users?page=0&size=20
 */
export const getAllUsers = (page = 0, size = 20) =>
    axiosInstance.get('/admin/users', { params: { page, size } });

/**
 * GET /api/admin/users/:id
 */
export const getUserById = (id) =>
    axiosInstance.get(`/admin/users/${id}`);

/**
 * GET /api/admin/users/by-role/:role
 * role = 'USER' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN'
 */
export const getUsersByRole = (role) =>
    axiosInstance.get(`/admin/users/by-role/${role}`);

/**
 * PATCH /api/admin/users/:id/roles
 * body: { roles: ['USER', 'TECHNICIAN'] }
 */
export const updateUserRoles = (id, roles) =>
    axiosInstance.patch(`/admin/users/${id}/roles`, { roles });

/**
 * PATCH /api/admin/users/:id/disable
 */
export const disableUser = (id) =>
    axiosInstance.patch(`/admin/users/${id}/disable`);

/**
 * PATCH /api/admin/users/:id/enable
 */
export const enableUser = (id) =>
    axiosInstance.patch(`/admin/users/${id}/enable`);