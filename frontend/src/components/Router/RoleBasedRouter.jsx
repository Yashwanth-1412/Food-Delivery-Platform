// frontend/src/components/Router/RoleBasedRouter.jsx - Updated with Real AgentApp
import React from 'react';
import RestaurantApp from '../Restaurant/RestaurantApp';
import CustomerApp from '../Customer/CustomerApp';
import AgentApp from '../Agent/AgentApp';

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

// Customer Dashboard Component
const CustomerDashboard = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <CustomerApp user={user} userRole={userRole} onLogout={onLogout} />
  </div>
);

// Restaurant Dashboard Component
const RestaurantDashboard = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <RestaurantApp user={user} userRole={userRole} onLogout={onLogout} />
  </div>
);

// Agent Dashboard Component (Now Real!)
const AgentDashboard = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <AgentApp user={user} userRole={userRole} onLogout={onLogout} />
  </div>
);

// Admin Dashboard (Still Placeholder)
const AdminApp = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">⚙️ Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">Welcome, {user?.displayName || user?.email}</p>
        <p className="text-gray-500 text-sm mb-8">Role: {userRole?.role}</p>
        <button 
          onClick={onLogout}
          className="mb-8 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-purple-800">User Management</h3>
            <p className="text-purple-600 text-sm mt-2">Manage users and roles</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800">Restaurant Management</h3>
            <p className="text-blue-600 text-sm mt-2">Oversee restaurant operations</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="font-semibold text-orange-800">System Analytics</h3>
            <p className="text-orange-600 text-sm mt-2">Platform performance metrics</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">🚧 Admin dashboard coming soon!</p>
        </div>
      </div>
    </div>
  </div>
);

const RoleBasedRouter = ({ user, userRole, onLogout }) => {
  // If no user role is assigned or still loading
  if (!userRole || !userRole.role) {
    return <NoAccessComponent user={user} onLogout={onLogout} />;
  }

  // Route based on user role
  switch (userRole.role) {
    case 'customer':
      return <CustomerDashboard user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'restaurant':
      return <RestaurantDashboard user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'agent':
      return <AgentDashboard user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'admin':
      return <AdminApp user={user} userRole={userRole} onLogout={onLogout} />;
    
    default:
      return <NoAccessComponent user={user} onLogout={onLogout} />;
  }
};

export default RoleBasedRouter;