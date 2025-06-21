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
    
    // Mark component as mounted when first accessed
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

  // Reload dashboard data when returning to dashboard view
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
      
      // Try to load profile - this is most important
      try {
        const profileRes = await restaurantService.getProfile();
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        // Set default profile data
        setProfile({
          restaurant_name: user?.displayName ? `${user.displayName}'s Restaurant` : 'My Restaurant',
          is_open: true,
          description: 'Welcome to our restaurant! (Backend not connected)',
          phone: 'N/A',
          email: user?.email || 'N/A'
        });
      }

      // Try to load menu summary
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
        // Keep default stats
      }

      // Try to load recent orders
      try {
        const ordersRes = await restaurantService.getOrders(null, 5);
        if (ordersRes.success && ordersRes.data) {
          setRecentOrders(ordersRes.data);
        }
      } catch (error) {
        console.error('Orders fetch failed:', error);
        // Set demo orders when backend is not available
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
      
      // Optimistically update UI first
      setIsOpen(newStatus);
      
      // Then update backend
      const response = await restaurantService.updateProfile({ is_open: newStatus });
      
      // If backend update fails, revert the UI
      if (!response.success) {
        setIsOpen(!newStatus);
        alert('Failed to update restaurant status.');
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      // Revert the UI change on error
      setIsOpen(!isOpen);
      alert('Failed to update restaurant status. This feature may not be available yet.');
    }
  };

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const MenuItem = ({ label, icon, view, color = 'gray' }) => (
    <button
      onClick={() => handleViewChange(view)}
      className={`w-full flex items-center p-4 text-left hover:bg-gray-50 transition-colors ${
        activeView === view ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
    >
      <span className={`text-${color}-600 mr-3 text-xl`}>{icon}</span>
      <span className="font-medium text-gray-900">{label}</span>
    </button>
  );

  const renderContent = () => {
    return (
      <div>
        {/* Dashboard */}
        <div className={activeView === 'dashboard' ? 'block' : 'hidden'}>
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.restaurant_name || 'Restaurant Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back! Here's what's happening with your restaurant today.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">Status:</span>
                  <button
                    onClick={toggleRestaurantStatus}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isOpen ? 'Open' : 'Closed'}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {user?.displayName || user?.email}
                  </span>
                  <button
                    onClick={onLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Backend Status Indicator */}
            {!profile && !loading && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div className="text-sm text-yellow-800">
                    <strong>Backend Connection Issue:</strong> Some features may not work properly. 
                    <button 
                      onClick={testBackendConnection}
                      className="ml-2 underline hover:no-underline"
                    >
                      Test Connection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Menu Categories"
                value={stats.totalCategories}
                icon="📂"
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
                icon="📦"
                color="purple"
              />
              <StatCard
                title="Today's Revenue"
                value={`${stats.todayRevenue.toFixed(2)}`}
                icon="💰"
                color="yellow"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleViewChange('menu-items')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-2xl mb-2">➕</span>
                    <span className="text-sm font-medium">Add Menu Item</span>
                  </button>
                  <button
                    onClick={() => handleViewChange('categories')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <span className="text-2xl mb-2">📂</span>
                    <span className="text-sm font-medium">Manage Categories</span>
                  </button>
                  <button
                    onClick={() => handleViewChange('orders')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <span className="text-2xl mb-2">📋</span>
                    <span className="text-sm font-medium">View Orders</span>
                  </button>
                  <button
                    onClick={() => handleViewChange('profile')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    <span className="text-2xl mb-2">⚙️</span>
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.slice(0, 5).map((order, index) => (
                      <div key={order.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order.order_number || order.id?.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer_name || 'Customer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${order.total?.toFixed(2) || '0.00'}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent orders</p>
                )}
                {recentOrders.length > 0 && (
                  <button
                    onClick={() => handleViewChange('orders')}
                    className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View All Orders →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Component */}
        {(componentStates.categories?.mounted || activeView === 'categories') && (
          <div className={activeView === 'categories' ? 'block' : 'hidden'}>
            <MenuCategoryManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {/* Menu Items Component */}
        {(componentStates['menu-items']?.mounted || activeView === 'menu-items') && (
          <div className={activeView === 'menu-items' ? 'block' : 'hidden'}>
            <MenuItemManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {/* Orders Component */}
        {(componentStates.orders?.mounted || activeView === 'orders') && (
          <div className={activeView === 'orders' ? 'block' : 'hidden'}>
            <OrdersManager onClose={() => handleViewChange('dashboard')} />
          </div>
        )}

        {/* Profile Component */}
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Restaurant Panel</h2>
          <p className="text-sm text-gray-600 mt-1">
            {profile?.restaurant_name || 'My Restaurant'}
          </p>
        </div>
        
        <nav className="mt-6">
          <MenuItem
            label="Dashboard"
            icon="🏠"
            view="dashboard"
            color="blue"
          />
          <MenuItem
            label="Menu Categories"
            icon="📂"
            view="categories"
            color="green"
          />
          <MenuItem
            label="Menu Items"
            icon="🍽️"
            view="menu-items"
            color="purple"
          />
          <MenuItem
            label="Orders"
            icon="📦"
            view="orders"
            color="orange"
          />
          <MenuItem
            label="Profile & Settings"
            icon="⚙️"
            view="profile"
            color="gray"
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default RestaurantApp;