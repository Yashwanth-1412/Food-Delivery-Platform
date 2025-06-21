import axios from 'axios';
import { authService } from '../firebase/auth';

const API_BASE_URL = 'http://localhost:5000/api';

const restaurantApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
restaurantApi.interceptors.request.use(async (config) => {
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
restaurantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error in restaurant API');
    }
    return Promise.reject(error);
  }
);

export const restaurantService = {
  // ===== RESTAURANT PROFILE =====
  getProfile: async () => {
    try {
      const response = await restaurantApi.get('/restaurants/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await restaurantApi.put('/restaurants/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating restaurant profile:', error);
      throw error;
    }
  },

  // ===== RESTAURANT SETTINGS =====
  getSettings: async () => {
    try {
      const response = await restaurantApi.get('/restaurants/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      throw error;
    }
  },

  updateSettings: async (settingsData) => {
    try {
      const response = await restaurantApi.put('/restaurants/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      throw error;
    }
  },

  // ===== MENU CATEGORIES =====
  getCategories: async () => {
    try {
      const response = await restaurantApi.get('/restaurants/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await restaurantApi.post('/restaurants/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating menu category:', error);
      throw error;
    }
  },

  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await restaurantApi.put(`/restaurants/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu category:', error);
      throw error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await restaurantApi.delete(`/restaurants/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu category:', error);
      throw error;
    }
  },

  // ===== MENU ITEMS =====
  getMenuItems: async (categoryId = null) => {
    try {
      const url = categoryId 
        ? `/restaurants/menu-items?category_id=${categoryId}`
        : '/restaurants/menu-items';
      const response = await restaurantApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  },

  createMenuItem: async (itemData) => {
    try {
      const response = await restaurantApi.post('/restaurants/menu-items', itemData);
      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  },

  updateMenuItem: async (itemId, itemData) => {
    try {
      const response = await restaurantApi.put(`/restaurants/menu-items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  deleteMenuItem: async (itemId) => {
    try {
      const response = await restaurantApi.delete(`/restaurants/menu-items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  toggleMenuItemAvailability: async (itemId) => {
    try {
      const response = await restaurantApi.put(`/restaurants/menu-items/${itemId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      throw error;
    }
  },

  // ===== MENU ITEM IMAGE UPLOAD =====
  uploadMenuItemImage: async (itemId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await restaurantApi.post(
        `/restaurants/menu-items/${itemId}/image`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      throw error;
    }
  },

  // ===== ORDERS MANAGEMENT =====
  getOrders: async (status = null, limit = 50) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit.toString());
      
      const url = `/restaurants/orders${params.toString() ? '?' + params.toString() : ''}`;
      const response = await restaurantApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await restaurantApi.put(`/restaurants/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // ===== ANALYTICS & REPORTING =====
  getMenuSummary: async () => {
    try {
      const response = await restaurantApi.get('/restaurants/menu/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching menu summary:', error);
      throw error;
    }
  },

  searchMenuItems: async (searchTerm) => {
    try {
      const response = await restaurantApi.get(`/restaurants/menu-items/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw error;
    }
  }
};