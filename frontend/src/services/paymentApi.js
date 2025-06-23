// frontend/src/services/paymentApi.js - Updated for Payment Links
import api from './api';

export const paymentAPI = {
  // Create payment link
  createPaymentLink: async (linkAmount, customerPhone, orderInfo = {}) => {
    try {
      const response = await api.post('/payment/create-link', {
        link_amount: linkAmount,
        customer_phone: customerPhone,
        restaurant_name: orderInfo.restaurant_name,
        restaurant_id: orderInfo.restaurant_id
      });
      
      return response.data;
    } catch (error) {
      console.error('Payment link creation failed:', error);
      throw error;
    }
  },

  // Check payment link status
  checkLinkStatus: async (cfLinkId) => {
    try {
      const response = await api.get(`/payment/check-link-status/${cfLinkId}`);
      return response.data;
    } catch (error) {
      console.error('Payment link status check failed:', error);
      throw error;
    }
  }
};

export default paymentAPI;