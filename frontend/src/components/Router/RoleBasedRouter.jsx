import React from 'react';
import RestaurantApp from '../Restaurant/RestaurantApp';

// Role Assignment Page for users without roles
const RoleAssignmentPage = ({ user }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
      <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
      <p className="text-gray-600 mb-4">Hello, {user?.displayName || user?.email}</p>
      <p className="text-gray-500 text-sm mb-8">Your account doesn't have a role assigned yet. Please contact an administrator to get access to the platform.</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          <strong>Next Steps:</strong><br/>
          • Contact your administrator<br/>
          • Request role assignment<br/>
          • Wait for account activation
        </p>
      </div>
    </div>
  </div>
);

// Restaurant Dashboard Component - Now using the actual component we built
const RestaurantDashboard = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <RestaurantApp user={user} userRole={userRole} onLogout={onLogout} />
  </div>
);

// Agent Dashboard (Placeholder)
const AgentApp = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🚚 Delivery Agent Dashboard</h1>
        <p className="text-gray-600 mb-4">Welcome, {user?.displayName || user?.email}</p>
        <p className="text-gray-500 text-sm mb-8">Role: {userRole?.role}</p>
        <button 
          onClick={onLogout}
          className="mb-8 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-green-800">Available Orders</h3>
            <p className="text-green-600 text-sm mt-2">Pick up new delivery orders</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800">Active Deliveries</h3>
            <p className="text-blue-600 text-sm mt-2">Track ongoing deliveries</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-purple-800">Earnings</h3>
            <p className="text-purple-600 text-sm mt-2">View your delivery earnings</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Customer Dashboard (Placeholder)
const CustomerApp = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🛒 Customer Dashboard</h1>
        <p className="text-gray-600 mb-4">Welcome, {user?.displayName || user?.email}</p>
        <p className="text-gray-500 text-sm mb-8">Role: {userRole?.role}</p>
        <button 
          onClick={onLogout}
          className="mb-8 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800">Browse Restaurants</h3>
            <p className="text-blue-600 text-sm mt-2">Find your favorite food</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-green-800">Order History</h3>
            <p className="text-green-600 text-sm mt-2">Track your past orders</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Favorites</h3>
            <p className="text-yellow-600 text-sm mt-2">Your saved restaurants and dishes</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Admin Dashboard (Placeholder)
const AdminApp = ({ user, userRole, onLogout }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="font-semibold text-red-800">User Management</h3>
            <p className="text-red-600 text-sm mt-2">Manage users and roles</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-purple-800">Platform Analytics</h3>
            <p className="text-purple-600 text-sm mt-2">System-wide metrics and insights</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h3 className="font-semibold text-indigo-800">System Settings</h3>
            <p className="text-indigo-600 text-sm mt-2">Configure platform settings</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RoleBasedRouter = ({ user, userRole, onLogout, error }) => {
  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle no role assigned
  if (!userRole || !userRole.role) {
    return <RoleAssignmentPage user={user} />;
  }

  // Route based on user role
  switch (userRole.role) {
    case 'restaurant':
      return <RestaurantDashboard user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'customer':
      return <CustomerApp user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'admin':
      return <AdminApp user={user} userRole={userRole} onLogout={onLogout} />;
    
    case 'agent':
      return <AgentApp user={user} userRole={userRole} onLogout={onLogout} />;
    
    default:
      return <RoleAssignmentPage user={user} />;
  }
};

export default RoleBasedRouter;