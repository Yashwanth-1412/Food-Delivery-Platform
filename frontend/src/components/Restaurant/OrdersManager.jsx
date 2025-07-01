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
        const ordersWithStatus = response.data.map(order => ({
          ...order,
          status: order.status || 'pending'
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
      await loadOrders();
      
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

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🍽️',
      'picked_up': '🚚',
      'delivered': '✨',
      'cancelled': '❌'
    };
    return icons[status] || '📋';
  };

  const getNextActions = (currentStatus) => {
    const actions = {
      'pending': [
        { status: 'confirmed', label: 'Confirm', color: 'from-blue-500 to-blue-600', icon: '✅' },
        { status: 'cancelled', label: 'Cancel', color: 'from-red-500 to-red-600', icon: '❌' }
      ],
      'confirmed': [
        { status: 'preparing', label: 'Start Preparing', color: 'from-orange-500 to-orange-600', icon: '👨‍🍳' },
        { status: 'cancelled', label: 'Cancel', color: 'from-red-500 to-red-600', icon: '❌' }
      ],
      'preparing': [
        { status: 'ready', label: 'Mark Ready', color: 'from-purple-500 to-purple-600', icon: '🍽️' }
      ],
      'ready': [
        { status: 'picked_up', label: 'Picked Up', color: 'from-indigo-500 to-indigo-600', icon: '🚚' },
        { status: 'delivered', label: 'Delivered', color: 'from-green-500 to-green-600', icon: '✨' }
      ],
      'picked_up': [
        { status: 'delivered', label: 'Delivered', color: 'from-green-500 to-green-600', icon: '✨' }
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

  // Loading Screen
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Orders</h2>
          <p className="text-gray-600">Getting your latest orders...</p>
        </div>
      </div>
    );
  }

  const StatusTab = ({ status, label, count, isActive }) => (
    <button
      onClick={() => setSelectedStatus(status)}
      className={`relative overflow-hidden rounded-2xl px-4 py-3 font-semibold text-sm transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
          : 'bg-white/80 backdrop-blur-xl text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span>{getStatusIcon(status)}</span>
        <span>{label}</span>
        {count > 0 && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
          }`}>
            {count}
          </span>
        )}
      </div>
    </button>
  );

  const OrderCard = ({ order }) => {
    const nextActions = getNextActions(order.status);
    const isExpanded = expandedOrder === order.id;
    
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-102">
        <div className="p-6">
          {/* Order Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  #{order.order_number?.slice(-3) || order.id?.slice(-3)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order #{order.order_number || order.id}
                </h3>
                <p className="text-sm text-gray-600">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            
            <button
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50/80 rounded-xl p-3">
              <span className="text-xs text-gray-600 font-medium">Customer</span>
              <div className="font-semibold text-gray-900">{order.customer_name || 'Guest'}</div>
              {order.customer_phone && (
                <div className="text-sm text-gray-600">{order.customer_phone}</div>
              )}
            </div>
            <div className="bg-gray-50/80 rounded-xl p-3">
              <span className="text-xs text-gray-600 font-medium">Total Amount</span>
              <div className="font-bold text-green-600 text-lg">₹{order.total?.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-3">
              <span className="text-xs text-gray-600 font-medium">Status</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{getStatusIcon(order.status)}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {nextActions.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {nextActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusUpdate(order.id, action.status)}
                  disabled={updating}
                  className={`px-4 py-2 bg-gradient-to-r ${action.color} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 ${
                    updating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>{action.icon}</span>
                  <span>{updating ? 'Updating...' : action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">🍽️</span>
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-sm">{item.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                        <span className="font-bold text-green-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {order.delivery_address && (
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    Delivery Address
                  </h4>
                  <div className="p-4 bg-blue-50/80 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">{order.delivery_address}</p>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {order.notes && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">📝</span>
                    Special Notes
                  </h4>
                  <div className="p-4 bg-yellow-50/80 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Orders Management
              </h1>
              <p className="text-gray-600 mt-1">Monitor and update order status in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadOrders}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-orange-100">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Filter by Status</h3>
          <p className="text-sm text-gray-600">Click on any status to filter orders</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <StatusTab status="all" label="All Orders" count={statusCounts.all} isActive={selectedStatus === 'all'} />
          <StatusTab status="pending" label="Pending" count={statusCounts.pending} isActive={selectedStatus === 'pending'} />
          <StatusTab status="confirmed" label="Confirmed" count={statusCounts.confirmed} isActive={selectedStatus === 'confirmed'} />
          <StatusTab status="preparing" label="Preparing" count={statusCounts.preparing} isActive={selectedStatus === 'preparing'} />
          <StatusTab status="ready" label="Ready" count={statusCounts.ready} isActive={selectedStatus === 'ready'} />
          <StatusTab status="picked_up" label="Picked Up" count={statusCounts.picked_up} isActive={selectedStatus === 'picked_up'} />
          <StatusTab status="delivered" label="Delivered" count={statusCounts.delivered} isActive={selectedStatus === 'delivered'} />
          <StatusTab status="cancelled" label="Cancelled" count={statusCounts.cancelled} isActive={selectedStatus === 'cancelled'} />
        </div>
      </div>

      {/* Orders Count */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl rounded-2xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <span className="font-semibold text-gray-800">
              Showing {filteredOrders.length} orders
              {selectedStatus !== 'all' && ` (${getStatusLabel(selectedStatus)})`}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            🔄 Auto-refreshes every 30 seconds
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-orange-100 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {selectedStatus === 'all' 
              ? 'No orders have been placed yet. When customers place orders, they\'ll appear here.'
              : `No ${getStatusLabel(selectedStatus).toLowerCase()} orders found. Orders with this status will appear here.`
            }
          </p>
          <button
            onClick={loadOrders}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            🔄 Refresh Orders
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;