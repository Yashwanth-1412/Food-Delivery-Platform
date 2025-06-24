// frontend/src/components/Admin/SystemAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const SystemAnalytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [activeChart, setActiveChart] = useState('revenue');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data
      const mockAnalytics = {
        revenue: {
          current: 45678.90,
          previous: 39234.56,
          growth: 16.4,
          daily: [
            { date: '2024-01-14', amount: 3456.78 },
            { date: '2024-01-15', amount: 4123.45 },
            { date: '2024-01-16', amount: 3789.12 },
            { date: '2024-01-17', amount: 4567.89 },
            { date: '2024-01-18', amount: 5234.67 },
            { date: '2024-01-19', amount: 4890.34 },
            { date: '2024-01-20', amount: 5678.90 }
          ]
        },
        orders: {
          total: 1847,
          growth: 12.3,
          daily: [
            { date: '2024-01-14', count: 89 },
            { date: '2024-01-15', count: 102 },
            { date: '2024-01-16', count: 95 },
            { date: '2024-01-17', count: 134 },
            { date: '2024-01-18', count: 156 },
            { date: '2024-01-19', count: 143 },
            { date: '2024-01-20', count: 167 }
          ]
        },
        users: {
          total: 156,
          newThisWeek: 23,
          byRole: {
            customers: 98,
            restaurants: 23,
            agents: 32,
            admins: 3
          }
        },
        restaurants: {
          active: 23,
          pending: 5,
          suspended: 2,
          topPerforming: [
            { name: 'Pizza Palace', revenue: 8945.67, orders: 234 },
            { name: 'Burger Barn', revenue: 6789.45, orders: 189 },
            { name: 'Sushi Zen', revenue: 5432.10, orders: 156 }
          ]
        },
        performance: {
          averageDeliveryTime: 32,
          customerSatisfaction: 4.3,
          orderAccuracy: 96.8,
          onTimeDelivery: 89.2
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon, color, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') return `$${val.toLocaleString()}`;
      if (format === 'percentage') return `${val}%`;
      return val.toLocaleString();
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
            {change && (
              <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-sm">
                  {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
                </span>
                <span className="text-xs text-gray-500 ml-2">vs last {selectedPeriod}</span>
              </div>
            )}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  const SimpleChart = ({ data, type = 'revenue' }) => {
    const maxValue = Math.max(...data.map(d => type === 'revenue' ? d.amount : d.count));
    
    return (
      <div className="mt-4">
        <div className="flex items-end space-x-2 h-32">
          {data.map((item, index) => {
            const value = type === 'revenue' ? item.amount : item.count;
            const height = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                  title={`${item.date}: ${type === 'revenue' ? '$' + value.toLocaleString() : value}`}
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(item.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={analytics.revenue?.current || 0}
          change={analytics.revenue?.growth}
          icon="💰"
          color="green"
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={analytics.orders?.total || 0}
          change={analytics.orders?.growth}
          icon="📦"
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={analytics.users?.total || 0}
          change={null}
          icon="👥"
          color="purple"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={analytics.performance?.customerSatisfaction || 0}
          change={null}
          icon="⭐"
          color="yellow"
          format="number"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <button
              onClick={() => setActiveChart('revenue')}
              className={`px-3 py-1 text-sm rounded ${
                activeChart === 'revenue'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Revenue
            </button>
          </div>
          {analytics.revenue?.daily && (
            <SimpleChart data={analytics.revenue.daily} type="revenue" />
          )}
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Orders Trend</h3>
            <button
              onClick={() => setActiveChart('orders')}
              className={`px-3 py-1 text-sm rounded ${
                activeChart === 'orders'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Orders
            </button>
          </div>
          {analytics.orders?.daily && (
            <SimpleChart data={analytics.orders.daily} type="orders" />
          )}
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Restaurants */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Restaurants</h3>
          <div className="space-y-4">
            {analytics.restaurants?.topPerforming?.map((restaurant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{restaurant.name}</p>
                  <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${restaurant.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Delivery Time</span>
              <span className="font-semibold">{analytics.performance?.averageDeliveryTime} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Accuracy</span>
              <span className="font-semibold">{analytics.performance?.orderAccuracy}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">On-Time Delivery</span>
              <span className="font-semibold">{analytics.performance?.onTimeDelivery}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customer Satisfaction</span>
              <span className="font-semibold">{analytics.performance?.customerSatisfaction}/5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.users?.byRole && Object.entries(analytics.users.byRole).map(([role, count]) => (
            <div key={role} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Reports</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => alert('Generating revenue report... (feature coming soon)')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📊 Revenue Report
          </button>
          <button
            onClick={() => alert('Generating user analytics... (feature coming soon)')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            👥 User Analytics
          </button>
          <button
            onClick={() => alert('Generating performance report... (feature coming soon)')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            ⚡ Performance Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;