import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const buildParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );

export const createBooking = async (payload) => {
  const response = await api.post('/api/bookings', payload);
  return response.data;
};

export const getMyBookings = async (status) => {
  const response = await api.get('/api/bookings/my', {
    params: buildParams({ status }),
  });
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/api/bookings/${id}`);
  return response.data;
};

export const getAllBookings = async (filters = {}) => {
  const response = await api.get('/api/bookings', {
    params: buildParams(filters),
  });
  return response.data;
};

export const reviewBooking = async (id, payload) => {
  const response = await api.patch(`/api/bookings/${id}/decision`, payload);
  return response.data;
};

export const cancelBooking = async (id, payload = {}) => {
  const response = await api.patch(`/api/bookings/${id}/cancel`, payload);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/api/bookings/${id}`);
  return response.data;
};
