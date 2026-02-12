import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Inject auth token
api.interceptors.request.use(async (config) => {
  let token = null;
  if (window.electronAPI?.getToken) {
    token = await window.electronAPI.getToken();
  } else {
    token = sessionStorage.getItem('arc_token');
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function storeToken(token) {
  if (window.electronAPI?.storeToken) {
    await window.electronAPI.storeToken(token);
  } else {
    sessionStorage.setItem('arc_token', token);
  }
}

export async function clearToken() {
  if (window.electronAPI?.clearToken) {
    await window.electronAPI.clearToken();
  } else {
    sessionStorage.removeItem('arc_token');
  }
}

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Entries — multiple per day
export const entriesAPI = {
  create: (data) => api.post('/entries', data),
  list: (params) => api.get('/entries', { params }),
  getByDate: (date) => api.get('/entries', { params: { date } }),
  getById: (id) => api.get(`/entries/${id}`),
  update: (id, data) => api.put(`/entries/${id}`, data),
  delete: (id) => api.delete(`/entries/${id}`),
};

// Wraps — stats only
export const wrapsAPI = {
  generate: (weekStart) => api.post(`/wraps/generate?weekStart=${weekStart}`),
  list: () => api.get('/wraps'),
  getById: (id) => api.get(`/wraps/${id}`),
};

// User
export const userAPI = {
  completeOnboarding: (data) => api.put('/user/onboarding', data),
  deleteAccount: () => api.delete('/user'),
  deleteAllEntries: () => api.delete('/user/entries'),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};

// Stats
export const statsAPI = {
  get: (params) => api.get('/stats', { params }),
};

export default api;
