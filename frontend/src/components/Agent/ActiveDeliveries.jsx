// frontend/src/components/Agent/ActiveDeliveries.jsx
import React, { useState } from 'react';
import { agentService } from '../../services/agentApi';

const ActiveDeliveries = ({ orders, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(null);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      
      // Get location if updating to certain statuses
      let location = null;
      if (newStatus === 'picked_up' || newStatus === 'on_way' || newStatus === 'delivered') {
        try {
          location = await agentService.getCurrentLocation();
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      }
      
      const response = await agentService.updateDeliveryStatus(orderId, newStatus, location);
      
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned_to_agent': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-yellow-100 text-yellow-800';
      case 'on_way': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case 'assigned_to_agent':
        return { action: 'picked_up', label: '📦 Mark as Picked Up', color: 'bg-yellow-600 hover:bg-yellow-700' };
      case 'picked_up':
        return { action: 'on_way', label: '🚚 Mark as On Way', color: 'bg-purple-600 hover:bg-purple-700' };
      case 'on_way':
        return { action: 'delivered', label: '✅ Mark as Delivered', color: 'bg-green-600 hover:bg-green-700' };
      default:
        return null;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeElapsed = (startTime) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - start) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">🚚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
        <p className="text-gray-500">
          Accept an order from the Available Orders tab to start delivering
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Deliveries</h2>
        <p className="text-gray-600 mt-1">
          {orders.length} active {orders.length === 1 ? 'delivery' : 'deliveries'}
        </p>
      </div>

      {/* Active Orders */}
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
                      ${order.delivery_fee?.toFixed(2) || '4.50'}
                    </div>
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Progress</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        order.assigned_at ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={order.assigned_at ? 'text-gray-900' : 'text-gray-500'}>
                        Order Assigned {order.assigned_at && `- ${formatTime(order.assigned_at)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        order.picked_up_at ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={order.picked_up_at ? 'text-gray-900' : 'text-gray-500'}>
                        Picked Up {order.picked_up_at && `- ${formatTime(order.picked_up_at)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        order.on_way_at ? 'bg-purple-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={order.on_way_at ? 'text-gray-900' : 'text-gray-500'}>
                        On the Way {order.on_way_at && `- ${formatTime(order.on_way_at)}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        order.delivered_at ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={order.delivered_at ? 'text-gray-900' : 'text-gray-500'}>
                        Delivered {order.delivered_at && `- ${formatTime(order.delivered_at)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Name:</strong> {order.customer?.name || order.customer_name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Phone:</strong> {order.customer?.phone || '(555) 123-4567'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Address:</strong> {order.delivery_address}
                      </p>
                      {order.special_instructions && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Instructions:</strong> {order.special_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                  <div className="space-y-1">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500">Order items not available</div>
                    )}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total:</span>
                      <span>${order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {/* Contact Customer */}
                  <button
                    onClick={() => {
                      const phone = order.customer?.phone || '5551234567';
                      window.open(`tel:${phone}`, '_self');
                    }}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    📞 Call Customer
                  </button>

                  {/* Contact Restaurant */}
                  {order.status === 'assigned_to_agent' && (
                    <button
                      onClick={() => {
                        const phone = order.restaurant?.phone || '5551234567';
                        window.open(`tel:${phone}`, '_self');
                      }}
                      className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      📞 Call Restaurant
                    </button>
                  )}

                  {/* Next Action Button */}
                  {nextAction && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, nextAction.action)}
                      disabled={updating === order.id}
                      className={`flex-1 py-2 px-4 text-white rounded-lg transition-colors text-sm font-medium ${
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
                </div>

                {/* Navigation Button */}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      const address = encodeURIComponent(order.delivery_address);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
                    }}
                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    🗺️ Navigate to Customer
                  </button>
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