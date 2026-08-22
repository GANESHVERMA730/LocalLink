import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

function apiOrigin() {
  return API_URL.replace(/\/api\/?$/, '');
}

/** Resolve stored media paths (e.g. /uploads/…) to the backend origin. */
export function resolveMediaUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${apiOrigin()}${path}`;
}

// Attach JWT to every request. Never force JSON Content-Type: Axios would then
// send FormData as JSON and multer would never see req.file.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('locallink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('locallink_token');
      localStorage.removeItem('locallink_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function setAuth(token, user) {
  localStorage.setItem('locallink_token', token);
  localStorage.setItem('locallink_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('locallink_token');
  localStorage.removeItem('locallink_user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('locallink_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('locallink_token');
}
