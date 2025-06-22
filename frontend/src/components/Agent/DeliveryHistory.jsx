// frontend/src/components/Agent/DeliveryHistory.jsx
import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/agentApi';

const DeliveryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        let startDate = null;
        let endDate = null;
        
        const now = new Date();
        if (dateRange === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        } else if (dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (dateRange === 'month') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const response = await agentService.getDeliveryHistory(startDate, endDate, 50);
        if (response.success) {
          setHistory(response.data || []);
        }
      } catch (error) {
        console.error('Error loading delivery history:', error);
        // Mock data for demo
        setHistory(getMockHistory());
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [dateRange]);

  const getMockHistory = () => [
    {
      id: '1',
      restaurant: { name: 'Pizza Palace' },
      customer_name: 'John Doe',
      delivery_address: '123 Main St',
      total: 25.50,
      delivery_fee: 4.50,
      tip_amount: 3.00,
      delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      distance: '2.1 km'
    },
    {
      id: '2',
      restaurant: { name: 'Burger Barn' },
      customer_name: 'Jane Smith',
      delivery_address: '456 Oak Ave',
      total: 18.75,
      delivery_fee: 3.50,
      tip_amount: 2.50,
      delivered_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      distance: '1.8 km'
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Delivery History</h2>
            <p className="text-gray-600 mt-1">Your completed deliveries</p>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Delivery History</h3>
          <p className="text-gray-500">Complete your first delivery to see it here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
          {history.map((delivery) => (
            <div key={delivery.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {delivery.restaurant.name}
                    </h3>
                    <span className="text-sm text-gray-500">→</span>
                    <span className="text-sm text-gray-600">{delivery.customer_name}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{delivery.delivery_address}</p>
                  <p className="text-sm text-gray-500">{formatDate(delivery.delivered_at)}</p>
                  {delivery.distance && (
                    <p className="text-sm text-gray-500">Distance: {delivery.distance}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ${(delivery.delivery_fee + (delivery.tip_amount || 0)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Fee: ${delivery.delivery_fee.toFixed(2)}
                    {delivery.tip_amount > 0 && ` + Tip: $${delivery.tip_amount.toFixed(2)}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Order: ${delivery.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DeliveryHistory;