// frontend/src/components/Admin/SystemOverview.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const SystemOverview = ({ systemStats, onRefresh }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      setLoading(true);
      // For now, use mock data
      const mockActivity = [
        {
          id: 1,
          type: 'order',
          description: 'New order #1234 placed by John Doe',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          icon: '📦',
          color: 'blue'
        },
        {
          id: 2,
          type: 'restaurant',
          description: 'Pizza Palace updated their menu',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          icon: '🍕',
          color: 'green'
        },
        {
          id: 3,
          type: 'user',
          description: 'New restaurant owner registered',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          icon: '👤',
          color: 'purple'
        },
        {
          id: 4,
          type: 'payment',
          description: 'Payment of $45.67 processed',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          icon: '💳',
          color: 'yellow'
        }
      ];
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-lg mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}% vs yesterday
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const timeAgo = (timestamp) => {
      const diff = Date.now() - new Date(timestamp).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className={`p-2 bg-${activity.color}-100 rounded-lg`}>
          <span className="text-sm">{activity.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.description}</p>
          <p className="text-xs text-gray-500">{timeAgo(activity.timestamp)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={systemStats.totalUsers}
          change={12}
          icon="👥"
          color="blue"
          description="All platform users"
        />
        <StatCard
          title="Active Restaurants"
          value={systemStats.totalRestaurants}
          change={8}
          icon="🏪"
          color="green"
          description="Currently operating"
        />
        <StatCard
          title="Total Orders"
          value={systemStats.totalOrders.toLocaleString()}
          change={15}
          icon="📦"
          color="orange"
          description="All time orders"
        />
        <StatCard
          title="Platform Revenue"
          value={`$${systemStats.totalRevenue.toLocaleString()}`}
          change={22}
          icon="💰"
          color="purple"
          description="Total platform earnings"
        />
      </div>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Today's Orders"
          value={systemStats.todayOrders || 89}
          change={5}
          icon="📋"
          color="indigo"
          description="Orders placed today"
        />
        <StatCard
          title="Active Orders"
          value={systemStats.activeOrders}
          icon="⏳"
          color="yellow"
          description="Currently in progress"
        />
        <StatCard
          title="Active Agents"
          value={systemStats.activeAgents}
          icon="🚚"
          color="red"
          description="Currently online"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button
                onClick={loadRecentActivity}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={onRefresh}
                className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>🔄</span>
                <span className="font-medium">Refresh System Data</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span>📊</span>
                <span className="font-medium">Generate Daily Report</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span>🚨</span>
                <span className="font-medium">View System Alerts</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 p-3 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                <span>🔧</span>
                <span className="font-medium">System Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <h4 className="font-medium text-gray-900">Database</h4>
              <p className="text-sm text-green-600">Healthy</p>
              <p className="text-xs text-gray-500 mt-1">Response time: 45ms</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💳</span>
              </div>
              <h4 className="font-medium text-gray-900">Payment Gateway</h4>
              <p className="text-sm text-green-600">Operational</p>
              <p className="text-xs text-gray-500 mt-1">Success rate: 99.8%</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📧</span>
              </div>
              <h4 className="font-medium text-gray-900">Email Service</h4>
              <p className="text-sm text-yellow-600">Warning</p>
              <p className="text-xs text-gray-500 mt-1">Queue: 234 pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;