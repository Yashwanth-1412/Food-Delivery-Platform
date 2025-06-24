// frontend/src/components/Admin/OrderMonitoring.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const OrderMonitoring = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    timeRange: 'today',
    search: ''
  });

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Mock data for development
      const mockOrders = [
        {
          id: 'ORD-001',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          restaurantName: 'Pizza Palace',
          restaurantId: 'rest-1',
          status: 'delivered',
          total: 28.50,
          items: [
            { name: 'Margherita Pizza', quantity: 1, price: 16.99 },
            { name: 'Garlic Bread', quantity: 2, price: 5.99 }
          ],
          deliveryAddress: '123 Main St, City, State',
          orderTime: '2024-01-20T18:30:00Z',
          deliveryTime: '2024-01-20T19:15:00Z',
          agentName: 'Mike Delivery',
          agentId: 'agent-1',
          paymentMethod: 'Credit Card',
          deliveryFee: 3.99,
          tip: 4.00
        },
        {
          id: 'ORD-002',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          restaurantName: 'Burger Barn',
          restaurantId: 'rest-2',
          status: 'on_way',
          total: 22.75,
          items: [
            { name: 'Classic Burger', quantity: 1, price: 12.99 },
            { name: 'Fries', quantity: 1, price: 4.99 },
            { name: 'Coke', quantity: 1, price: 2.99 }
          ],
          deliveryAddress: '456 Oak Ave, City, State',
          orderTime: '2024-01-20T19:00:00Z',
          agentName: 'Sarah Driver',
          agentId: 'agent-2',
          paymentMethod: 'Cash',
          deliveryFee: 2.99,
          estimatedDelivery: '2024-01-20T19:45:00Z'
        },
        {
          id: 'ORD-003',
          customerName: 'Bob Wilson',
          customerEmail: 'bob@example.com',
          restaurantName: 'Sushi Zen',
          restaurantId: 'rest-3',
          status: 'preparing',
          total: 45.67,
          items: [
            { name: 'California Roll', quantity: 2, price: 8.99 },
            { name: 'Salmon Sashimi', quantity: 1, price: 12.99 },
            { name: 'Miso Soup', quantity: 2, price: 3.99 }
          ],
          deliveryAddress: '789 Pine St, City, State',
          orderTime: '2024-01-20T19:15:00Z',
          paymentMethod: 'Credit Card',
          deliveryFee: 4.99,
          estimatedDelivery: '2024-01-20T20:15:00Z'
        },
        {
          id: 'ORD-004',
          customerName: 'Alice Brown',
          customerEmail: 'alice@example.com',
          restaurantName: 'Taco Fiesta',
          restaurantId: 'rest-4',
          status: 'cancelled',
          total: 18.99,
          items: [
            { name: 'Beef Tacos', quantity: 3, price: 4.99 },
            { name: 'Guacamole', quantity: 1, price: 3.99 }
          ],
          deliveryAddress: '321 First Ave, City, State',
          orderTime: '2024-01-20T17:30:00Z',
          cancelledTime: '2024-01-20T17:45:00Z',
          cancelReason: 'Restaurant unavailable',
          paymentMethod: 'Credit Card',
          refundAmount: 18.99,
          refundStatus: 'processed'
        }
      ];

      // Apply filters
      let filteredOrders = mockOrders;
      
      if (filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }
      
      if (filters.search) {
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.restaurantName.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundOrder = async (orderId, amount, reason) => {
    if (!reason) {
      reason = prompt('Please provide a reason for refund:');
      if (!reason) return;
    }

    try {
      await adminService.refundOrder(orderId, amount, reason);
      loadOrders();
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      on_way: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Order Details - {order.id}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Order Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Order ID:</span>
                  <span className="text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Order Time:</span>
                  <span className="text-gray-900">{formatTime(order.orderTime)}</span>
                </div>
                {order.deliveryTime && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Delivered:</span>
                    <span className="text-gray-900">{formatTime(order.deliveryTime)}</span>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Est. Delivery:</span>
                    <span className="text-gray-900">{formatTime(order.estimatedDelivery)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Payment:</span>
                  <span className="text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Total:</span>
                  <span className="text-gray-900">${order.total}</span>
                </div>
              </div>
            </div>

            {/* Customer & Restaurant Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Participants</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-medium text-gray-700">Customer</label>
                  <p className="text-gray-900">{order.customerName}</p>
                  <p className="text-gray-500">{order.customerEmail}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Restaurant</label>
                  <p className="text-gray-900">{order.restaurantName}</p>
                </div>
                {order.agentName && (
                  <div>
                    <label className="block font-medium text-gray-700">Delivery Agent</label>
                    <p className="text-gray-900">{order.agentName}</p>
                  </div>
                )}
                <div>
                  <label className="block font-medium text-gray-700">Delivery Address</label>
                  <p className="text-gray-900">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.price}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900">Delivery Fee</td>
                    <td className="px-4 py-2 text-sm text-gray-900">${order.deliveryFee}</td>
                  </tr>
                  {order.tip && (
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900">Tip</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${order.tip}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special Cases */}
          {order.status === 'cancelled' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h5 className="font-medium text-red-800">Cancellation Details</h5>
              <p className="text-sm text-red-600 mt-1">Reason: {order.cancelReason}</p>
              <p className="text-sm text-red-600">Cancelled at: {formatTime(order.cancelledTime)}</p>
              {order.refundAmount && (
                <p className="text-sm text-red-600">Refund: ${order.refundAmount} ({order.refundStatus})</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            {order.status === 'delivered' && (
              <button
                onClick={() => handleRefundOrder(order.id, order.total)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Process Refund
              </button>
            )}
            
            <button
              onClick={() => alert('Contact customer (feature coming soon)')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Contact Customer
            </button>
            
            <button
              onClick={() => alert('Contact restaurant (feature coming soon)')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Contact Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => ['preparing', 'on_way', 'confirmed'].includes(o.status)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by order ID, customer, or restaurant..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="on_way">On Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadOrders}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Orders ({orders.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{order.id}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{order.restaurantName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(order.orderTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                      
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleRefundOrder(order.id, order.total)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderMonitoring;