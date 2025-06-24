// frontend/src/components/Admin/RestaurantManagement.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    cuisine: 'all',
    search: ''
  });

  useEffect(() => {
    loadRestaurants();
  }, [filters]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      // Mock data for development
      const mockRestaurants = [
        {
          id: '1',
          name: 'Pizza Palace',
          email: 'owner@pizzapalace.com',
          phone: '(555) 123-4567',
          cuisine: 'Italian',
          status: 'active',
          address: '123 Main St, City, State',
          rating: 4.5,
          totalOrders: 847,
          revenue: 12345.67,
          joinedDate: '2024-01-15T10:30:00Z',
          lastActive: '2024-01-20T14:22:00Z',
          isApproved: true,
          menuItems: 23
        },
        {
          id: '2',
          name: 'Burger Barn',
          email: 'contact@burgerbarn.com',
          phone: '(555) 234-5678',
          cuisine: 'American',
          status: 'active',
          address: '456 Oak Ave, City, State',
          rating: 4.2,
          totalOrders: 623,
          revenue: 8967.43,
          joinedDate: '2024-01-10T09:15:00Z',
          lastActive: '2024-01-20T16:45:00Z',
          isApproved: true,
          menuItems: 18
        },
        {
          id: '3',
          name: 'Taco Fiesta',
          email: 'hello@tacofiesta.com',
          phone: '(555) 345-6789',
          cuisine: 'Mexican',
          status: 'pending',
          address: '789 Pine St, City, State',
          rating: 0,
          totalOrders: 0,
          revenue: 0,
          joinedDate: '2024-01-18T11:20:00Z',
          lastActive: '2024-01-18T11:20:00Z',
          isApproved: false,
          menuItems: 5
        },
        {
          id: '4',
          name: 'Sushi Zen',
          email: 'info@sushizen.com',
          phone: '(555) 456-7890',
          cuisine: 'Japanese',
          status: 'suspended',
          address: '321 First Ave, City, State',
          rating: 3.8,
          totalOrders: 234,
          revenue: 3456.78,
          joinedDate: '2024-01-08T08:00:00Z',
          lastActive: '2024-01-15T12:00:00Z',
          isApproved: true,
          menuItems: 31,
          suspendReason: 'Health code violations'
        }
      ];

      // Apply filters
      let filteredRestaurants = mockRestaurants;
      
      if (filters.status !== 'all') {
        filteredRestaurants = filteredRestaurants.filter(restaurant => restaurant.status === filters.status);
      }
      
      if (filters.cuisine !== 'all') {
        filteredRestaurants = filteredRestaurants.filter(restaurant => restaurant.cuisine === filters.cuisine);
      }
      
      if (filters.search) {
        filteredRestaurants = filteredRestaurants.filter(restaurant => 
          restaurant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          restaurant.email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setRestaurants(filteredRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRestaurant = async (restaurantId) => {
    try {
      await adminService.approveRestaurant(restaurantId);
      loadRestaurants();
      alert('Restaurant approved successfully');
    } catch (error) {
      console.error('Error approving restaurant:', error);
      alert('Failed to approve restaurant');
    }
  };

  const handleSuspendRestaurant = async (restaurantId, reason) => {
    if (!reason) {
      reason = prompt('Please provide a reason for suspension:');
      if (!reason) return;
    }

    try {
      await adminService.suspendRestaurant(restaurantId, reason);
      loadRestaurants();
      alert('Restaurant suspended successfully');
    } catch (error) {
      console.error('Error suspending restaurant:', error);
      alert('Failed to suspend restaurant');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const RestaurantDetailModal = ({ restaurant, onClose }) => {
    if (!restaurant) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Restaurant Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{restaurant.name}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{restaurant.email}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{restaurant.phone}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Cuisine</label>
                  <p className="text-gray-900">{restaurant.cuisine}</p>
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700">Address</label>
                  <p className="text-gray-900">{restaurant.address}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(restaurant.status)}`}>
                    {restaurant.status}
                  </span>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Rating</label>
                  <p className="text-gray-900">{restaurant.rating}/5.0 ⭐</p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">Total Orders</label>
                  <p className="text-gray-900">{restaurant.totalOrders}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Revenue</label>
                  <p className="text-gray-900">${restaurant.revenue}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Menu Items</label>
                  <p className="text-gray-900">{restaurant.menuItems}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Joined</label>
                  <p className="text-gray-900">{formatDate(restaurant.joinedDate)}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Last Active</label>
                  <p className="text-gray-900">{formatDate(restaurant.lastActive)}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Approved</label>
                  <p className="text-gray-900">{restaurant.isApproved ? 'Yes' : 'No'}</p>
                </div>
                
                {restaurant.suspendReason && (
                  <div className="col-span-2">
                    <label className="block font-medium text-gray-700">Suspension Reason</label>
                    <p className="text-red-600">{restaurant.suspendReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            {restaurant.status === 'pending' && (
              <button
                onClick={() => handleApproveRestaurant(restaurant.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve Restaurant
              </button>
            )}
            
            {restaurant.status === 'active' && (
              <button
                onClick={() => handleSuspendRestaurant(restaurant.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Suspend Restaurant
              </button>
            )}
            
            <button
              onClick={() => alert('View detailed analytics (feature coming soon)')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Analytics
            </button>
            
            <button
              onClick={() => alert('Send message to restaurant (feature coming soon)')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <span className="text-2xl">🏪</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${restaurants.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
            <select
              value={filters.cuisine}
              onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cuisines</option>
              <option value="Italian">Italian</option>
              <option value="American">American</option>
              <option value="Mexican">Mexican</option>
              <option value="Japanese">Japanese</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadRestaurants}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Restaurants ({restaurants.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuisine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.cuisine}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(restaurant.status)}`}>
                        {restaurant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${restaurant.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.rating > 0 ? `${restaurant.rating}/5.0` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setShowRestaurantModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                      
                      {restaurant.status === 'pending' && (
                        <button
                          onClick={() => handleApproveRestaurant(restaurant.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Approve
                        </button>
                      )}
                      
                      {restaurant.status === 'active' && (
                        <button
                          onClick={() => handleSuspendRestaurant(restaurant.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restaurant Detail Modal */}
      {showRestaurantModal && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowRestaurantModal(false);
            setSelectedRestaurant(null);
          }}
        />
      )}
    </div>
  );
};

export default RestaurantManagement;