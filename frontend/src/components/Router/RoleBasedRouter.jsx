// frontend/src/components/Router/RoleBasedRouter.jsx - WITH COMPLETE ADMIN
import React from 'react';
import RestaurantApp from '../Restaurant/RestaurantApp';
import CustomerApp from '../Customer/CustomerApp';
import AgentApp from '../Agent/AgentApp';
import AdminApp from '../Admin/AdminApp';

// No Role/Pending Access Component
const NoAccessComponent = ({ user, onLogout }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Pending</h1>
        <p className="text-gray-600 mb-4">Welcome, {user?.displayName || user?.email}</p>
        <p className="text-gray-500 text-sm mb-8">
          Please contact an administrator to get access to the platform.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Next Steps:</strong><br/>
            • Contact your administrator<br/>
            • Request role assignment<br/>
            • Wait for account activation
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

// Main Role-Based Router Component
const RoleBasedRouter = ({ user, userRole, onLogout }) => {
  // If no user is logged in
  if (!user) {
    return <NoAccessComponent user={null} onLogout={onLogout} />;
  }

  // If user exists but no role assigned
  if (!userRole || !userRole.role) {
    return <NoAccessComponent user={user} onLogout={onLogout} />;
  }

  // Route based on user role
  switch (userRole.role) {
    case 'customer':
      return (
        <div className="min-h-screen bg-gray-50">
          <CustomerApp user={user} userRole={userRole} onLogout={onLogout} />
        </div>
      );
    
    case 'restaurant':
      return (
        <div className="min-h-screen bg-gray-50">
          <RestaurantApp user={user} userRole={userRole} onLogout={onLogout} />
        </div>
      );
    
    case 'agent':
      return (
        <div className="min-h-screen bg-gray-50">
          <AgentApp user={user} userRole={userRole} onLogout={onLogout} />
        </div>
      );
    
    case 'admin':
      return (
        <div className="min-h-screen bg-gray-50">
          <AdminApp user={user} userRole={userRole} onLogout={onLogout} />
        </div>
      );
    
    default:
      return <NoAccessComponent user={user} onLogout={onLogout} />;
  }
};

export default RoleBasedRouter;