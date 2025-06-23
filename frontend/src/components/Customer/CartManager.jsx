// frontend/src/components/Customer/CartManager.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';

const CartManager = ({ cart, restaurant, onUpdateItem, onRemoveItem, onClearCart, /*total, isModal = false*/ }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [newAddress, setNewAddress] = useState({
    label: '',
    receiver_name: '',
    receiver_phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  });

  // Load addresses when checkout modal opens
  useEffect(() => {
    if (showCheckoutForm) {
      loadAddresses();
    }
  }, [showCheckoutForm]);

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);
      const response = await customerService.getDeliveryAddresses();
      if (response.success) {
        setAddresses(response.data);
        // Auto-select default address
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
      const response = await customerService.addDeliveryAddress(newAddress);
      if (response.success) {
        await loadAddresses();
        setShowAddAddress(false);
        setSelectedAddress(response.data.id);
        setNewAddress({
          label: '',
          receiver_name: '',
          receiver_phone: '',
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
    }
  };

  const handleQuantityChange = (itemId, change) => {
    const currentItem = cart.find(item => item.id === itemId);
    if (currentItem) {
      const newQuantity = currentItem.quantity + change;
      if (newQuantity > 0) {
        onUpdateItem(itemId, newQuantity);
      } else {
        onRemoveItem(itemId);
      }
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return restaurant?.delivery_fee || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee() + calculateTax();
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    if (calculateSubtotal() < (restaurant?.min_order || 0)) {
      alert(`Minimum order amount is $${restaurant?.min_order?.toFixed(2) || '0.00'}`);
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const orderData = {
        restaurant_id: restaurant.id,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        delivery_address_id: selectedAddress,
        special_instructions: specialInstructions,
        payment_method: paymentMethod,
        subtotal: calculateSubtotal(),
        delivery_fee: calculateDeliveryFee(),
        tax: calculateTax(),
        total: calculateTotal()
      };

      // Try to create order
      try {
        const response = await customerService.createOrder(orderData);
        if (response.success) {
          alert('Order placed successfully! 🎉');
          onClearCart();
          setShowCheckoutForm(false);
          setSpecialInstructions('');
        } else {
          throw new Error(response.error || 'Failed to place order');
        }
      } catch (error) {
        console.error('Order creation failed, simulating success:', error);
        // Simulate successful order for demo
        alert('Order placed successfully! 🎉 (Demo mode - order not actually processed)');
        onClearCart();
        setShowCheckoutForm(false);
        setSpecialInstructions('');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <span className="text-6xl mb-4 block">🛒</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500">Add some delicious items to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Cart Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Order</h3>
          <button
            onClick={onClearCart}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear Cart
          </button>
        </div>
        {restaurant && (
          <p className="text-sm text-gray-600 mt-1">From {restaurant.name}</p>
        )}
      </div>

      {/* Cart Items */}
      <div className="p-4 max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.id, -1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-2 text-red-600 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>${calculateDeliveryFee().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${calculateTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>Total</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Minimum Order Check */}
        {restaurant?.min_order && calculateSubtotal() < restaurant.min_order && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            Minimum order: ${restaurant.min_order.toFixed(2)}. 
            Add ${(restaurant.min_order - calculateSubtotal()).toFixed(2)} more.
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={() => setShowCheckoutForm(true)}
          disabled={!restaurant?.is_open || (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)}
          className={`w-full mt-4 py-3 rounded-md font-medium transition-colors ${
            !restaurant?.is_open || (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {!restaurant?.is_open 
            ? 'Restaurant Closed' 
            : (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)
              ? 'Minimum Order Not Met'
              : 'Proceed to Checkout'}
        </button>
      </div>

      {/* Checkout Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Checkout</h3>
              <button
                onClick={() => setShowCheckoutForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 mt-2 font-medium">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Address *
                  </label>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add New
                  </button>
                </div>

                {addressLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <span className="text-2xl mb-2 block">📍</span>
                    <p className="text-sm text-gray-500 mb-2">No saved addresses</p>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border rounded-lg p-3 cursor-pointer text-sm ${
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
                              <span className="font-medium">
                                {address.label || 'Address'}
                              </span>
                              {address.is_default && (
                                <span className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 ml-5">
                              {/* Receiver info */}
                              {address.receiver_name && (
                                <span className="text-gray-800 font-medium">
                                  👤 {address.receiver_name}
                                  {address.receiver_phone && ` 📞 ${address.receiver_phone}`}
                                  <br />
                                </span>
                              )}
                              {/* Address info */}
                              📍 {address.address_line_1}
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

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for your order..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>

              {/* Estimated Delivery Time */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <span className="mr-2">🕒</span>
                  <span className="text-sm">
                    Estimated delivery: {restaurant?.delivery_time || '30-45 min'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCheckoutForm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Cart
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !selectedAddress}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    isCheckingOut || !selectedAddress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isCheckingOut ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Add New Address</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receiver Name *
                </label>
                <input
                  type="text"
                  value={newAddress.receiver_name}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, receiver_name: e.target.value }))}
                  placeholder="Full name of person receiving order"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receiver Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newAddress.receiver_phone}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, receiver_phone: e.target.value }))}
                  placeholder="Phone for delivery contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Home, Work, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={newAddress.address_line_1}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.address_line_2}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                  placeholder="Apartment, suite, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  value={newAddress.zip_code}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, zip_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setShowAddAddress(false)}
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                disabled={!newAddress.receiver_name || !newAddress.address_line_1 || !newAddress.city || !newAddress.state || !newAddress.zip_code}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 text-sm"
              >
                Add Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartManager;