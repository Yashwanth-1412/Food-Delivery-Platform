// frontend/src/services/restaurantApi.js - COMPLETE VERSION
import api from './api';

export const restaurantService = {
  // ===== RESTAURANT PROFILE =====
  
  async getProfile() {
    try {
      const response = await api.get('/restaurants/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant profile:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/restaurants/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating restaurant profile:', error);
      throw error;
    }
  },

  async getSettings() {
    try {
      const response = await api.get('/restaurants/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant settings:', error);
      throw error;
    }
  },

  async updateSettings(settingsData) {
    try {
      const response = await api.put('/restaurants/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      throw error;
    }
  },

  // ===== LOGO UPLOAD =====
  
  async uploadRestaurantLogo(logoFile) {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      const response = await api.post('/restaurants/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading restaurant logo:', error);
      throw error;
    }
  },

  // ===== MENU CATEGORIES =====
  
  async getCategories() {
    try {
      const response = await api.get('/restaurants/categories');
      return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  async createCategory(categoryData) {
    try {
      const response = await api.post('/restaurants/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(`/restaurants/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(`/restaurants/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  async toggleCategoryAvailability(categoryId) {
    try {
      const response = await api.put(`/restaurants/categories/${categoryId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling category availability:', error);
      throw error;
    }
  },

  // ===== MENU ITEMS =====
  
  async getMenuItems(categoryId = null) {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await api.get('/restaurants/menu-items', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting menu items:', error);
      throw error;
    }
  },

  async createMenuItem(itemData) {
    try {
      const response = await api.post('/restaurants/menu-items', itemData);
      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  },

  async updateMenuItem(itemId, itemData) {
    try {
      const response = await api.put(`/restaurants/menu-items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  async deleteMenuItem(itemId) {
    try {
      const response = await api.delete(`/restaurants/menu-items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  async toggleMenuItemAvailability(itemId) {
    try {
      const response = await api.put(`/restaurants/menu-items/${itemId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      throw error;
    }
  },

  async uploadMenuItemImage(itemId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/restaurants/menu/items/${itemId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      throw error;
    }
  },

  // ===== ORDERS =====
  
  async getOrders(status = null, limit = 50) {
    try {
      const params = {};
      if (status) params.status = status;
      if (limit) params.limit = limit;
      
      const response = await api.get('/restaurants/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const response = await api.put(`/restaurants/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====
  
  async getStats() {
    try {
      const response = await api.get('/restaurants/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant stats:', error);
      throw error;
    }
  },

  async getAnalytics(period = 'week') {
    try {
      const response = await api.get('/restaurants/analytics', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant analytics:', error);
      throw error;
    }
  },

  async getMenuSummary() {
    try {
      const response = await api.get('/restaurants/menu/summary');
      return response.data;
    } catch (error) {
      console.error('Error getting menu summary:', error);
      throw error;
    }
  }
};