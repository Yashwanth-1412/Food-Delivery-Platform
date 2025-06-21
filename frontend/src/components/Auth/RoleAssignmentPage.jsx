import React from 'react';
import { authService } from '../../firebase/auth';

const RoleAssignmentPage = ({ user }) => {
  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleContactSupport = () => {
    // You can customize this based on your support system
    const email = 'admin@yourfooddelivery.com';
    const subject = `Role Assignment Request - ${user?.email}`;
    const body = `Hi,\n\nI need a role assigned to my account.\n\nUser Details:\nEmail: ${user?.email}\nUID: ${user?.uid}\n\nPlease assign the appropriate role to my account.\n\nThank you!`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="h-8 w-8 text-orange-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Setup Required
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-2">
            Welcome, {user?.email || 'User'}!
          </p>
          
          <p className="text-gray-600 mb-8">
            Your account is created but needs a role assignment before you can access the platform. 
            Please contact our administrator to complete your setup.
          </p>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Account Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.uid}</p>
              <p><strong>Status:</strong> <span className="text-orange-600 font-medium">Pending Role Assignment</span></p>
            </div>
          </div>

          {/* Available Roles Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Available Roles:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span><strong>Customer:</strong> Browse menus and place orders</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span><strong>Restaurant:</strong> Manage menu and orders</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <span><strong>Agent:</strong> Accept and deliver orders</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span><strong>Admin:</strong> Full system management</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContactSupport}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Contact Administrator
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            Need immediate help? Contact us at{' '}
            <a 
              href="mailto:admin@yourfooddelivery.com" 
              className="text-indigo-600 hover:text-indigo-800"
            >
              admin@yourfooddelivery.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentPage;