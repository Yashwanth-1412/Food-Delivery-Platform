// frontend/src/components/Agent/ActiveDeliveries.jsx - Simple navigation without Google Maps API

import React, { useState } from 'react';
import { agentService } from '../../services/agentApi';

const ActiveDeliveries = ({ orders, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(null);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      
      const response = await agentService.updateDeliveryStatus(orderId, newStatus);
      
      if (response.success) {
        onStatusUpdate();
        
        if (newStatus === 'delivered') {
          alert('Order delivered successfully! 🎉');
        }
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleNavigate = (order) => {
    const address = order.delivery_address;
    
    if (address) {
      // Simple navigation - opens Google Maps in browser (no API key needed)
      const encodedAddress = encodeURIComponent(address);
      
      // Detect device type for better UX
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Try Apple Maps first on iOS devices
        const appleUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
        window.open(appleUrl, '_blank');
      } else if (isMobile) {
        // Use Google Maps app URL for mobile
        const googleUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
        window.open(googleUrl, '_blank');
      } else {
        // Use Google Maps web for desktop
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        window.open(webUrl, '_blank');
      }
    } else {
      alert('Delivery address not available');
    }
  };

  const handleCallCustomer = (order) => {
    const phone = order.customer?.phone || order.receiver_phone;
    
    if (phone) {
      // Create tel: link to call customer
      window.location.href = `tel:${phone}`;
    } else {
      alert('Customer phone number not available');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'assigned_to_agent': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-yellow-100 text-yellow-800',
      'on_way': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextAction = (status) => {
    const actions = {
      'assigned_to_agent': {
        status: 'picked_up',
        label: '📦 Mark as Picked Up',
        color: 'bg-yellow-600 hover:bg-yellow-700'
      },
      'picked_up': {
        status: 'on_way',
        label: '🚗 Mark as On the Way',
        color: 'bg-purple-600 hover:bg-purple-700'
      },
      'on_way': {
        status: 'delivered',
        label: '✅ Mark as Delivered',
        color: 'bg-green-600 hover:bg-green-700'
      }
    };
    return actions[status];
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown';
    }
  };

  const getTimeElapsed = (timestamp) => {
    try {
      const now = new Date();
      const then = new Date(timestamp);
      const diffMs = now - then;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 60) {
        return `${diffMins}m`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `${diffHours}h ${remainingMins}m`;
      }
    } catch {
      return '0m';
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deliveries</h3>
        <p className="text-gray-500">You don't have any active deliveries at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Active Deliveries</h2>
        <p className="text-sm text-gray-500">
          {orders.length} active {orders.length === 1 ? 'delivery' : 'deliveries'}
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const nextAction = getNextAction(order.status);
          
          return (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.restaurant?.name || 'Restaurant'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.restaurant?.address || 'Restaurant Address'}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {order.assigned_at && (
                        <span className="ml-3 text-sm text-gray-500">
                          {getTimeElapsed(order.assigned_at)} elapsed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${order.delivery_fee?.toFixed(2) || '3.00'}
                    </div>
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Name:</strong> {order.customer?.name || order.receiver_name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Phone:</strong> {order.customer?.phone || order.receiver_phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Address:</strong> {order.delivery_address || 'Address not available'}
                      </p>
                      {order.special_instructions && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Instructions:</strong> {order.special_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-1">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    )) || <p className="text-sm text-gray-500">Items not available</p>}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {nextAction && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                      disabled={updating === order.id}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        updating === order.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : nextAction.color
                      }`}
                    >
                      {updating === order.id ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Updating...
                        </span>
                      ) : (
                        nextAction.label
                      )}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleCallCustomer(order)}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      📞 Call Customer
                    </button>
                    <button
                      onClick={() => handleNavigate(order)}
                      className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      🗺️ Navigate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Delivery Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Always confirm pickup with restaurant staff</li>
          <li>• Check order contents before leaving</li>
          <li>• Call customer if you can't find the address</li>
          <li>• Take a photo if leaving order at door</li>
          <li>• Mark as delivered only after successful handover</li>
        </ul>
      </div>
    </div>
  );
};

export default ActiveDeliveries;