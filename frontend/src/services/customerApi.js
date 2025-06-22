// frontend/src/services/customerApi.js - Fixed API base URL
import { auth } from '../firebase/config';

const API_BASE_URL = 'http://localhost:5000/api';  // Make sure no trailing slash

class CustomerService {
  constructor() {
    this.token = null;
  }

  async getAuthToken() {
    if (auth.currentUser) {
      this.token = await auth.currentUser.getIdToken();
    }
    return this.token;
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Ensure endpoint starts with / but no double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    
    console.log('Making request to:', url); // Debug log
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== RESTAURANT DISCOVERY =====
  
  async getAvailableRestaurants(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.cuisine) queryParams.append('cuisine', filters.cuisine);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.is_open !== undefined) queryParams.append('is_open', filters.is_open);
      if (filters.min_rating) queryParams.append('min_rating', filters.min_rating);
      
      const endpoint = `/customer/restaurants${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      // Return mock data if API fails
      return this.getMockRestaurants();
    }
  }

  async getRestaurantDetails(restaurantId) {
    try {
      return await this.makeRequest(`/customer/restaurants/${restaurantId}`);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      throw error;
    }
  }

  async getRestaurantMenu(restaurantId) {
    try {
      return await this.makeRequest(`/customer/restaurants/${restaurantId}/menu`);
    } catch (error) {
      console.error('Error fetching restaurant menu:', error);
      // Return mock data if API fails
      return this.getMockMenu(restaurantId);
    }
  }

  // ===== ORDER MANAGEMENT =====
  
  async createOrder(orderData) {
    try {
      return await this.makeRequest('/customer/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getMyOrders(status = null, limit = 20) {
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (limit) queryParams.append('limit', limit.toString());
      
      const endpoint = `/customer/orders${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderDetails(orderId) {
    try {
      return await this.makeRequest(`/customer/orders/${orderId}`);
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      return await this.makeRequest(`/customer/orders/${orderId}/cancel`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  // ===== CUSTOMER PROFILE =====
  
  async getProfile() {
    try {
      return await this.makeRequest('/customer/profile');
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      return await this.makeRequest('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }

  // ===== SEARCH & DISCOVERY =====
  
  async searchRestaurants(query) {
    try {
      return await this.makeRequest(`/customer/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }
  }

  async getCuisineTypes() {
    try {
      return await this.makeRequest('/customer/cuisines');
    } catch (error) {
      console.error('Error fetching cuisine types:', error);
      throw error;
    }
  }

  // ===== DELIVERY ADDRESSES =====
  
  async addDeliveryAddress(addressData) {
    try {
      return await this.makeRequest('/customer/addresses', {
        method: 'POST',
        body: JSON.stringify(addressData),
      });
    } catch (error) {
      console.error('Error adding delivery address:', error);
      throw error;
    }
  }

  async getDeliveryAddresses() {
    try {
      return await this.makeRequest('/customer/addresses');
    } catch (error) {
      console.error('Error fetching delivery addresses:', error);
      throw error;
    }
  }

  async updateDeliveryAddress(addressId, addressData) {
    try {
      return await this.makeRequest(`/customer/addresses/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify(addressData),
      });
    } catch (error) {
      console.error('Error updating delivery address:', error);
      throw error;
    }
  }

  async deleteDeliveryAddress(addressId) {
    try {
      return await this.makeRequest(`/customer/addresses/${addressId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting delivery address:', error);
      throw error;
    }
  }

  // ===== FAVORITES =====
  
  async addToFavorites(restaurantId) {
    try {
      return await this.makeRequest('/customer/favorites', {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(restaurantId) {
    try {
      return await this.makeRequest(`/customer/favorites/${restaurantId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getFavoriteRestaurants() {
    try {
      return await this.makeRequest('/customer/favorites');
    } catch (error) {
      console.error('Error fetching favorite restaurants:', error);
      throw error;
    }
  }

  // ===== MOCK DATA (for development when backend is not ready) =====
  
  getMockRestaurants() {
    return {
      success: true,
      data: [
        {
          id: 'rest1',
          name: 'Pizza Palace',
          description: 'Authentic Italian pizza with fresh ingredients',
          cuisine: 'Italian',
          rating: 4.5,
          delivery_time: '25-35 min',
          delivery_fee: 2.99,
          min_order: 15.00,
          is_open: true,
          image_url: '/api/placeholder/300/200',
          address: '123 Main St, City',
          phone: '(555) 123-4567'
        },
        {
          id: 'rest2',
          name: 'Burger Junction',
          description: 'Gourmet burgers and crispy fries',
          cuisine: 'American',
          rating: 4.3,
          delivery_time: '20-30 min',
          delivery_fee: 1.99,
          min_order: 12.00,
          is_open: true,
          image_url: '/api/placeholder/300/200',
          address: '456 Oak Ave, City',
          phone: '(555) 234-5678'
        },
        {
          id: 'rest3',
          name: 'Sushi Zen',
          description: 'Fresh sushi and Japanese cuisine',
          cuisine: 'Japanese',
          rating: 4.7,
          delivery_time: '30-40 min',
          delivery_fee: 3.99,
          min_order: 20.00,
          is_open: false,
          image_url: '/api/placeholder/300/200',
          address: '789 Pine St, City',
          phone: '(555) 345-6789'
        }
      ]
    };
  }

  getMockMenu(restaurantId) {
    const menus = {
      'rest1': {
        success: true,
        data: {
          restaurant: {
            id: 'rest1',
            name: 'Pizza Palace',
            description: 'Authentic Italian pizza with fresh ingredients'
          },
          categories: [
            {
              id: 'cat1',
              name: 'Pizzas',
              description: 'Our signature pizzas',
              items: [
                {
                  id: 'item1',
                  name: 'Margherita Pizza',
                  description: 'Fresh tomatoes, mozzarella, and basil',
                  price: 14.99,
                  image_url: '/api/placeholder/200/150',
                  is_available: true,
                  prep_time: 15,
                  is_vegetarian: true
                },
                {
                  id: 'item2',
                  name: 'Pepperoni Pizza',
                  description: 'Classic pepperoni with mozzarella cheese',
                  price: 16.99,
                  image_url: '/api/placeholder/200/150',
                  is_available: true,
                  prep_time: 15,
                  is_vegetarian: false
                }
              ]
            },
            {
              id: 'cat2',
              name: 'Sides',
              description: 'Perfect accompaniments',
              items: [
                {
                  id: 'item3',
                  name: 'Garlic Bread',
                  description: 'Crispy bread with garlic butter',
                  price: 6.99,
                  image_url: '/api/placeholder/200/150',
                  is_available: true,
                  prep_time: 8,
                  is_vegetarian: true
                }
              ]
            }
          ]
        }
      }
    };

    return menus[restaurantId] || { success: false, error: 'Restaurant not found' };
  }
}

const customerService = new CustomerService();
export { customerService };
export default customerService;
