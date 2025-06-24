// frontend/src/services/adminApi.js - ADMIN API SERVICE
import api from './api';

export const adminService = {
  // ===== SYSTEM OVERVIEW =====
  
  async getSystemStats() {
    try {
      const response = await api.get('/admin/system/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting system stats:', error);
      // Return mock data for development
      return {
        success: true,
        data: {
          totalUsers: 156,
          totalRestaurants: 23,
          totalOrders: 1847,
          totalRevenue: 45678.90,
          activeOrders: 12,
          activeAgents: 8,
          todayOrders: 89,
          todayRevenue: 2345.67,
          platformHealth: 'healthy'
        }
      };
    }
  },

  async getSystemNotifications() {
    try {
      const response = await api.get('/admin/system/notifications');
      return response.data;
    } catch (error) {
      console.error('Error getting system notifications:', error);
      return {
        success: true,
        data: [
          {
            id: 1,
            title: 'High Order Volume',
            message: 'Orders increased by 25% today',
            type: 'info',
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
  },

  async getRecentActivity() {
    try {
      const response = await api.get('/admin/system/activity');
      return response.data;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  },

  // ===== USER MANAGEMENT =====
  
  async getAllUsers(filters = {}) {
    try {
      const response = await api.get('/admin/users', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  async getUserDetails(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  },

  async updateUserRole(userId, role) {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  async suspendUser(userId, reason) {
    try {
      const response = await api.put(`/admin/users/${userId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  },

  async activateUser(userId) {
    try {
      const response = await api.put(`/admin/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // ===== RESTAURANT MANAGEMENT =====
  
  async getAllRestaurants(filters = {}) {
    try {
      const response = await api.get('/admin/restaurants', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting all restaurants:', error);
      throw error;
    }
  },

  async getRestaurantDetails(restaurantId) {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant details:', error);
      throw error;
    }
  },

  async approveRestaurant(restaurantId) {
    try {
      const response = await api.put(`/admin/restaurants/${restaurantId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving restaurant:', error);
      throw error;
    }
  },

  async suspendRestaurant(restaurantId, reason) {
    try {
      const response = await api.put(`/admin/restaurants/${restaurantId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error suspending restaurant:', error);
      throw error;
    }
  },

  async getRestaurantStats(restaurantId) {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant stats:', error);
      throw error;
    }
  },

  // ===== ORDER MONITORING =====
  
  async getAllOrders(filters = {}) {
    try {
      const response = await api.get('/admin/orders', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  },

  async getOrderDetails(orderId) {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  },

  async refundOrder(orderId, amount, reason) {
    try {
      const response = await api.post(`/admin/orders/${orderId}/refund`, {
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  async resolveOrderIssue(orderId, resolution) {
    try {
      const response = await api.put(`/admin/orders/${orderId}/resolve`, {
        resolution
      });
      return response.data;
    } catch (error) {
      console.error('Error resolving order issue:', error);
      throw error;
    }
  },

  async getOrderStatistics(period = 'week') {
    try {
      const response = await api.get('/admin/orders/statistics', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  },

  // ===== ANALYTICS =====
  
  async getPlatformAnalytics(period = 'week') {
    try {
      const response = await api.get('/admin/analytics/platform', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw error;
    }
  },

  async getRevenueAnalytics(period = 'week') {
    try {
      const response = await api.get('/admin/analytics/revenue', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  },

  async getUserAnalytics(period = 'week') {
    try {
      const response = await api.get('/admin/analytics/users', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  },

  async getPerformanceMetrics() {
    try {
      const response = await api.get('/admin/analytics/performance');
      return response.data;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  },

  // ===== PLATFORM SETTINGS =====
  
  async getPlatformSettings() {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting platform settings:', error);
      throw error;
    }
  },

  async updatePlatformSettings(settings) {
    try {
      const response = await api.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating platform settings:', error);
      throw error;
    }
  },

  async getEmailTemplates() {
    try {
      const response = await api.get('/admin/settings/email-templates');
      return response.data;
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  },

  async updateEmailTemplate(templateId, templateData) {
    try {
      const response = await api.put(`/admin/settings/email-templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  },

  // ===== SYSTEM MAINTENANCE =====
  
  async runSystemBackup() {
    try {
      const response = await api.post('/admin/system/backup');
      return response.data;
    } catch (error) {
      console.error('Error running system backup:', error);
      throw error;
    }
  },

  async clearSystemCache() {
    try {
      const response = await api.post('/admin/system/clear-cache');
      return response.data;
    } catch (error) {
      console.error('Error clearing system cache:', error);
      throw error;
    }
  },

  async getSystemLogs(level = 'error', limit = 100) {
    try {
      const response = await api.get('/admin/system/logs', {
        params: { level, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting system logs:', error);
      throw error;
    }
  },

  // ===== REPORTS =====
  
  async generateReport(reportType, params = {}) {
    try {
      const response = await api.post('/admin/reports/generate', {
        type: reportType,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  async downloadReport(reportId) {
    try {
      const response = await api.get(`/admin/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }
};