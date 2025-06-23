// frontend/src/components/Customer/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';

const Checkout = ({ cart, restaurant, onBack, onOrderComplete }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);
      const response = await customerService.getDeliveryAddresses();
      if (response.success) {
        setAddresses(response.data);
        // Auto-select default address if available
        const defaultAddress = response.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        } else if (response.data.length === 1) {
          setSelectedAddress(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      setLoading(true);
      const response = await customerService.addDeliveryAddress(newAddress);
      if (response.success) {
        await loadAddresses();
        setShowAddAddress(false);
        setSelectedAddress(response.data.id);
        setNewAddress({
          label: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          zip_code: '',
          is_default: false
        });
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = restaurant?.delivery_fee || 2.99;
    const tax = subtotal * 0.08; // 8% tax
    return {
      subtotal,
      deliveryFee,
      tax,
      total: subtotal + deliveryFee + tax
    };
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        restaurant_id: restaurant.id,
        items: cart.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        delivery_address_id: selectedAddress,
        ...calculateTotal()
      };

      // Replace with actual order API call
      console.log('Placing order:', orderData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Order placed successfully!');
      onOrderComplete();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, deliveryFee, tax, total } = calculateTotal();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to Cart
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between">
              <span className="text-gray-600">
                {item.name} × {item.quantity}
              </span>
              <span className="text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
          <button
            onClick={() => setShowAddAddress(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            + Add Address
          </button>
        </div>

        {addressLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500">Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📍</span>
            <p className="text-gray-500 mb-4">No delivery addresses found</p>
            <button
              onClick={() => setShowAddAddress(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedAddress === address.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAddress(address.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        checked={selectedAddress === address.id}
                        onChange={() => setSelectedAddress(address.id)}
                        className="text-blue-600"
                      />
                      <h4 className="font-medium text-gray-900">
                        {address.label || 'Home'}
                      </h4>
                      {address.is_default && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm ml-6">
                      {address.address_line_1}
                      {address.address_line_2 && <>, {address.address_line_2}</>}
                      <br />
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Place Order Button */}
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Cart
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !selectedAddress}
          className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
        </button>
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  name="label"
                  value={newAddress.label}
                  onChange={handleAddressChange}
                  placeholder="Home, Work, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address_line_1"
                  value={newAddress.address_line_1}
                  onChange={handleAddressChange}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="address_line_2"
                  value={newAddress.address_line_2}
                  onChange={handleAddressChange}
                  placeholder="Apartment, suite, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={newAddress.zip_code}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={newAddress.is_default}
                  onChange={handleAddressChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Set as default delivery address
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddAddress(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                disabled={loading || !newAddress.address_line_1 || !newAddress.city || !newAddress.state || !newAddress.zip_code}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;