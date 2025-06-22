// frontend/src/services/agentApi.js
import  api  from './api';

export const agentService = {
  // ===== AVAILABLE ORDERS =====
  
  async getAvailableOrders(radius = 10, limit = 20) {
    try {
      const response = await api.get('/agent/available-orders', {
        params: { radius, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting available orders:', error);
      throw error;
    }
  },

  async acceptOrder(orderId, estimatedPickupMinutes = 15) {
    try {
      const response = await api.post(`/agent/orders/${orderId}/accept`, {
        estimated_pickup_minutes: estimatedPickupMinutes
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  },

  // ===== ACTIVE DELIVERIES =====
  
  async getActiveOrders() {
    try {
      const response = await api.get('/agent/active-orders');
      return response.data;
    } catch (error) {
      console.error('Error getting active orders:', error);
      throw error;
    }
  },

  async updateDeliveryStatus(orderId, status, location = null) {
    try {
      const payload = { status };
      if (location) {
        payload.location = location;
      }
      
      const response = await api.put(`/agent/orders/${orderId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  },

  // ===== DELIVERY HISTORY & EARNINGS =====
  
  async getDeliveryHistory(startDate = null, endDate = null, limit = 50) {
    try {
      const params = { limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/agent/delivery-history', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting delivery history:', error);
      throw error;
    }
  },

  async getEarnings(period = 'today') {
    try {
      const response = await api.get('/agent/earnings', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting earnings:', error);
      throw error;
    }
  },

  // ===== AGENT PROFILE & STATUS =====
  
  async getProfile() {
    try {
      const response = await api.get('/agent/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting agent profile:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/agent/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating agent profile:', error);
      throw error;
    }
  },

  async updateStatus(status, location = null) {
    try {
      const payload = { status };
      if (location) {
        payload.location = location;
      }
      
      const response = await api.put('/agent/status', payload);
      return response.data;
    } catch (error) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  },

  // ===== HELPER METHODS =====
  
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  async updateLocationAndStatus(status) {
    try {
      const location = await this.getCurrentLocation();
      return await this.updateStatus(status, location);
    } catch (error) {
      // If location fails, still try to update status without location
      console.warn('Could not get location, updating status only:', error);
      return await this.updateStatus(status);
    }
  }
};