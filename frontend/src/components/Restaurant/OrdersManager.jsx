// ============================================================================
// SOLUTION: Keep your current design but add status functionality
// ============================================================================

// This will enhance your existing OrdersManager to show status and update buttons
// without changing the overall layout

// frontend/src/components/Restaurant/OrdersManager.jsx - Enhanced Version
import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';

const OrdersManager = ({ onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updating, setUpdating] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filterStatus = selectedStatus === 'all' ? null : selectedStatus;
      const response = await restaurantService.getOrders(filterStatus, 50);
      
      if (response.success && response.data) {
        // Ensure each order has a status (default to 'pending' if missing)
        const ordersWithStatus = response.data.map(order => ({
          ...order,
          status: order.status || 'pending' // Default status if missing
        }));
        setOrders(ordersWithStatus);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (updating) return;
    
    try {
      setUpdating(true);
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      await restaurantService.updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Refresh the orders list
      
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800', 
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-purple-100 text-purple-800',
      'picked_up': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing', 
      'ready': 'Ready',
      'picked_up': 'Picked Up',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labels[status] || 'Unknown';
  };

  const getNextActions = (currentStatus) => {
    const actions = {
      'pending': [
        { status: 'confirmed', label: 'Confirm', color: 'bg-blue-600 hover:bg-blue-700' },
        { status: 'cancelled', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }
      ],
      'confirmed': [
        { status: 'preparing', label: 'Start Preparing', color: 'bg-orange-600 hover:bg-orange-700' },
        { status: 'cancelled', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }
      ],
      'preparing': [
        { status: 'ready', label: 'Mark Ready', color: 'bg-purple-600 hover:bg-purple-700' }
      ],
      'ready': [
        { status: 'picked_up', label: 'Picked Up', color: 'bg-indigo-600 hover:bg-indigo-700' },
        { status: 'delivered', label: 'Delivered', color: 'bg-green-600 hover:bg-green-700' }
      ],
      'picked_up': [
        { status: 'delivered', label: 'Delivered', color: 'bg-green-600 hover:bg-green-700' }
      ],
      'delivered': [],
      'cancelled': []
    };
    return actions[currentStatus] || [];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Status counts for the tabs
  const getStatusCounts = () => {
    const counts = {
      'all': orders.length,
      'pending': orders.filter(o => o.status === 'pending').length,
      'confirmed': orders.filter(o => o.status === 'confirmed').length,
      'preparing': orders.filter(o => o.status === 'preparing').length,
      'ready': orders.filter(o => o.status === 'ready').length,
      'picked_up': orders.filter(o => o.status === 'picked_up').length,
      'delivered': orders.filter(o => o.status === 'delivered').length,
      'cancelled': orders.filter(o => o.status === 'cancelled').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
        <p className="text-gray-600">Monitor and update order status</p>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs (like your original design) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All Orders' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'preparing', label: 'Preparing' },
          { value: 'ready', label: 'Ready' },
          { value: 'picked_up', label: 'Picked Up' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedStatus === tab.value 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} {statusCounts[tab.value]}
          </button>
        ))}
      </div>

      {/* Orders Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {orders.filter(o => selectedStatus === 'all' || o.status === selectedStatus).length} orders
        </p>
      </div>

      {/* Orders List - Your Current Design Enhanced */}
      <div className="space-y-4">
        {orders
          .filter(order => selectedStatus === 'all' || order.status === selectedStatus)
          .map((order) => {
            const nextActions = getNextActions(order.status);
            const isExpanded = expandedOrder === order.id;
            
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg">
                {/* Order Header - Keep your original layout */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.order_number || order.id}
                        </h3>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                               fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <div className="font-medium">{order.customer_name || 'Guest'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <div className="font-bold text-green-600">₹{order.total?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <div>{formatDateTime(order.created_at)}</div>
                        </div>
                      </div>

                      {/* Status Badge - NEWLY ADDED */}
                      <div className="mt-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {/* Phone number if available */}
                      {order.customer_phone && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2">{order.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons - NEWLY ADDED */}
                  {nextActions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {nextActions.map((action) => (
                        <button
                          key={action.status}
                          onClick={() => handleStatusUpdate(order.id, action.status)}
                          disabled={updating}
                          className={`px-3 py-1 text-sm font-medium text-white rounded-md transition-colors ${action.color} ${
                            updating ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {updating ? 'Updating...' : action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Items */}
                      {order.items && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      {order.delivery_address && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Delivery Address:</h4>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* No Orders Message */}
      {orders.filter(o => selectedStatus === 'all' || o.status === selectedStatus).length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' 
              ? 'No orders have been placed yet' 
              : `No ${selectedStatus} orders found`
            }
          </p>
        </div>
      )}

      {/* Auto-refresh Notice */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔄 Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
};

export default OrdersManager;