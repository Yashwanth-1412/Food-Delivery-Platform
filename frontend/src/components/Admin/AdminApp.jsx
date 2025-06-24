// frontend/src/components/Admin/AdminApp.jsx - COMPLETE ADMIN DASHBOARD
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';
import SystemOverview from './SystemOverview';
import UserManagement from './UserManagement';
import RestaurantManagement from './RestaurantManagement';
import OrderMonitoring from './OrderMonitoring';
import PlatformSettings from './PlatformSettings';
import SystemAnalytics from './SystemAnalytics';

const AdminApp = ({ user, userRole, onLogout }) => {
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    activeAgents: 0
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadSystemData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [statsRes, notificationsRes] = await Promise.allSettled([
        adminService.getSystemStats(),
        adminService.getSystemNotifications()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setSystemStats(statsRes.value.data);
      }

      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.success) {
        setNotifications(notificationsRes.value.data);
      }
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MenuItem = ({ label, icon, view, color, badge = null }) => {
    const isActive = activeView === view;
    const baseClasses = "flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200";
    const activeClasses = isActive 
      ? `bg-${color}-100 text-${color}-700 border-l-4 border-${color}-500` 
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
    
    return (
      <div
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => setActiveView(view)}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
        {badge && (
          <span className={`ml-auto px-2 py-1 text-xs rounded-full bg-${color}-100 text-${color}-700`}>
            {badge}
          </span>
        )}
      </div>
    );
  };

  const SystemStatusIndicator = ({ status, label }) => {
    const statusColor = status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red';
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full bg-${statusColor}-500`}></div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <SystemOverview systemStats={systemStats} onRefresh={loadSystemData} />;
      case 'users':
        return <UserManagement />;
      case 'restaurants':
        return <RestaurantManagement />;
      case 'orders':
        return <OrderMonitoring />;
      case 'analytics':
        return <SystemAnalytics />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <SystemOverview systemStats={systemStats} onRefresh={loadSystemData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-lg border-r">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Panel</h2>
              <p className="text-purple-100 text-sm">System Control Center</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-purple-400 border-opacity-30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">👤</span>
              </div>
              <div>
                <p className="font-medium">{user?.displayName || user?.email}</p>
                <p className="text-xs text-purple-200">Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">System Status</h3>
          <div className="space-y-2">
            <SystemStatusIndicator status="healthy" label="Database" />
            <SystemStatusIndicator status="healthy" label="Payment System" />
            <SystemStatusIndicator status="warning" label="Email Service" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <MenuItem
            label="System Overview"
            icon="📊"
            view="overview"
            color="purple"
          />
          <MenuItem
            label="User Management"
            icon="👥"
            view="users"
            color="blue"
            badge={systemStats.totalUsers || null}
          />
          <MenuItem
            label="Restaurant Management"
            icon="🏪"
            view="restaurants"
            color="green"
            badge={systemStats.totalRestaurants || null}
          />
          <MenuItem
            label="Order Monitoring"
            icon="📦"
            view="orders"
            color="orange"
            badge={systemStats.activeOrders || null}
          />
          <MenuItem
            label="System Analytics"
            icon="📈"
            view="analytics"
            color="indigo"
          />
          <MenuItem
            label="Platform Settings"
            icon="⚙️"
            view="settings"
            color="gray"
          />
        </nav>

        {/* Recent Notifications */}
        <div className="p-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Alerts</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="text-yellow-800 font-medium">{notification.title}</p>
                <p className="text-yellow-600">{notification.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-gray-500 text-xs">No recent alerts</p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeView === 'overview' && 'System Overview'}
                {activeView === 'users' && 'User Management'}
                {activeView === 'restaurants' && 'Restaurant Management'}
                {activeView === 'orders' && 'Order Monitoring'}
                {activeView === 'analytics' && 'System Analytics'}
                {activeView === 'settings' && 'Platform Settings'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {activeView === 'overview' && 'Monitor your platform performance and health'}
                {activeView === 'users' && 'Manage users, roles, and permissions'}
                {activeView === 'restaurants' && 'Oversee restaurant operations and approvals'}
                {activeView === 'orders' && 'Track orders and resolve issues'}
                {activeView === 'analytics' && 'Analyze platform metrics and trends'}
                {activeView === 'settings' && 'Configure platform settings and preferences'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Active Orders</p>
                  <p className="font-bold text-lg">{systemStats.activeOrders}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Total Revenue</p>
                  <p className="font-bold text-lg">${systemStats.totalRevenue}</p>
                </div>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={loadSystemData}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh Data"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminApp;