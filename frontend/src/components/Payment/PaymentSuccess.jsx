// ============================================================================
// SIMPLE SOLUTION: Payment Success = Auto Create Order
// ============================================================================

// frontend/src/components/Payment/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { customerService } from '../../services/customerApi';

const PaymentSuccess = ({ user, onLogout }) => {
  const [status, setStatus] = useState('creating'); // creating, success, error
  const [message, setMessage] = useState('Creating your order...');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // If we're here, payment was successful!
    // Cashfree only redirects here on successful payment
    createOrderFromSuccessfulPayment();
  }, []);

  const createOrderFromSuccessfulPayment = async () => {
    try {
      console.log('✅ Payment successful - creating order...');
      
      // Get stored order data
      const pendingOrder = localStorage.getItem('pending_order');
      const recentPaymentLink = localStorage.getItem('recent_payment_link');
      
      if (!pendingOrder) {
        setStatus('error');
        setMessage('Order data not found. Please contact support - your payment was successful.');
        return;
      }

      const orderData = JSON.parse(pendingOrder);
      
      // Get CF Link ID if available (for reference)
      let cfLinkId = null;
      if (recentPaymentLink) {
        try {
          const paymentData = JSON.parse(recentPaymentLink);
          cfLinkId = paymentData.cf_link_id;
        } catch (e) {
          console.log('Could not parse payment link data');
        }
      }

      console.log('📦 Order data:', orderData);
      console.log('💳 CF Link ID:', cfLinkId);

      // Create order with payment confirmation
      const orderWithPayment = {
        ...orderData,
        payment_method: 'online',
        payment_status: 'paid',
        cf_link_id: cfLinkId, // Include if available
        payment_confirmed_at: new Date().toISOString(),
        payment_source: 'cashfree_redirect'
      };

      console.log('🛒 Creating order...');
      const response = await customerService.createOrder(orderWithPayment);

      if (response.success) {
        // Success! Clean up storage
        localStorage.removeItem('pending_order');
        localStorage.removeItem('recent_payment_link');
        
        setOrderDetails(response.data);
        setStatus('success');
        setMessage('🎉 Payment successful! Your order has been confirmed.');
        
        console.log('✅ Order created successfully:', response.data);
      } else {
        console.error('❌ Order creation failed:', response);
        setStatus('error');
        setMessage('Payment successful but order creation failed. Please contact support with your payment confirmation.');
      }

    } catch (error) {
      console.error('💥 Error creating order:', error);
      setStatus('error');
      setMessage('Payment successful but there was an error creating your order. Please contact support.');
    }
  };

  const handleGoToApp = () => {
    // Clear any remaining data
    localStorage.removeItem('pending_order');
    localStorage.removeItem('recent_payment_link');
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    const supportInfo = {
      user_email: user?.email,
      timestamp: new Date().toISOString(),
      payment_status: 'confirmed_by_redirect',
      order_status: status,
      message: message
    };
    
    const mailBody = `Payment Issue Details:

Payment Status: SUCCESSFUL (confirmed by Cashfree redirect)
Issue: ${message}
User: ${user?.email}
Time: ${new Date().toLocaleString()}

Please help resolve this issue.`;

    window.location.href = `mailto:support@yourapp.com?subject=Payment Successful - Order Issue&body=${encodeURIComponent(mailBody)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'creating' && (
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            )}
            
            {status === 'success' && (
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {status === 'error' && (
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className={`text-2xl font-bold mb-4 ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-yellow-600' : 
            'text-blue-600'
          }`}>
            {status === 'creating' && 'Payment Successful!'}
            {status === 'success' && 'Order Confirmed!'}
            {status === 'error' && 'Payment Successful'}
          </h1>

          <p className="text-gray-600 mb-6">{message}</p>

          {/* Payment Confirmation */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-green-800">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Payment Confirmed by Cashfree</span>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-blue-50 rounded-lg p-3 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>Account:</strong> {user.displayName || user.email}
              </p>
            </div>
          )}

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Order #:</strong> {orderDetails.order_number}</div>
                <div><strong>Amount:</strong> ₹{orderDetails.total?.toFixed(2)}</div>
                <div><strong>Status:</strong> {orderDetails.order_status}</div>
                <div><strong>Restaurant:</strong> {orderDetails.restaurant_name}</div>
                <div><strong>Delivery Address:</strong> {orderDetails.delivery_address}</div>
                <div><strong>Payment:</strong> Online (Confirmed)</div>
                <div><strong>Created:</strong> {new Date(orderDetails.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <button
                onClick={handleGoToApp}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Continue to App
              </button>
            )}
            
            {status === 'error' && (
              <>
                <button
                  onClick={handleContactSupport}
                  className="w-full py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
                >
                  Contact Support
                </button>
                <button
                  onClick={handleGoToApp}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Continue to App
                </button>
              </>
            )}
            
            {status === 'creating' && (
              <div className="text-sm text-gray-500">
                Please wait while we create your order...
              </div>
            )}
          </div>

          {/* Sign Out Option */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Additional Info */}
        {status === 'success' && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🎉 Thank you for your order!</p>
            <p>You will receive updates about your order status.</p>
            <p>Estimated delivery: 30-45 minutes</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>✅ Your payment was successful</p>
            <p>💼 Please contact support to complete your order</p>
          </div>
        )}

        {status === 'creating' && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>💳 Payment confirmed by Cashfree</p>
            <p>📦 Creating your order...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

// ============================================================================
// ALSO UPDATE: CartManager to ensure order data is stored
// ============================================================================

// frontend/src/components/Customer/CartManager.jsx
// Update the createPaymentLink function to ensure data is saved:

const createPaymentLink = async () => {
  if (!orderData) return;

  setPaymentLoading(true);
  
  try {
    // ✅ CRITICAL: Save order data before creating payment link
    console.log('💾 Saving order data to localStorage...');
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
      
      // ✅ ALSO SAVE: Payment link data for reference
      localStorage.setItem('recent_payment_link', JSON.stringify({
        cf_link_id: response.cf_link_id,
        link_id: response.link_id,
        created_at: new Date().toISOString(),
        amount: orderData.total
      }));
      
      console.log('✅ Payment link created and data saved');
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