// frontend/src/components/Customer/CartManager.jsx - Updated with Payment Links
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';
import { paymentAPI } from '../../services/paymentApi';

const CartManager = ({ cart, restaurant, onUpdateItem, onRemoveItem, onClearCart }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);
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
    return calculateSubtotal() * 0.18; // 18% GST for India
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee() + calculateTax();
  };

  const getCustomerPhone = () => {
    if (selectedAddress && addresses) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      return address?.receiver_phone || '9999999999';
    }
    return '9999999999';
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    if (calculateSubtotal() < (restaurant?.min_order || 0)) {
      alert(`Minimum order amount is ₹${restaurant?.min_order?.toFixed(2) || '0.00'}`);
      return;
    }

    setIsCheckingOut(true);
    
    try {
      // Store order data for later creation
      const orderRequestData = {
        restaurant_id: restaurant.id,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        delivery_address: selectedAddress,
        special_instructions: specialInstructions,
        payment_method: paymentMethod,
        subtotal: calculateSubtotal(),
        delivery_fee: calculateDeliveryFee(),
        tax: calculateTax(),
        total: calculateTotal()
      };

      // For cash on delivery, create order immediately
      if (paymentMethod === 'cash') {
        const response = await customerService.createOrder({
          ...orderRequestData,
          cf_link_id: null  // No payment link for COD
        });
        
        if (response.success) {
          alert('Order placed successfully! 🎉 You can pay cash on delivery.');
          onClearCart();
          setShowCheckoutForm(false);
          setSpecialInstructions('');
        } else {
          throw new Error(response.error || 'Failed to place order');
        }
        return;
      }

      // For online payment, store order data and show payment modal
      setOrderData(orderRequestData);
      setShowCheckoutForm(false);
      setShowPaymentModal(true);

    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to process checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const createPaymentLink = async () => {
    if (!orderData) return;

    setPaymentLoading(true);
    
    try {
      const response = await paymentAPI.createPaymentLink(
        orderData.total,
        getCustomerPhone(),
        {
          restaurant_name: restaurant?.name,
          restaurant_id: restaurant?.id
        }
      );

      if (response.success) {
        setPaymentLink(response);
      } else {
        alert('Failed to create payment link: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to create payment link. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentLink?.link_url) {
      // Open payment link in new tab
      window.open(paymentLink.link_url, '_blank');
      
      // Start checking payment status
      startPaymentStatusCheck();
    }
  };

  const startPaymentStatusCheck = () => {
    setCheckingPayment(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const statusResponse = await paymentAPI.checkLinkStatus(paymentLink.cf_link_id);
        
        if (statusResponse.success) {
          const { link_amount_paid, payments } = statusResponse;
          
          if (link_amount_paid > 0 && payments.length > 0) {
            // Payment successful - create order
            clearInterval(checkInterval);
            setCheckingPayment(false);
            await handlePaymentSuccess(paymentLink.cf_link_id);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      setCheckingPayment(false);
    }, 600000);
  };

  const handlePaymentSuccess = async (cfLinkId) => {
    try {
      // Create order with cf_link_id
      const response = await customerService.createOrder({
        ...orderData,
        cf_link_id: cfLinkId
      });
      
      if (response.success) {
        setShowPaymentModal(false);
        alert('Payment successful! 🎉 Your order has been confirmed.');
        onClearCart();
        setSpecialInstructions('');
        setOrderData(null);
        setPaymentLink(null);
      } else {
        alert('Order creation failed after payment. Please contact support.');
      }
    } catch (error) {
      console.error('Error creating order after payment:', error);
      alert('Order creation failed after payment. Please contact support.');
    }
  };

  const copyLinkToClipboard = async () => {
    if (paymentLink?.link_url) {
      try {
        await navigator.clipboard.writeText(paymentLink.link_url);
        alert('Payment link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Failed to copy link');
      }
    }
  };

  const downloadQRCode = () => {
    if (paymentLink?.link_qrcode) {
      const link = document.createElement('a');
      link.href = paymentLink.link_qrcode;
      link.download = 'payment-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
                <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</p>
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
            <span>₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>₹{calculateDeliveryFee().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹{calculateTax().toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>Total</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Minimum Order Check */}
        {restaurant?.min_order && calculateSubtotal() < restaurant.min_order && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            Minimum order: ₹{restaurant.min_order.toFixed(2)}. 
            Add ₹{(restaurant.min_order - calculateSubtotal()).toFixed(2)} more.
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
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 mt-2 font-medium">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
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
                              {address.receiver_name && (
                                <span className="text-gray-800 font-medium">
                                  👤 {address.receiver_name}
                                  {address.receiver_phone && ` 📞 ${address.receiver_phone}`}
                                  <br />
                                </span>
                              )}
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

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">💳 UPI Payment (GPay, PhonePe, etc.)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">💳 Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="netbanking"
                      checked={paymentMethod === 'netbanking'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">🏦 Net Banking</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">👛 Digital Wallet</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">💵 Cash on Delivery</span>
                  </label>
                </div>
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
                  {isCheckingOut ? 'Processing...' : paymentMethod === 'cash' ? 'Place Order' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {!paymentLink && (
              <div className="text-center py-8">
                <button
                  onClick={createPaymentLink}
                  disabled={paymentLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {paymentLoading ? 'Creating Payment Link...' : 'Create Payment Link'}
                </button>
              </div>
            )}

            {paymentLink && (
              <div className="space-y-6">
                {/* Payment Amount */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600">₹{paymentLink.link_amount}</h3>
                  <p className="text-gray-600">Payment for {restaurant?.name}</p>
                </div>

                {/* QR Code */}
                {paymentLink.link_qrcode && (
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img 
                        src={paymentLink.link_qrcode} 
                        alt="Payment QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Scan QR code with any UPI app</p>
                    <button
                      onClick={downloadQRCode}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                    >
                      Download QR Code
                    </button>
                  </div>
                )}

                {/* Payment Options */}
                <div className="space-y-3">
                  <button
                    onClick={handleOpenPaymentLink}
                    disabled={checkingPayment}
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {checkingPayment ? 'Waiting for Payment...' : 'Pay Now'}
                  </button>

                  <button
                    onClick={copyLinkToClipboard}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Copy Payment Link
                  </button>
                </div>

                {/* Payment Status */}
                {checkingPayment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center text-yellow-800">
                      <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></div>
                      <span className="text-sm">Waiting for payment confirmation...</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Complete your payment in the opened tab. This will automatically detect when payment is successful.
                    </p>
                  </div>
                )}
              </div>
            )}
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