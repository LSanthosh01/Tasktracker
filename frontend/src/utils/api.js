import axios from 'axios';

const rawApiUrl = process.env.REACT_APP_API_URL || '/api';
const API_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tasktrack_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tasktrack_token');
      localStorage.removeItem('tasktrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
