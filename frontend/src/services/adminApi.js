// Admin API Service for management features
import api from './api';

export const adminApi = {
  // ===== USER MANAGEMENT =====
  
  // Get all users with filtering
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user details
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Suspend user
  suspendUser: async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/suspend`, { reason });
    return response.data;
  },

  // Activate user
  activateUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ===== SYSTEM OVERVIEW =====
  
  // Get system statistics
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/admin/activities?limit=${limit}`);
    return response.data;
  },

  // ===== RESTAURANT MANAGEMENT =====
  
  // Get all restaurants
  getAllRestaurants: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/admin/restaurants?${queryString}` : '/admin/restaurants';
    
    const response = await api.get(url);
    return response.data;
  },

  // Approve restaurant
  approveRestaurant: async (restaurantId) => {
    const response = await api.post(`/admin/restaurants/${restaurantId}/approve`);
    return response.data;
  },

  // Reject restaurant
  rejectRestaurant: async (restaurantId, reason) => {
    const response = await api.post(`/admin/restaurants/${restaurantId}/reject`, { reason });
    return response.data;
  },

  // Suspend restaurant
  suspendRestaurant: async (restaurantId, reason) => {
    const response = await api.post(`/admin/restaurants/${restaurantId}/suspend`, { reason });
    return response.data;
  },

  // ===== ORDER MONITORING =====
  
  // Get all orders
  getAllOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    
    const queryString = params.toString();
    const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  // Update order status (admin override)
  updateOrderStatus: async (orderId, status, reason) => {
    const response = await api.put(`/admin/orders/${orderId}/status`, { 
      status, 
      reason 
    });
    return response.data;
  },

  // ===== PLATFORM SETTINGS =====
  
  // Get platform settings
  getPlatformSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  // Update platform settings
  updatePlatformSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  // ===== ANALYTICS =====
  
  // Get revenue analytics
  getRevenueAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics/revenue?period=${period}`);
    return response.data;
  },

  // Get order analytics
  getOrderAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics/orders?period=${period}`);
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics/users?period=${period}`);
    return response.data;
  },

  // Get restaurant analytics
  getRestaurantAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics/restaurants?period=${period}`);
    return response.data;
  },

  // ===== SYSTEM HEALTH =====
  
  // Get system health status
  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },

  // Generate system report
  generateSystemReport: async (period = '24h') => {
    const response = await api.post('/admin/reports/generate', { period });
    return response.data;
  },

  // ===== NOTIFICATIONS =====
  
  // Send notification to user
  sendNotification: async (userId, notification) => {
    const response = await api.post(`/admin/notifications/send`, {
      user_id: userId,
      ...notification
    });
    return response.data;
  },

  // Send bulk notification
  sendBulkNotification: async (filters, notification) => {
    const response = await api.post('/admin/notifications/bulk', {
      filters,
      notification
    });
    return response.data;
  },

  // ===== ERROR HANDLING =====
  
  // Get system errors/logs
  getSystemLogs: async (level = 'error', limit = 100) => {
    const response = await api.get(`/admin/logs?level=${level}&limit=${limit}`);
    return response.data;
  }
};

export default adminApi;