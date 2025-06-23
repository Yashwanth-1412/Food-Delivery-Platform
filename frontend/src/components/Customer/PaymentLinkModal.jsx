// frontend/src/components/Customer/PaymentLinkModal.jsx - Payment Link Component
import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/paymentApi';

const PaymentLinkModal = ({ 
  isOpen, 
  onClose, 
  orderAmount, 
  customerPhone, 
  restaurantName, 
  restaurantId,
  onPaymentSuccess 
}) => {
  const [paymentLink, setPaymentLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      createPaymentLink();
    }
  }, [isOpen]);

  const createPaymentLink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentAPI.createPaymentLink(
        orderAmount,
        customerPhone,
        {
          restaurant_name: restaurantName,
          restaurant_id: restaurantId
        }
      );

      if (response.success) {
        setPaymentLink(response);
      } else {
        setError(response.error || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      setError('Failed to create payment link. Please try again.');
    } finally {
      setLoading(false);
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
    setChecking(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const statusResponse = await paymentAPI.checkLinkStatus(paymentLink.cf_link_id);
        
        if (statusResponse.success) {
          const { link_status, link_amount_paid, payments } = statusResponse;
          
          if (link_amount_paid > 0 && payments.length > 0) {
            // Payment successful
            clearInterval(checkInterval);
            setChecking(false);
            onPaymentSuccess({
              cf_link_id: paymentLink.cf_link_id,
              amount_paid: link_amount_paid,
              payment_details: payments[0]
            });
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      setChecking(false);
    }, 600000);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Creating payment link...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800 text-sm">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {paymentLink && (
          <div className="space-y-6">
            {/* Payment Amount */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">₹{paymentLink.link_amount}</h3>
              <p className="text-gray-600">Payment for {restaurantName}</p>
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
                disabled={checking}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {checking ? 'Waiting for Payment...' : 'Pay Now'}
              </button>

              <button
                onClick={copyLinkToClipboard}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Copy Payment Link
              </button>
            </div>

            {/* Payment Status */}
            {checking && (
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

            {/* Payment Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Payment Instructions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click "Pay Now" to open payment page</li>
                <li>• Or scan the QR code with any UPI app</li>
                <li>• Or copy the link to share/save for later</li>
                <li>• Payment link expires in 24 hours</li>
              </ul>
            </div>

            {/* Link Expiry */}
            <div className="text-center text-xs text-gray-500">
              Payment link expires: {new Date(paymentLink.link_expiry_time).toLocaleString()}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkModal;