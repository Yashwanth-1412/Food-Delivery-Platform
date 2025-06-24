// Enhanced Restaurant Profile with Logo Upload
// Update frontend/src/components/Restaurant/RestaurantProfile.jsx

import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';

const RestaurantProfile = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    restaurant_name: '',
    cuisine_type: '',
    description: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    is_open: true,
    logo_url: '' // Add logo URL
  });
  
  // Logo upload states
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [settingsData, setSettingsData] = useState({
    min_order_amount: '',
    delivery_fee: '',
    estimated_delivery_time: '',
    delivery_radius: '',
    accepts_cash: true,
    accepts_card: true,
    auto_accept_orders: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileResponse, settingsResponse] = await Promise.allSettled([
        restaurantService.getProfile(),
        restaurantService.getSettings()
      ]);

      if (profileResponse.status === 'fulfilled' && profileResponse.value.data) {
        const profile = profileResponse.value.data;
        setProfileData(prev => ({ ...prev, ...profile }));
        // Set logo preview if logo exists
        if (profile.logo_url) {
          setLogoPreview(profile.logo_url);
        }
      }

      if (settingsResponse.status === 'fulfilled' && settingsResponse.value.data) {
        setSettingsData(prev => ({ ...prev, ...settingsResponse.value.data }));
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logo upload handlers
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo file size must be less than 5MB');
        return;
      }
      
      setSelectedLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!selectedLogo) return;
    
    try {
      setUploadingLogo(true);
      const response = await restaurantService.uploadRestaurantLogo(selectedLogo);
      
      if (response.success) {
        // Update profile data with new logo URL
        setProfileData(prev => ({ ...prev, logo_url: response.logo_url }));
        setSelectedLogo(null);
        alert('Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setSelectedLogo(null);
    setLogoPreview(profileData.logo_url || null);
  };

  const handleProfileSubmit = async () => {
    if (!profileData.restaurant_name.trim()) {
      alert('Restaurant name is required');
      return;
    }

    try {
      setSubmitting(true);
      await restaurantService.updateProfile(profileData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Logo Upload Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Logo</h3>
        
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white overflow-hidden">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Restaurant Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">No Logo</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Logo Upload Controls */}
          <div className="flex-1">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            
            <div className="space-y-3">
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                📷 Choose Logo
              </label>
              
              {selectedLogo && (
                <div className="flex gap-2">
                  <button
                    onClick={uploadLogo}
                    disabled={uploadingLogo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  
                  <button
                    onClick={removeLogo}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Recommended: Square image, max 5MB (JPEG, PNG, GIF, WebP)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              name="restaurant_name"
              value={profileData.restaurant_name}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine Type
            </label>
            <select
              name="cuisine_type"
              value={profileData.cuisine_type}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select cuisine type</option>
              <option value="italian">Italian</option>
              <option value="chinese">Chinese</option>
              <option value="indian">Indian</option>
              <option value="mexican">Mexican</option>
              <option value="american">American</option>
              <option value="thai">Thai</option>
              <option value="japanese">Japanese</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={profileData.description}
              onChange={handleProfileChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="restaurant@example.com"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              name="address_line_1"
              value={profileData.address_line_1}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Street address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              name="address_line_2"
              value={profileData.address_line_2}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={profileData.city}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={profileData.state}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              name="zip_code"
              value={profileData.zip_code}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={profileData.website}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yourrestaurant.com"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_open"
          checked={profileData.is_open}
          onChange={handleProfileChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Restaurant is currently open for orders
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleProfileSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
        >
          {submitting ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Restaurant Profile</h2>
          <p className="text-gray-600">Manage your restaurant information and logo</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Profile Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ProfileTab />
      </div>
    </div>
  );
};

export default RestaurantProfile;