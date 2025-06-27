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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        const menuSummaryRes = await restaurantService.getMenuSummary();
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'blue' },
    { id: 'categories', label: 'Categories', icon: '📁', color: 'green' },
    { id: 'menu-items', label: 'Menu Items', icon: '🍽️', color: 'purple' },
    { id: 'orders', label: 'Orders', icon: '📋', color: 'orange' },
    { id: 'profile', label: 'Settings', icon: '⚙️', color: 'gray' }
  ];

  const StatCard = ({ title, value, icon, color = 'blue', trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
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
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-400 to-${color}-600 text-white text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, icon, description, onClick, color = 'blue' }) => (
    <button
      onClick={onClick}
      className={`group p-6 rounded-2xl border-2 border-gray-200 hover:border-${color}-300 bg-white hover:bg-gradient-to-br hover:from-${color}-50 hover:to-white transition-all duration-200 text-left w-full`}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );

  const OrderCard = ({ order }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-sm">
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
          <div className="p-8 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    {profile?.restaurant_name || 'Restaurant Dashboard'}
                  </p>
                  <p className="text-blue-200 mt-1">
                    Here's what's happening with your restaurant today.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleRestaurantStatus}
                    className={`px-6 py-3 rounded-full font-semibold transition-all ${
                      isOpen 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isOpen ? '🟢 Open' : '🔴 Closed'}
                  </button>
                </div>
              </div>
            </div>

            {/* Backend Status */}
            {!profile && !loading && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
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
                trend={{ positive: true, value: '+2 this week' }}
              />
              <StatCard
                title="Menu Items"
                value={stats.totalMenuItems}
                icon="🍽️"
                color="green"
                trend={{ positive: true, value: '+5 this week' }}
              />
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon="📋"
                color="purple"
                trend={{ positive: true, value: '+12% this week' }}
              />
              <StatCard
                title="Today's Revenue"
                value={`$${stats.todayRevenue.toFixed(2)}`}
                icon="💰"
                color="orange"
                trend={{ positive: true, value: '+8% vs yesterday' }}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => handleViewChange('orders')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Modern Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white shadow-xl border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">Restaurant Hub</h2>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {profile?.restaurant_name || 'My Restaurant'}
                </p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-600">{sidebarCollapsed ? '→' : '←'}</span>
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                activeView === item.id
                  ? `bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200`
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-gray-600">Restaurant Owner</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default RestaurantApp;