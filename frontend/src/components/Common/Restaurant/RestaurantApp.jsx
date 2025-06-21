import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../../services/restaurantApi';

// Component imports (we'll create these)
import MenuCategoryManager from './MenuCategoryManager';
import MenuItemManager from './MenuItemManager';
import RestaurantProfile from './RestaurantProfile';
//import OrdersManager from './OrdersManager';

const RestaurantApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch restaurant profile on mount
  useEffect(() => {
    fetchRestaurantProfile();
  }, []);

  const fetchRestaurantProfile = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getProfile();
      setRestaurantProfile(response.data);
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
      if (error.response?.status === 404) {
        // No restaurant profile exists - show setup
        setError('Restaurant profile not found. Please complete your restaurant setup.');
      } else {
        setError('Failed to load restaurant profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
      description: 'Overview & Statistics'
    },
    {
      id: 'profile',
      name: 'Restaurant Profile',
      icon: '🏪',
      description: 'Basic Information'
    },
    {
      id: 'categories',
      name: 'Menu Categories',
      icon: '📂',
      description: 'Organize Your Menu'
    },
    {
      id: 'menu',
      name: 'Menu Items',
      icon: '🍽️',
      description: 'Manage Dishes'
    },
    {
      id: 'orders',
      name: 'Orders',
      icon: '📋',
      description: 'Incoming Orders'
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview profile={restaurantProfile} />;
      case 'profile':
        return <RestaurantProfile profile={restaurantProfile} onUpdate={fetchRestaurantProfile} />;
      case 'categories':
        return <MenuCategoryManager />;
      case 'menu':
        return <MenuItemManager />;
      case 'orders':
        return <OrdersManager />;
      default:
        return <DashboardOverview profile={restaurantProfile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-2xl">🏪</span>
                <h1 className="ml-2 text-xl font-semibold text-gray-900">
                  {restaurantProfile?.name || 'Restaurant Dashboard'}
                </h1>
              </div>
              {restaurantProfile?.is_open !== undefined && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  restaurantProfile.is_open 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {restaurantProfile.is_open ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Attention Required</h3>
                <p className="mt-1 text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu</h2>
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === item.id
                            ? 'bg-green-100 text-green-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{item.icon}</span>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {renderActiveTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ profile }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch dashboard stats here
    setTimeout(() => {
      setStats({
        totalOrders: 156,
        todayOrders: 23,
        menuItems: 45,
        revenue: 2840
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Menu Items</p>
              <p className="text-2xl font-bold text-green-900">{stats?.menuItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Today's Orders</p>
              <p className="text-2xl font-bold text-yellow-900">{stats?.todayOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-900">${stats?.revenue || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Add New Menu Item
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Pending Orders
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Update Restaurant Hours
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>🍕 New order received - #1234</p>
            <p>📝 Menu item "Chicken Tikka" updated</p>
            <p>✅ Order #1232 completed</p>
            <p>🆕 New category "Desserts" added</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile?.is_open 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile?.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cuisine</span>
              <span className="text-sm font-medium">{profile?.cuisine || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rating</span>
              <span className="text-sm font-medium">⭐ {profile?.rating || 'No ratings'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantApp;