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

export const getResources = async (filters = {}) => {
  const response = await api.get('/api/resources', { params: buildParams(filters) });
  return response.data;
};

export const getResourceById = async (id) => {
  const response = await api.get(`/api/resources/${id}`);
  return response.data;
};
