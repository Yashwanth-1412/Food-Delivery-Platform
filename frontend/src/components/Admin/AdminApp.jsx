import React, { useState, useEffect } from 'react';
import { authService } from '../../firebase/auth';
import adminApi from '../../services/adminApi';

// Import your completed components
import SystemOverview from './SystemOverview';
import UserManagement from './UserManagement';
import PlatformSettings from './PlatformSettings';

const AdminApp = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({});

  useEffect(() => {
    // Get current user
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    // Load system stats for sidebar
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await adminApi.getSystemStats();
      if (response.success) {
        setSystemStats(response.data);
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const MenuItem = ({ icon, label, view, badge, color = 'gray' }) => {
    const isActive = currentView === view;
    const colorClasses = {
      purple: isActive ? 'bg-purple-100 text-purple-700 border-purple-300' : 'hover:bg-purple-50',
      blue: isActive ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-blue-50',
      green: isActive ? 'bg-green-100 text-green-700 border-green-300' : 'hover:bg-green-50',
      orange: isActive ? 'bg-orange-100 text-orange-700 border-orange-300' : 'hover:bg-orange-50'
    };

    return (
      <button
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors border ${
          isActive 
            ? `${colorClasses[color]} border` 
            : `${colorClasses[color]} border-transparent`
        }`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        {badge && (
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SystemStatusIndicator = ({ status, label }) => {
    const statusConfig = {
      healthy: { color: 'text-green-600', icon: '●' },
      warning: { color: 'text-yellow-600', icon: '●' },
      error: { color: 'text-red-600', icon: '●' }
    };
    const config = statusConfig[status] || statusConfig.error;

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center space-x-1">
          <span className={`${config.color} text-sm`}>{config.icon}</span>
          <span className="text-xs text-gray-500 capitalize">{status}</span>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'overview':
        return <SystemOverview />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <PlatformSettings />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-purple-200 text-sm">Food Delivery Platform</p>
          
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
        <nav className="p-4 space-y-2 flex-1">
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
            label="Platform Settings"
            icon="⚙️"
            view="settings"
            color="green"
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminApp;