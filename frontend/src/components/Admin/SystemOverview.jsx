import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

const SystemOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    activeOrders: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    ordersToday: 0
  });
  const [activities, setActivities] = useState([]);
  const [healthStatus, setHealthStatus] = useState({
    database: 'healthy',
    paymentGateway: 'healthy',
    emailService: 'warning'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load multiple data sources in parallel
      const [statsResponse, activitiesResponse, healthResponse] = await Promise.all([
        adminApi.getSystemStats(),
        adminApi.getRecentActivities(10),
        adminApi.getSystemHealth()
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (activitiesResponse.success) {
        setActivities(activitiesResponse.data);
      }

      if (healthResponse.success) {
        setHealthStatus(healthResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await adminApi.generateSystemReport('24h');
      if (response.success) {
        alert('System report generated successfully!');
        // You could download the report or open it in a new tab
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}% from yesterday
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  const HealthIndicator = ({ service, status, details }) => {
    const statusConfig = {
      healthy: { color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
      warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '⚠️' },
      error: { color: 'text-red-600', bg: 'bg-red-100', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.error;

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
            <span className="text-sm">{config.icon}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{service}</p>
            {details && <p className="text-sm text-gray-500">{details}</p>}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          {status}
        </span>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      const icons = {
        user_registered: '👤',
        order_placed: '🛒',
        restaurant_approved: '🏪',
        payment_processed: '💳',
        system_alert: '🚨'
      };
      return icons[type] || '📝';
    };

    const formatTimeAgo = (timestamp) => {
      const now = new Date();
      const activityTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm">{getActivityIcon(activity.type)}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
          <p className="text-gray-600">Monitor your platform's performance and health</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers?.toLocaleString() || '0'}
          change={stats.userGrowthRate}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Active Restaurants"
          value={stats.totalRestaurants?.toLocaleString() || '0'}
          change={stats.restaurantGrowthRate}
          icon="🏪"
          color="green"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders?.toLocaleString() || '0'}
          change={stats.orderGrowthRate}
          icon="📦"
          color="orange"
        />
        <StatCard
          title="Revenue Today"
          value={`${(stats.revenueToday || 0).toLocaleString()}`}
          change={stats.revenueGrowthRate}
          icon="💰"
          color="purple"
        />
      </div>

      {/* Quick Actions & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={generateReport}
                className="flex flex-col items-center justify-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">📊</span>
                <span className="font-medium text-center">Generate Report</span>
              </button>
              
              <button className="flex flex-col items-center justify-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl">🚨</span>
                <span className="font-medium text-center">System Alerts</span>
              </button>
              
              <button className="flex flex-col items-center justify-center space-y-2 p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                <span className="text-2xl">🔧</span>
                <span className="font-medium text-center">Maintenance</span>
              </button>
              
              <button className="flex flex-col items-center justify-center space-y-2 p-4 border border-green-200 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                <span className="text-2xl">📈</span>
                <span className="font-medium text-center">Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <div className="p-6 space-y-3">
            <HealthIndicator
              service="Database"
              status={healthStatus.database}
              details={healthStatus.databaseDetails || "Response time: 45ms"}
            />
            <HealthIndicator
              service="Payment Gateway"
              status={healthStatus.paymentGateway}
              details={healthStatus.paymentDetails || "Success rate: 99.8%"}
            />
            <HealthIndicator
              service="Email Service"
              status={healthStatus.emailService}
              details={healthStatus.emailDetails || "Queue: 234 pending"}
            />
            <HealthIndicator
              service="File Storage"
              status={healthStatus.fileStorage || 'healthy'}
              details={healthStatus.storageDetails || "Usage: 45% of quota"}
            />
          </div>
        </div>
      </div>

      {/* Recent Activities & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-6">
            {activities.length > 0 ? (
              <div className="space-y-1">
                {activities.slice(0, 8).map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Today's Summary</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold">{stats.newUsersToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orders Completed</span>
              <span className="font-semibold">{stats.ordersToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold">${(stats.revenueToday || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Restaurants</span>
              <span className="font-semibold">{stats.activeRestaurantsToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Support Tickets</span>
              <span className="font-semibold text-orange-600">{stats.supportTicketsToday || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;