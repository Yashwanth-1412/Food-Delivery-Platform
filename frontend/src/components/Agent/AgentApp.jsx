// frontend/src/components/Agent/AgentApp.jsx
import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/agentApi';
import AvailableOrders from './AvailableOrders';
import ActiveDeliveries from './ActiveDeliveries';
import DeliveryHistory from './DeliveryHistory';
import AgentProfile from './AgentProfile';
import EarningsStats from './EarningsStats';

const AgentApp = ({ user, userRole, onLogout }) => {
  const [activeView, setActiveView] = useState('available');
  const [agentProfile, setAgentProfile] = useState(null);
  const [agentStatus, setAgentStatus] = useState('offline');
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    loadAgentData();
    // Auto-refresh active orders every 30 seconds
    const interval = setInterval(() => {
      if (activeView === 'available' || activeView === 'active') {
        loadActiveOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeView === 'active') {
      loadActiveOrders();
    } else if (activeView === 'earnings') {
      loadEarnings();
    }
  }, [activeView]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      const [profileRes, ordersRes] = await Promise.all([
        agentService.getProfile(),
        agentService.getActiveOrders()
      ]);

      if (profileRes.success) {
        setAgentProfile(profileRes.data);
        setAgentStatus(profileRes.data.status || 'offline');
      }

      if (ordersRes.success) {
        setActiveOrders(ordersRes.data);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const response = await agentService.getActiveOrders();
      if (response.success) {
        setActiveOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading active orders:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const response = await agentService.getEarnings('today');
      if (response.success) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await agentService.updateStatus(newStatus);
      if (response.success) {
        setAgentStatus(newStatus);
        // Reload data if going online
        if (newStatus === 'available') {
          loadAgentData();
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const navigation = [
    { 
      id: 'available', 
      name: 'Available Orders', 
      icon: '📋', 
      badge: null,
      description: 'Orders ready for pickup'
    },
    { 
      id: 'active', 
      name: 'Active Deliveries', 
      icon: '🚚', 
      badge: activeOrders.length > 0 ? activeOrders.length : null,
      description: 'Your current deliveries'
    },
    { 
      id: 'history', 
      name: 'Delivery History', 
      icon: '📜', 
      badge: null,
      description: 'Past deliveries'
    },
    { 
      id: 'earnings', 
      name: 'Earnings', 
      icon: '💰', 
      badge: null,
      description: 'Income and statistics'
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: '👤', 
      badge: null,
      description: 'Account settings'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'available':
        return <AvailableOrders onOrderAccepted={loadActiveOrders} />;
      case 'active':
        return (
          <ActiveDeliveries 
            orders={activeOrders}
            onStatusUpdate={loadActiveOrders}
          />
        );
      case 'history':
        return <DeliveryHistory />;
      case 'earnings':
        return <EarningsStats earnings={earnings} onRefresh={loadEarnings} />;
      case 'profile':
        return (
          <AgentProfile 
            profile={agentProfile}
            onUpdate={loadAgentData}
          />
        );
      default:
        return <AvailableOrders onOrderAccepted={loadActiveOrders} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-2xl">🚚</span>
                <h1 className="ml-2 text-xl font-semibold text-gray-900">Agent Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={agentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(agentStatus)}`}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              
              {/* Active Orders Badge */}
              {activeOrders.length > 0 && (
                <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {activeOrders.length} Active
                </div>
              )}
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {agentProfile?.name || user?.displayName || 'Agent'}
                </span>
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Today's Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deliveries:</span>
                  <span className="font-medium">{earnings?.total_deliveries || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Earnings:</span>
                  <span className="font-medium text-green-600">
                    ${earnings?.total_income || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-medium">
                    ⭐ {agentProfile?.rating || '5.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentApp;