import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Pre-configured Axios instance for SmartServe API.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Automatically attaches the JWT token from localStorage.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartserve_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Handles standard errors.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if server reports expired or invalid token
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
      if (!isAuthEndpoint) {
        localStorage.removeItem('smartserve_token');
        localStorage.removeItem('smartserve_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
