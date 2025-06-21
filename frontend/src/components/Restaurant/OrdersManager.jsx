import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';

const OrdersManager = ({ onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const orderStatuses = [
    { value: 'all', label: 'All Orders', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'blue' },
    { value: 'confirmed', label: 'Confirmed', color: 'yellow' },
    { value: 'preparing', label: 'Preparing', color: 'orange' },
    { value: 'ready', label: 'Ready', color: 'purple' },
    { value: 'picked_up', label: 'Picked Up', color: 'green' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

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
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      // Don't show alert for background refresh failures
      if (orders.length === 0) {
        alert('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await restaurantService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      
      // Close order details if it was open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'gray';
  };

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up', 'delivered'],
      'picked_up': ['delivered'],
      'delivered': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateTotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const OrderCard = ({ order }) => {
    const statusColor = getStatusColor(order.status);
    const nextStatuses = getNextStatuses(order.status);
    const total = calculateTotal(order.items);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.order_number || order.id?.slice(-6)}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDateTime(order.created_at)}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Customer:</span>
            <span className="text-sm font-medium">{order.customer_name || 'Guest'}</span>
          </div>
          
          {order.customer_phone && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Phone:</span>
              <span className="text-sm font-medium">{order.customer_phone}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Items:</span>
            <span className="text-sm font-medium">{order.items?.length || 0} items</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-sm font-bold text-green-600">
              ${(order.total || total).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedOrder(order)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View Details
          </button>
          
          <div className="flex space-x-2">
            {nextStatuses.map(status => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(order.id, status)}
                disabled={updating}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  status === 'cancelled'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const OrderDetails = ({ order, onClose }) => {
    const total = calculateTotal(order.items);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order #{order.order_number || order.id?.slice(-6)}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Order Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </p>
                  <p><span className="text-gray-600">Created:</span> {formatDateTime(order.created_at)}</p>
                  <p><span className="text-gray-600">Updated:</span> {formatDateTime(order.updated_at)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Customer Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Name:</span> {order.customer_name || 'Guest'}</p>
                  {order.customer_phone && (
                    <p><span className="text-gray-600">Phone:</span> {order.customer_phone}</p>
                  )}
                  {order.customer_email && (
                    <p><span className="text-gray-600">Email:</span> {order.customer_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            {order.delivery_address && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Information</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>{order.delivery_address}</p>
                  {order.delivery_notes && (
                    <p className="mt-1 text-gray-600">Notes: {order.delivery_notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {order.items && order.items.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-1">Notes: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No items found
                  </div>
                )}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">${(order.total || total).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                Close
              </button>
              
              <div className="flex space-x-2">
                {getNextStatuses(order.status).map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      handleStatusUpdate(order.id, status);
                      onClose();
                    }}
                    disabled={updating}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      status === 'cancelled'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50`}
                  >
                    Mark as {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
          <p className="text-gray-600">Monitor and update order status</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {orderStatuses.map(status => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedStatus === status.value
                  ? `bg-${status.color}-100 text-${status.color}-800 border-2 border-${status.color}-300`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              {status.label}
              {status.value !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-70 px-1 rounded">
                  {orders.filter(o => o.status === status.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'No orders yet' : `No ${getStatusLabel(selectedStatus).toLowerCase()} orders`}
          </h3>
          <p className="text-gray-600">
            {selectedStatus === 'all' 
              ? 'Orders will appear here when customers start placing them.'
              : `There are currently no orders with ${getStatusLabel(selectedStatus).toLowerCase()} status.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders shown
              {selectedStatus !== 'all' && ` • Filtered by: ${getStatusLabel(selectedStatus)}`}
              • Auto-refreshes every 30 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;   