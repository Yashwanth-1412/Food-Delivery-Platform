// frontend/src/components/Agent/EarningsStats.jsx
import React, { useState } from 'react';
import { agentService } from '../../services/agentApi';

const EarningsStats = ({ earnings, onRefresh }) => {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const response = await agentService.getEarnings(newPeriod);
      if (response.success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
            <p className="text-gray-600 mt-1">Your delivery income statistics</p>
          </div>
          
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🚚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earnings?.total_deliveries || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${earnings?.total_earnings || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tips</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${earnings?.total_tips || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg/Delivery</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${earnings?.average_per_delivery || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Income Card */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Total Income ({period})</h3>
          <p className="text-4xl font-bold">
            ${earnings?.total_income || '0.00'}
          </p>
          <p className="text-green-100 mt-2">
            Earnings + Tips
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarningsStats;