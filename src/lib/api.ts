import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('locallink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

export function setAuth(token: string, user: unknown) {
  localStorage.setItem('locallink_token', token);
  localStorage.setItem('locallink_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('locallink_token');
  localStorage.removeItem('locallink_user');
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem('locallink_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('locallink_token');
}
