// frontend/src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // For development, using mock data
      const mockUsers = [
        {
          id: '1',
          email: 'john.restaurant@example.com',
          displayName: 'John\'s Pizza',
          role: 'restaurant',
          status: 'active',
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-01-20T14:22:00Z',
          totalOrders: 156,
          revenue: 4567.89
        },
        {
          id: '2',
          email: 'jane.customer@example.com',
          displayName: 'Jane Smith',
          role: 'customer',
          status: 'active',
          createdAt: '2024-01-10T09:15:00Z',
          lastLogin: '2024-01-20T16:45:00Z',
          totalOrders: 23,
          totalSpent: 567.34
        },
        {
          id: '3',
          email: 'mike.agent@example.com',
          displayName: 'Mike Delivery',
          role: 'agent',
          status: 'active',
          createdAt: '2024-01-12T11:20:00Z',
          lastLogin: '2024-01-20T18:10:00Z',
          totalDeliveries: 89,
          earnings: 1234.56
        },
        {
          id: '4',
          email: 'suspended@example.com',
          displayName: 'Suspended User',
          role: 'customer',
          status: 'suspended',
          createdAt: '2024-01-08T08:00:00Z',
          lastLogin: '2024-01-18T12:00:00Z',
          suspendReason: 'Fraudulent activity'
        }
      ];

      // Apply filters
      let filteredUsers = mockUsers;
      
      if (filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }
      
      if (filters.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }
      
      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.displayName.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId, reason) => {
    if (!reason) {
      reason = prompt('Please provide a reason for suspension:');
      if (!reason) return;
    }

    try {
      await adminService.suspendUser(userId, reason);
      loadUsers();
      alert('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await adminService.activateUser(userId);
      loadUsers();
      alert('User activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      restaurant: 'bg-green-100 text-green-800',
      customer: 'bg-blue-100 text-blue-800',
      agent: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const UserDetailModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <p className="text-sm text-gray-900">{user.displayName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Login</label>
              <p className="text-sm text-gray-900">{formatDate(user.lastLogin)}</p>
            </div>
            
            {/* Role-specific stats */}
            {user.role === 'restaurant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Orders</label>
                  <p className="text-sm text-gray-900">{user.totalOrders}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Revenue</label>
                  <p className="text-sm text-gray-900">₹{user.revenue}</p>
                </div>
              </>
            )}
            
            {user.role === 'customer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Orders</label>
                  <p className="text-sm text-gray-900">{user.totalOrders}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Spent</label>
                  <p className="text-sm text-gray-900">₹{user.totalSpent}</p>
                </div>
              </>
            )}
            
            {user.role === 'agent' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Deliveries</label>
                  <p className="text-sm text-gray-900">{user.totalDeliveries}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Earnings</label>
                  <p className="text-sm text-gray-900">₹{user.earnings}</p>
                </div>
              </>
            )}
            
            {user.suspendReason && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Suspension Reason</label>
                <p className="text-sm text-red-600">{user.suspendReason}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex space-x-3">
            {user.status === 'active' ? (
              <button
                onClick={() => handleSuspendUser(user.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Suspend User
              </button>
            ) : (
              <button
                onClick={() => handleActivateUser(user.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Activate User
              </button>
            )}
            
            <button
              onClick={() => alert('Send message to user (feature coming soon)')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadUsers}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Users ({users.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;