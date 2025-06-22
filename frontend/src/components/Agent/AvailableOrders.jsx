// frontend/src/components/Agent/AvailableOrders.jsx
import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/agentApi';

const AvailableOrders = ({ onOrderAccepted }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    loadAvailableOrders();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadAvailableOrders, 15000);
    return () => clearInterval(interval);
  }, [radius]);

  const loadAvailableOrders = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAvailableOrders(radius, 20);
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error loading available orders:', error);
      // Show mock data for demo
      setOrders(getMockOrders());
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setAccepting(orderId);
      const response = await agentService.acceptOrder(orderId, 15);
      
      if (response.success) {
        // Remove order from available list
        setOrders(prev => prev.filter(order => order.id !== orderId));
        onOrderAccepted();
        alert('Order accepted successfully!');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    } finally {
      setAccepting(null);
    }
  };

  const getMockOrders = () => [
    {
      id: '1',
      restaurant: {
        name: 'Italian Bistro',
        address: '123 Main St',
        phone: '(555) 123-4567'
      },
      customer_name: 'John Doe',
      delivery_address: '456 Oak Ave, Apt 2B',
      total: 28.50,
      delivery_fee: 4.50,
      items: [
        { name: 'Margherita Pizza', quantity: 1, price: 16.99 },
        { name: 'Caesar Salad', quantity: 1, price: 8.99 },
        { name: 'Garlic Bread', quantity: 1, price: 4.99 }
      ],
      estimated_distance: '2.3 km',
      estimated_time: '15 min',
      order_time: new Date(Date.now() - 10 * 60000).toISOString(),
      special_instructions: 'Ring doorbell twice'
    },
    {
      id: '2',
      restaurant: {
        name: 'Burger Palace',
        address: '789 First Ave',
        phone: '(555) 987-6543'
      },
      customer_name: 'Jane Smith',
      delivery_address: '321 Pine St, Unit 5',
      total: 22.75,
      delivery_fee: 3.50,
      items: [
        { name: 'Deluxe Burger', quantity: 2, price: 12.99 },
        { name: 'Fries', quantity: 1, price: 4.99 }
      ],
      estimated_distance: '1.8 km',
      estimated_time: '12 min',
      order_time: new Date(Date.now() - 5 * 60000).toISOString(),
      special_instructions: 'Leave at door'
    }
  ];

  const formatTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Orders</h2>
            <p className="text-gray-600 mt-1">
              {orders.length} orders ready for pickup
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Radius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
            
            <button
              onClick={loadAvailableOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Orders</h3>
          <p className="text-gray-500">
            Check back soon for new delivery opportunities
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600">{order.restaurant.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Order placed {formatTime(order.order_time)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${order.delivery_fee.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                  </div>
                </div>

                {/* Distance & Time Info */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    📍 {order.estimated_distance}
                  </span>
                  <span className="flex items-center">
                    ⏱️ {order.estimated_time}
                  </span>
                  <span className="flex items-center">
                    💰 Order Total: ${order.total.toFixed(2)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Customer:</strong> {order.customer_name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Address:</strong> {order.delivery_address}
                  </p>
                  {order.special_instructions && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Instructions:</strong> {order.special_instructions}
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept Button */}
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={accepting === order.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    accepting === order.id
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {accepting === order.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full mr-2"></div>
                      Accepting...
                    </span>
                  ) : (
                    '✅ Accept Order'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;