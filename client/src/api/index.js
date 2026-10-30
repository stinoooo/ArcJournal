import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://arcjournal-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// The Arcnode access token lives in the main process. It refreshes it when needed
// and never hands the renderer the long-lived refresh token.
api.interceptors.request.use(async (config) => {
  const token = await window.electronAPI?.auth.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const listeners = new Set();
export function onSignedOut(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) listeners.forEach((l) => l());
    return Promise.reject(err);
  },
);

export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') return 'Cannot reach ArcJournal. Check your connection.';
  return err?.message && err.name !== 'AxiosError' ? err.message : fallback;
}

export const authAPI = {
  me: () => api.get('/auth/me'),
};

export const vaultAPI = {
  get: () => api.get('/vault'),
  save: (vault, replace = false) => api.put('/vault', { vault, replace }),
  reset: () => api.post('/vault/reset', { confirm: 'DELETE MY JOURNAL' }),
};

// Raw, sealed entries. Pages use the decrypting store in lib/journal.js.
export const sealedEntriesAPI = {
  list: (params) => api.get('/entries', { params }),
  versions: (id) => api.get(`/entries/${id}/versions`),
  create: (data) => api.post('/entries', data),
  update: (id, data) => api.put(`/entries/${id}`, data),
  delete: (id) => api.delete(`/entries/${id}`),
};

export const userAPI = {
  completeOnboarding: (data) => api.put('/user/onboarding', data),
  deleteAccount: () => api.delete('/user'),
  deleteAllEntries: () => api.delete('/user/entries'),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  linkLegacy: (identifier, password) => api.post('/user/link-legacy', { identifier, password }),
};

export { entriesAPI, statsAPI } from '../lib/journal';

export default api;
