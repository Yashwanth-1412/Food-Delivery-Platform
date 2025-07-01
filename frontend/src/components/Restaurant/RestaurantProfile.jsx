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
    logo_url: ''
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
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo file size must be less than 5MB');
        return;
      }
      
      setSelectedLogo(file);
      
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

  // Loading Screen
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Getting your restaurant information...</p>
        </div>
      </div>
    );
  }

  const ProfileSection = ({ title, children, icon }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-orange-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InputField = ({ label, name, type = "text", placeholder, required = false, options = null, rows = null }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={profileData[name]}
          onChange={handleProfileChange}
          rows={rows || 3}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white/70 backdrop-blur-sm resize-none"
          placeholder={placeholder}
          required={required}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={profileData[name]}
          onChange={handleProfileChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
          required={required}
        >
          <option value="">{placeholder}</option>
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={profileData[name]}
          onChange={handleProfileChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );

  const cuisineOptions = [
    { value: 'italian', label: 'Italian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'indian', label: 'Indian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'american', label: 'American' },
    { value: 'thai', label: 'Thai' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                Restaurant Profile
              </h1>
              <p className="text-gray-600 mt-1">Manage your restaurant information and settings</p>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Logo Upload Section */}
      <ProfileSection title="Restaurant Logo" icon="🏪">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-white/50 backdrop-blur-sm overflow-hidden">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Restaurant Logo" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🏪</span>
                  </div>
                  <span className="text-sm font-medium">No Logo</span>
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
            
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <span className="mr-2">📷</span>
                  Choose Logo
                </label>
              </div>
              
              {selectedLogo && (
                <div className="flex gap-3">
                  <button
                    onClick={uploadLogo}
                    disabled={uploadingLogo}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {uploadingLogo ? 'Uploading...' : '⬆️ Upload Logo'}
                  </button>
                  
                  <button
                    onClick={removeLogo}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <div className="bg-blue-50/80 rounded-2xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Logo Guidelines</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Square aspect ratio recommended</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
                  <li>• High resolution for best quality</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ProfileSection>

      {/* Basic Information */}
      <ProfileSection title="Basic Information" icon="📝">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Restaurant Name"
            name="restaurant_name"
            placeholder="Enter your restaurant name"
            required
          />
          
          <InputField
            label="Cuisine Type"
            name="cuisine_type"
            type="select"
            placeholder="Select cuisine type"
            options={cuisineOptions}
          />
          
          <div className="md:col-span-2">
            <InputField
              label="Description"
              name="description"
              type="textarea"
              placeholder="Tell customers about your restaurant..."
              rows={4}
            />
          </div>
          
          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
          />
          
          <InputField
            label="Email Address"
            name="email"
            type="email"
            placeholder="restaurant@example.com"
          />
          
          <InputField
            label="Website"
            name="website"
            type="url"
            placeholder="https://yourrestaurant.com"
          />
        </div>
      </ProfileSection>

      {/* Address Information */}
      <ProfileSection title="Address Information" icon="📍">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField
              label="Street Address"
              name="address_line_1"
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="md:col-span-2">
            <InputField
              label="Address Line 2"
              name="address_line_2"
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>
          
          <InputField
            label="City"
            name="city"
            placeholder="City"
          />
          
          <InputField
            label="State"
            name="state"
            placeholder="State"
          />
          
          <InputField
            label="ZIP Code"
            name="zip_code"
            placeholder="12345"
          />
        </div>
      </ProfileSection>

      {/* Restaurant Status */}
      <ProfileSection title="Restaurant Status" icon="🔄">
        <div className="flex items-center space-x-4 p-4 bg-gray-50/80 rounded-2xl">
          <input
            type="checkbox"
            name="is_open"
            checked={profileData.is_open}
            onChange={handleProfileChange}
            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <div>
            <label className="text-sm font-semibold text-gray-900">
              Restaurant is currently open for orders
            </label>
            <p className="text-xs text-gray-600">
              Toggle this to control whether customers can place orders
            </p>
          </div>
        </div>
      </ProfileSection>

      {/* Save Button */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-orange-100">
        <div className="flex justify-end">
          <button
            onClick={handleProfileSubmit}
            disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <span>{submitting ? '⏳' : '💾'}</span>
            <span>{submitting ? 'Updating Profile...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;