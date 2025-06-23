// frontend/src/components/Payment/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../../services/paymentApi';
import { customerService } from '../../services/customerApi';

const PaymentSuccess = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    verifyPaymentAndCreateOrder();
  }, []);

  const verifyPaymentAndCreateOrder = async () => {
    try {
      // Check if we have stored order data
      const pendingOrder = localStorage.getItem('pending_order');
      
      if (!pendingOrder) {
        setStatus('failed');
        setMessage('No pending order found. Please try placing your order again.');
        return;
      }

      const orderData = JSON.parse(pendingOrder);
      
      // Get payment link ID from URL parameters (Cashfree might send it)
      const cfLinkId = searchParams.get('cf_link_id') || 
                      searchParams.get('link_id') || 
                      searchParams.get('order_id');
      
      if (cfLinkId) {
        try {
          // Verify payment status
          const paymentStatus = await paymentAPI.checkLinkStatus(cfLinkId);
          
          if (paymentStatus.success && paymentStatus.link_amount_paid > 0) {
            // Payment successful - create order
            const response = await customerService.createOrder({
              ...orderData,
              cf_link_id: cfLinkId
            });
            
            if (response.success) {
              localStorage.removeItem('pending_order');
              setOrderDetails(response.data);
              setStatus('success');
              setMessage('Payment successful! Your order has been confirmed.');
            } else {
              setStatus('failed');
              setMessage('Payment successful, but order creation failed. Please contact support.');
            }
          } else {
            setStatus('failed');
            setMessage('Payment verification failed. Please contact support if amount was deducted.');
          }
        } catch (paymentError) {
          console.error('Payment verification error:', paymentError);
          
          // Fallback: Try to create order anyway (payment might have succeeded)
          try {
            const response = await customerService.createOrder({
              ...orderData,
              cf_link_id: cfLinkId
            });
            
            if (response.success) {
              localStorage.removeItem('pending_order');
              setOrderDetails(response.data);
              setStatus('success');
              setMessage('Order created successfully! Payment verification pending.');
            } else {
              setStatus('failed');
              setMessage('Unable to verify payment or create order. Please contact support.');
            }
          } catch (orderError) {
            setStatus('failed');
            setMessage('Unable to create order. Please contact support if payment was deducted.');
          }
        }
      } else {
        // No payment ID in URL - try to create order anyway
        try {
          const response = await customerService.createOrder(orderData);
          
          if (response.success) {
            localStorage.removeItem('pending_order');
            setOrderDetails(response.data);
            setStatus('success');
            setMessage('Order created successfully!');
          } else {
            setStatus('failed');
            setMessage('Unable to create order. Please try again.');
          }
        } catch (error) {
          setStatus('failed');
          setMessage('Error creating order. Please contact support.');
        }
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Error verifying payment. Please contact support if amount was deducted.');
    }
  };

  const handleGoToApp = () => {
    // Clear any remaining payment data
    localStorage.removeItem('pending_order');
    // Redirect to main app
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    // You can customize this based on your support system
    window.location.href = 'mailto:support@yourapp.com?subject=Payment Issue&body=Order details: ' + JSON.stringify(orderDetails || 'No order details available');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'verifying' && (
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            )}
            
            {status === 'success' && (
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {status === 'failed' && (
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className={`text-2xl font-bold mb-4 ${
            status === 'success' ? 'text-green-600' : 
            status === 'failed' ? 'text-red-600' : 
            'text-blue-600'
          }`}>
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Issue'}
          </h1>

          <p className="text-gray-600 mb-6">
            {message}
          </p>

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
                {orderDetails.cf_link_id && (
                  <div><strong>Payment ID:</strong> {orderDetails.cf_link_id}</div>
                )}
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
            
            {status === 'failed' && (
              <>
                <button
                  onClick={handleContactSupport}
                  className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Contact Support
                </button>
                <button
                  onClick={handleGoToApp}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Go to App
                </button>
              </>
            )}
            
            {status === 'verifying' && (
              <div className="text-sm text-gray-500">
                Please wait while we verify your payment...
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
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>⚠️ If you were charged, please contact support.</p>
            <p>We'll help resolve this issue quickly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;