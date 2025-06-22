// frontend/src/components/Agent/AgentProfile.jsx

import React, { useState, useEffect } from 'react';
import { agentService } from '../../services/agentApi';

const AgentProfile = ({ profile, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'bike',
    license_plate: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        vehicle_type: profile.vehicle_type || 'bike',
        license_plate: profile.license_plate || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await agentService.updateProfile(formData);
      if (response.success) {
        setEditing(false);
        onUpdate();
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agent Profile</h2>
            <p className="text-gray-600 mt-1">Manage your delivery agent information</p>
          </div>
          
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile?.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
            {editing ? (
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bike">🚲 Bike</option>
                <option value="scooter">🛵 Scooter</option>
                <option value="car">🚗 Car</option>
                <option value="motorcycle">🏍️ Motorcycle</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {formData.vehicle_type === 'bike' && '🚲 Bike'}
                {formData.vehicle_type === 'scooter' && '🛵 Scooter'}
                {formData.vehicle_type === 'car' && '🚗 Car'}
                {formData.vehicle_type === 'motorcycle' && '🏍️ Motorcycle'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
            {editing ? (
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC-1234"
              />
            ) : (
              <p className="text-gray-900">{profile?.license_plate || 'Not set'}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{profile?.total_deliveries || 0}</p>
              <p className="text-sm text-gray-600">Total Deliveries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">⭐ {profile?.rating || '5.0'}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {profile?.status === 'available' ? '🟢' : profile?.status === 'busy' ? '🟡' : '🔴'}
              </p>
              <p className="text-sm text-gray-600">Current Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AgentProfile;