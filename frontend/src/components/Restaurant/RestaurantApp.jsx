import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';
import MenuCategoryManager from './MenuCategoryManager';
import MenuItemManager from './MenuItemManager';
import OrdersManager from './OrdersManager';
import RestaurantProfile from './RestaurantProfile';

const RestaurantApp = ({ user, userRole, onLogout }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCategories: 0,
    totalMenuItems: 0,
    todayRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [componentStates, setComponentStates] = useState({
    categories: { mounted: false },
    'menu-items': { mounted: false },
    orders: { mounted: false },
    profile: { mounted: false }
  });

  const handleViewChange = (newView) => {
    setActiveView(newView);
    
    if (newView !== 'dashboard' && !componentStates[newView]?.mounted) {
      setComponentStates(prev => ({
        ...prev,
        [newView]: { mounted: true }
      }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeView === 'dashboard') {
      loadDashboardData();
    }
  }, [activeView]);

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        alert('✅ Backend connection successful!');
      } else {
        alert('❌ Backend responded with error: ' + response.status);
      }
    } catch (error) {
      alert('❌ Cannot connect to backend. Please check if the server is running on http://localhost:5000');
      console.error('Backend connection test failed:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      try {
        const profileRes = await restaurantService.getProfile();
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setIsOpen(profileRes.data.is_open);
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        setProfile({
          restaurant_name: user?.displayName ? `${user.displayName}'s Restaurant` : 'My Restaurant',
          is_open: true,
          description: 'Welcome to our restaurant! (Backend not connected)',
          phone: 'N/A',
          email: user?.email || 'N/A'
        });
      }

      try {
        const menuSummaryRes = await restaurantService.getSummary();
        if (menuSummaryRes.success && menuSummaryRes.data) {
          const summary = menuSummaryRes.data;
          setStats({
            totalCategories: summary.categoriesCount || 0,
            totalMenuItems: summary.itemsCount || 0,
            totalOrders: summary.ordersCount || 0,
            todayRevenue: summary.todayRevenue || 0
          });
        }
      } catch (error) {
        console.error('Menu summary fetch failed:', error);
      }

      try {
        const ordersRes = await restaurantService.getOrders(null, 5);
        if (ordersRes.success && ordersRes.data) {
          setRecentOrders(ordersRes.data);
        }
      } catch (error) {
        console.error('Orders fetch failed:', error);
        setRecentOrders([
          {
            id: 'demo1',
            order_number: 'DEMO001',
            customer_name: 'Demo Customer',
            total: 25.50,
            status: 'pending',
            created_at: new Date().toISOString()
          },
          {
            id: 'demo2', 
            order_number: 'DEMO002',
            customer_name: 'Test User',
            total: 18.75,
            status: 'preparing',
            created_at: new Date().toISOString()
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantStatus = async () => {
    try {
      const newStatus = !isOpen;
      setIsOpen(newStatus);
      
      const response = await restaurantService.updateProfile({ is_open: newStatus });
      
      if (!response.success) {
        setIsOpen(!newStatus);
        alert('Failed to update restaurant status.');
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      setIsOpen(!isOpen);
      alert('Failed to update restaurant status. This feature may not be available yet.');
    }
  };

  // Loading Screen matching Customer UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🏪</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Setting Up Your Restaurant</h2>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: '📊', 
      description: 'Overview & stats',
      gradient: 'from-blue-500 to-purple-500'
    },
    { 
      id: 'categories', 
      name: 'Categories', 
      icon: '📁', 
      description: 'Menu organization',
      gradient: 'from-green-500 to-teal-500'
    },
    { 
      id: 'menu-items', 
      name: 'Menu Items', 
      icon: '🍽️', 
      description: 'Manage dishes',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'orders', 
      name: 'Orders', 
      icon: '📋', 
      description: 'Track orders',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      id: 'profile', 
      name: 'Settings', 
      icon: '⚙️', 
      description: 'Restaurant profile',
      gradient: 'from-gray-500 to-gray-700'
    }
  ];

  const StatCard = ({ title, value, icon, color = 'blue', trend }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm font-medium mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↗' : '↘'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-400 to-${color}-600 text-white text-2xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, icon, description, onClick, color = 'blue' }) => (
    <button
      onClick={onClick}
      className={`group p-6 rounded-2xl border-2 border-gray-200 hover:border-${color}-300 bg-white/80 backdrop-blur-xl hover:bg-gradient-to-br hover:from-${color}-50 hover:to-white transition-all duration-300 text-left w-full hover:shadow-xl hover:scale-105`}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );

  const OrderCard = ({ order }) => (
    <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-xl rounded-xl hover:bg-white/70 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-semibold text-sm">
            #{order.order_number?.slice(-3) || order.id?.slice(-3)}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{order.customer_name || 'Customer'}</p>
          <p className="text-sm text-gray-600">${order.total?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        order.status === 'completed' ? 'bg-green-100 text-green-800' :
        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
        order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {order.status || 'pending'}
      </span>
    </div>
  );

  const renderContent = () => {
    return (
      <div className="flex-1 min-h-screen">
        {/* Dashboard */}
        <div className={activeView === 'dashboard' ? 'block' : 'hidden'}>
          <div className="flex-1 p-8 space-y-8">
            {/* Welcome Header */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                    Welcome back! 👋
                  </h1>
                  <p className="text-xl font-semibold text-gray-800">
                    {profile?.restaurant_name || 'Restaurant Dashboard'}
                  </p>
                  <p className="text-gray-600 mt-1">
                    Here's what's happening with your restaurant today.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleRestaurantStatus}
                    className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                      isOpen 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                    }`}
                  >
                    {isOpen ? '🟢 Open' : '🔴 Closed'}
                  </button>
                </div>
              </div>
            </div>

            {/* Backend Status */}
            {!profile && !loading && (
              <div className="bg-amber-50/80 backdrop-blur-xl border border-amber-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center">
                  <div className="text-amber-600 mr-3 text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Backend Connection Issue</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Some features may not work properly. 
                      <button 
                        onClick={testBackendConnection}
                        className="ml-2 underline hover:no-underline font-medium"
                      >
                        Test Connection
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Menu Categories"
                value={stats.totalCategories}
                icon="📁"
                color="blue"
              />
              <StatCard
                title="Menu Items"
                value={stats.totalMenuItems}
                icon="🍽️"
                color="green"
              />
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon="📋"
                color="purple"
              />
              <StatCard
                title="Today's Revenue"
                value={`$${stats.todayRevenue.toFixed(2)}`}
                icon="💰"
                color="orange"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuickActionCard
                    title="Add Menu Item"
                    icon="➕"
                    description="Create new dishes for your menu"
                    onClick={() => handleViewChange('menu-items')}
                    color="blue"
                  />
                  <QuickActionCard
                    title="Manage Categories"
                    icon="📁"
                    description="Organize your menu structure"
                    onClick={() => handleViewChange('categories')}
                    color="green"
                  />
                  <QuickActionCard
                    title="View Orders"
                    icon="📋"
                    description="Check pending and recent orders"
                    onClick={() => handleViewChange('orders')}
                    color="purple"
                  />
                  <QuickActionCard
                    title="Restaurant Settings"
                    icon="⚙️"
                    description="Update profile and preferences"
                    onClick={() => handleViewChange('profile')}
                    color="orange"
                  />
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-orange-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                  <button
                    onClick={() => handleViewChange('orders')}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.slice(0, 4).map((order, index) => (
                      <OrderCard key={order.id || index} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-gray-500">No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Components */}
        {(componentStates.categories?.mounted || activeView === 'categories') && (
          <div className={activeView === 'categories' ? 'block' : 'hidden'}>
            <MenuCategoryManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {(componentStates['menu-items']?.mounted || activeView === 'menu-items') && (
          <div className={activeView === 'menu-items' ? 'block' : 'hidden'}>
            <MenuItemManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {(componentStates.orders?.mounted || activeView === 'orders') && (
          <div className={activeView === 'orders' ? 'block' : 'hidden'}>
            <OrdersManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {(componentStates.profile?.mounted || activeView === 'profile') && (
          <div className={activeView === 'profile' ? 'block' : 'hidden'}>
            <RestaurantProfile onClose={() => handleViewChange('dashboard')} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Premium Header - Same as Customer UI */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏪</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Restaurant Hub
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {profile?.restaurant_name || 'My Restaurant'}
                </p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center space-x-6">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Restaurant Owner</p>
                </div>
                <div className="relative group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(user?.displayName || user?.email || 'R')[0].toUpperCase()}
                  </div>
                  <div className="absolute right-0 top-14 hidden group-hover:block bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-48">
                    <button
                      onClick={() => handleViewChange('profile')}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="w-full px-6 lg:px-8 py-8">
        <div className="flex gap-8 min-h-[calc(100vh-140px)]">
          {/* Sidebar Navigation - Same style as Customer UI */}
          <div className="w-80">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-100 p-8 sticky top-32">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurant Manager</h2>
                <p className="text-gray-600">Your business dashboard</p>
              </div>
              
              <nav className="space-y-4">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                      activeView === item.id
                        ? 'shadow-xl scale-105'
                        : 'hover:shadow-lg hover:scale-102'
                    }`}
                  >
                    <div className={`w-full p-6 bg-gradient-to-r ${item.gradient} ${
                      activeView === item.id ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{item.icon}</div>
                        <div className="text-left text-white">
                          <div className="font-bold text-lg">{item.name}</div>
                          <div className="text-sm opacity-90">{item.description}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl border border-orange-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-lg mr-2">📊</span>
                  Today's Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-gray-600 font-medium">Orders</span>
                    <span className="font-bold text-orange-600 text-lg">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-gray-600 font-medium">Revenue</span>
                    <span className="font-bold text-green-600 text-lg">${stats.todayRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className={`font-bold text-lg ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-100 min-h-full">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantApp;