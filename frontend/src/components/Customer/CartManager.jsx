// frontend/src/components/Customer/CartManager.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';
import { paymentAPI } from '../../services/paymentApi';

const CartManager = ({ cart, restaurant, onUpdateItem, onRemoveItem, onClearCart, total, isModal = false }) => {
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
  const [orderStatus, setOrderStatus] = useState(null);
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

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateItem(itemId, newQuantity);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return restaurant?.delivery_fee || 2.99;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
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
      alert(`Minimum order amount is $${restaurant?.min_order?.toFixed(2) || '0.00'}`);
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
          setOrderStatus('success');
          onClearCart();
          setShowCheckoutForm(false);
          setSpecialInstructions('');
          
          setTimeout(() => {
            setOrderStatus(null);
          }, 3000);
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
      setOrderStatus('error');
      
      setTimeout(() => {
        setOrderStatus(null);
      }, 3000);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const createPaymentLink = async () => {
    if (!orderData) return;

    setPaymentLoading(true);
    
    try {
      // Save order data to localStorage
      console.log('💾 Saving order data to localStorage...', orderData);
      localStorage.setItem('pending_order', JSON.stringify(orderData));
      
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
        
        // Save payment link data for fallback
        localStorage.setItem('recent_payment_link', JSON.stringify({
          cf_link_id: response.cf_link_id,
          link_id: response.link_id,
          created_at: new Date().toISOString()
        }));
        
        console.log('✅ Payment link created:', response);
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
        setOrderStatus('success');
        onClearCart();
        setSpecialInstructions('');
        setOrderData(null);
        setPaymentLink(null);
        
        setTimeout(() => {
          setOrderStatus(null);
        }, 3000);
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

  // Success/Error Status Display
  if (orderStatus === 'success') {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Order Placed Successfully!</h3>
        <p className="text-gray-600 mb-4">Your delicious meal is on its way</p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-green-700 font-medium">
            Order total: ${calculateTotal().toFixed(2)}
          </p>
          <p className="text-green-600 text-sm">
            Estimated delivery: {restaurant?.delivery_time || '30-45 min'}
          </p>
        </div>
      </div>
    );
  }

  if (orderStatus === 'error') {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl text-white">✕</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Order Failed</h3>
        <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
        <button
          onClick={() => setOrderStatus(null)}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-gray-400">🛒</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
        <p className="text-gray-600">Add some delicious items to get started</p>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'p-6' : 'p-6'}`}>
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={onRemoveItem}
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Order Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal ({cart.length} items)</span>
              <span className="font-medium text-gray-800">${calculateSubtotal().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-medium text-gray-800">${calculateDeliveryFee().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax (18%)</span>
              <span className="font-medium text-gray-800">${calculateTax().toFixed(2)}</span>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-orange-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Order Check */}
      {restaurant?.min_order && calculateSubtotal() < restaurant.min_order && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <div className="flex items-center space-x-2 text-yellow-800">
            <span>⚠️</span>
            <div>
              <p className="font-medium">Minimum order: ${restaurant.min_order.toFixed(2)}</p>
              <p className="text-sm">Add ${(restaurant.min_order - calculateSubtotal()).toFixed(2)} more to checkout</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={() => setShowCheckoutForm(true)}
          disabled={!restaurant?.is_open || (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            !restaurant?.is_open || (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-102'
          }`}
        >
          {!restaurant?.is_open 
            ? 'Restaurant Closed' 
            : (restaurant?.min_order && calculateSubtotal() < restaurant.min_order)
              ? 'Minimum Order Not Met'
              : `Checkout • ${restaurant?.delivery_time || '30-45 min'}`}
        </button>

        <button
          onClick={onClearCart}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
        >
          Clear Cart
        </button>
      </div>

      {/* Restaurant Info */}
      {restaurant && (
        <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🏪</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800">{restaurant.name}</h4>
              <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.delivery_time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutForm && (
        <CheckoutModal
          restaurant={restaurant}
          cart={cart}
          addresses={addresses}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          addressLoading={addressLoading}
          showAddAddress={showAddAddress}
          setShowAddAddress={setShowAddAddress}
          newAddress={newAddress}
          setNewAddress={setNewAddress}
          handleAddAddress={handleAddAddress}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          specialInstructions={specialInstructions}
          setSpecialInstructions={setSpecialInstructions}
          calculateTotal={calculateTotal}
          handleCheckout={handleCheckout}
          isCheckingOut={isCheckingOut}
          onClose={() => setShowCheckoutForm(false)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          restaurant={restaurant}
          paymentLink={paymentLink}
          paymentLoading={paymentLoading}
          checkingPayment={checkingPayment}
          createPaymentLink={createPaymentLink}
          handleOpenPaymentLink={handleOpenPaymentLink}
          copyLinkToClipboard={copyLinkToClipboard}
          downloadQRCode={downloadQRCode}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, onQuantityChange, onRemove }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start space-x-4">
        {/* Item Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-2xl">🍽️</span>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
            <button
              onClick={() => onRemove(item.id)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              ✕
            </button>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
              <button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-l-xl transition-colors"
              >
                −
              </button>
              <span className="w-10 h-8 flex items-center justify-center font-medium text-gray-800 text-sm">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-r-xl transition-colors"
              >
                +
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</div>
              <div className="text-sm text-gray-500">${item.price} each</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Modal Component
const CheckoutModal = ({ 
  restaurant, cart, addresses, selectedAddress, setSelectedAddress, 
  addressLoading, showAddAddress, setShowAddAddress, newAddress, setNewAddress, 
  handleAddAddress, paymentMethod, setPaymentMethod, specialInstructions, 
  setSpecialInstructions, calculateTotal, handleCheckout, isCheckingOut, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
              <p className="text-gray-600">Complete your order</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 font-bold">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="text-orange-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Delivery Address</h3>
              <button
                onClick={() => setShowAddAddress(true)}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                + Add New
              </button>
            </div>

            {addressLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl">
                <span className="text-3xl mb-2 block">📍</span>
                <p className="text-gray-500 mb-4">No saved addresses</p>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                      selectedAddress === address.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedAddress(address.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={selectedAddress === address.id}
                        onChange={() => setSelectedAddress(address.id)}
                        className="mt-1 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            {address.label || 'Address'}
                          </span>
                          {address.is_default && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
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
            <h3 className="font-bold text-gray-800 mb-4">Payment Method</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'upi', label: 'UPI Payment', icon: '💳', desc: 'GPay, PhonePe, etc.' },
                { value: 'card', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, etc.' },
                { value: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'Internet Banking' },
                { value: 'wallet', label: 'Digital Wallet', icon: '👛', desc: 'Paytm, Amazon Pay, etc.' },
                { value: 'cash', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' }
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-4 border-2 rounded-2xl text-left transition-all duration-200 ${
                    paymentMethod === method.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="text-orange-600"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{method.label}</div>
                        <div className="text-sm text-gray-500">{method.desc}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests for your order..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Estimated Delivery */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <span className="text-xl">🕒</span>
              <div>
                <div className="font-medium">Estimated Delivery</div>
                <div className="text-sm">{restaurant?.delivery_time || '30-45 min'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Cart
            </button>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || !selectedAddress}
              className={`flex-1 py-3 rounded-2xl font-medium transition-all duration-300 ${
                isCheckingOut || !selectedAddress
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
              }`}
            >
              {isCheckingOut ? 'Processing...' : paymentMethod === 'cash' ? 'Place Order' : 'Continue to Payment'}
            </button>
          </div>
        </div>

        {/* Add Address Modal */}
        {showAddAddress && (
          <AddAddressModal
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            handleAddAddress={handleAddAddress}
            onClose={() => setShowAddAddress(false)}
          />
        )}
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ 
  restaurant, paymentLink, paymentLoading, checkingPayment, 
  createPaymentLink, handleOpenPaymentLink, copyLinkToClipboard, 
  downloadQRCode, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Complete Payment</h2>
              <p className="text-gray-600">Secure payment for your order</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!paymentLink ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-white">💳</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Pay?</h3>
              <p className="text-gray-600 mb-6">We'll create a secure payment link for you</p>
              <button
                onClick={createPaymentLink}
                disabled={paymentLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50"
              >
                {paymentLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Creating Payment Link...</span>
                  </div>
                ) : (
                  'Create Payment Link'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Amount */}
              <div className="text-center">
                <h3 className="text-3xl font-bold text-orange-600 mb-2">${paymentLink.link_amount}</h3>
                <p className="text-gray-600">Payment for {restaurant?.name}</p>
              </div>

              {/* QR Code */}
              {paymentLink.link_qrcode && (
                <div className="text-center">
                  <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-lg">
                    <img 
                      src={paymentLink.link_qrcode} 
                      alt="Payment QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-3">Scan QR code with any UPI app</p>
                  <button
                    onClick={downloadQRCode}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2"
                  >
                    📥 Download QR Code
                  </button>
                </div>
              )}

              {/* Payment Options */}
              <div className="space-y-3">
                <button
                  onClick={handleOpenPaymentLink}
                  disabled={checkingPayment}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  {checkingPayment ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Waiting for Payment...</span>
                    </div>
                  ) : (
                    '💳 Pay Now'
                  )}
                </button>

                <button
                  onClick={copyLinkToClipboard}
                  className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
                >
                  📋 Copy Payment Link
                </button>
              </div>

              {/* Payment Status */}
              {checkingPayment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <div className="flex items-center text-yellow-800">
                    <div className="animate-spin h-5 w-5 border-2 border-yellow-600 border-t-transparent rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium">Waiting for payment confirmation...</div>
                      <div className="text-sm">Complete your payment in the opened tab. We'll automatically detect when payment is successful.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Address Modal Component
const AddAddressModal = ({ newAddress, setNewAddress, handleAddAddress, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add New Address</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Name *</label>
            <input
              type="text"
              value={newAddress.receiver_name}
              onChange={(e) => setNewAddress(prev => ({ ...prev, receiver_name: e.target.value }))}
              placeholder="Full name of person receiving order"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={newAddress.receiver_phone}
              onChange={(e) => setNewAddress(prev => ({ ...prev, receiver_phone: e.target.value }))}
              placeholder="Contact number for delivery"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label (Optional)</label>
            <input
              type="text"
              value={newAddress.label}
              onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Home, Work, etc."
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
            <input
              type="text"
              value={newAddress.address_line_1}
              onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
              placeholder="Street address"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
            <input
              type="text"
              value={newAddress.address_line_2}
              onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
              placeholder="Apartment, suite, etc."
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <input
                type="text"
                value={newAddress.state}
                onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              value={newAddress.zip_code}
              onChange={(e) => setNewAddress(prev => ({ ...prev, zip_code: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={newAddress.is_default}
              onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700">Set as default address</label>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAddAddress}
            disabled={!newAddress.receiver_name || !newAddress.address_line_1 || !newAddress.city || !newAddress.state || !newAddress.zip_code}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50"
          >
            Add Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartManager;