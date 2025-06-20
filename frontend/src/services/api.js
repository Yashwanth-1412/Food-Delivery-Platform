import axios from 'axios';
import { authService } from '../firebase/auth';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await authService.getCurrentUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error adding auth token:', error);
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error - redirecting to login');
      // Token expired or invalid
      // Don't redirect here, let the component handle it
    }
    return Promise.reject(error);
  }
);

export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

export const authAPI = {
  verifyToken: (token) => api.post('/auth/verify', { token }),
  getProfile: () => api.get('/profile'),
};

export default api;