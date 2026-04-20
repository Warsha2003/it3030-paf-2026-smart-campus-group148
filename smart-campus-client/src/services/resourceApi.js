/**
 * resourceApi.js
 * API service for Facilities & Assets Catalogue endpoints.
 *
 * Admin endpoints (POST/PUT/DELETE/PATCH) and
 * authenticated-user endpoints (GET with search/filter).
 *
 * Member 1 – Facilities & Assets Catalogue
 */

import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Read (all authenticated users) ──────────────────────

/** GET /api/resources — list all resources (with optional filters) */
export const getResources = async (params = {}) => {
  const res = await api.get('/api/resources', { params });
  return res.data;
};

/** GET /api/resources/:id — single resource details */
export const getResourceById = async (id) => {
  const res = await api.get(`/api/resources/${id}`);
  return res.data;
};

// ── Admin CRUD ──────────────────────────────────────────

/** POST /api/resources — create a new resource */
export const createResource = async (data) => {
  const res = await api.post('/api/resources', data);
  return res.data;
};

/** PUT /api/resources/:id — update a resource */
export const updateResource = async (id, data) => {
  const res = await api.put(`/api/resources/${id}`, data);
  return res.data;
};

/** DELETE /api/resources/:id — delete a resource */
export const deleteResource = async (id) => {
  const res = await api.delete(`/api/resources/${id}`);
  return res.data;
};

/** PATCH /api/resources/:id/status?status=ACTIVE|OUT_OF_SERVICE */
export const updateResourceStatus = async (id, status) => {
  const res = await api.patch(`/api/resources/${id}/status`, null, {
    params: { status },
  });
  return res.data;
};
