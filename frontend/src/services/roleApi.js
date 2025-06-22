import axios from 'axios';
import { authService } from '../firebase/auth';

const API_BASE_URL = 'http://localhost:5000/api';

const roleApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
roleApi.interceptors.request.use(async (config) => {
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
roleApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error in role API');
    }
    return Promise.reject(error);
  }
);

export const roleService = {
  // Get current user's role
  getMyRole: async () => {
    try {
      const response = await roleApi.get('/roles/my-role');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }
  },

  // Assign role to user (for new signups)
  assignRole: async (uid, role) => {
    try {
      const response = await roleApi.post('/roles/assign', {
        uid: uid,
        role: role
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  // Get specific user's role (admin only)
  getUserRole: async (uid) => {
    try {
      const response = await roleApi.get(`/roles/user/${uid}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user role:', error);
      throw error;
    }
  },

  // Get all available roles and permissions
  getAvailableRoles: async () => {
    try {
      const response = await roleApi.get('/roles/permissions');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching available roles:', error);
      throw error;
    }
  },

  // Check if user has specific permission
  checkPermission: async (permission) => {
    try {
      const response = await roleApi.post('/roles/check-permission', {
        permission
      });
      return response.data.data.has_permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  // Get role-specific data
  getRoleData: async () => {
    try {
      const response = await roleApi.get('/roles/role-data');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching role data:', error);
      throw error;
    }
  },

  // Update role-specific data
  updateRoleData: async (data) => {
    try {
      const response = await roleApi.put('/roles/role-data', data);
      return response.data;
    } catch (error) {
      console.error('Error updating role data:', error);
      throw error;
    }
  },
  
  // Update current user's password
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const response = await roleApi.put('/roles/update-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

};

export default roleService;