// frontend/src/components/Admin/PlatformSettings.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminApi';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    platform: {
      platformName: 'FoodDelivery',
      supportEmail: 'support@fooddelivery.com',
      maxDeliveryRadius: 25,
      platformFeePercentage: 15,
      defaultDeliveryFee: 2.99,
      minOrderAmount: 10.00,
      maintenanceMode: false
    },
    payment: {
      cashfreeAppId: '',
      cashfreeSecretKey: '',
      upiEnabled: true,
      netBankingEnabled: true,
      cardPaymentsEnabled: true,
      walletEnabled: true,
      cashOnDeliveryEnabled: true,
      minimumPaymentAmount: 50.00,
      gatewayFeePercentage: 2.5,
      testMode: false,
      autoSettlement: true
    },
    notifications: {
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      pushNotificationsEnabled: true,
      orderStatusUpdates: true,
      promotionalEmails: false
    },
    features: {
      realTimeTracking: true,
      ratingsAndReviews: true,
      loyaltyProgram: false,
      restaurantAnalytics: true,
      agentScheduling: false
    }
  });
  
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // For development, using default settings
      // const response = await adminService.getPlatformSettings();
      // setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updatePlatformSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  const SettingField = ({ label, type = 'text', value, onChange, options = [], disabled = false, description = '' }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Enabled</span>
        </div>
      ) : type === 'number' ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      )}
    </div>
  );

  const PlatformSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Platform Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField
          label="Platform Name"
          value={settings.platform.platformName}
          onChange={(value) => updateSetting('platform', 'platformName', value)}
          description="The name of your food delivery platform"
        />
        
        <SettingField
          label="Support Email"
          type="email"
          value={settings.platform.supportEmail}
          onChange={(value) => updateSetting('platform', 'supportEmail', value)}
          description="Email address for customer support"
        />
        
        <SettingField
          label="Max Delivery Radius (km)"
          type="number"
          value={settings.platform.maxDeliveryRadius}
          onChange={(value) => updateSetting('platform', 'maxDeliveryRadius', value)}
          description="Maximum delivery distance from restaurants"
        />
        
        <SettingField
          label="Platform Fee (%)"
          type="number"
          value={settings.platform.platformFeePercentage}
          onChange={(value) => updateSetting('platform', 'platformFeePercentage', value)}
          description="Commission percentage charged to restaurants"
        />
        
        <SettingField
          label="Default Delivery Fee (₹)"
          type="number"
          value={settings.platform.defaultDeliveryFee}
          onChange={(value) => updateSetting('platform', 'defaultDeliveryFee', value)}
          description="Default delivery fee for orders"
        />
        
        <SettingField
          label="Minimum Order Amount (₹)"
          type="number"
          value={settings.platform.minOrderAmount}
          onChange={(value) => updateSetting('platform', 'minOrderAmount', value)}
          description="Minimum order value required"
        />
      </div>
      
      <div className="border-t pt-6">
        <SettingField
          label="Maintenance Mode"
          type="checkbox"
          value={settings.platform.maintenanceMode}
          onChange={(value) => updateSetting('platform', 'maintenanceMode', value)}
          description="Enable to put the platform in maintenance mode"
        />
      </div>
    </div>
  );

  const PaymentSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField
          label="Cashfree App ID"
          value={settings.payment.cashfreeAppId || ''}
          onChange={(value) => updateSetting('payment', 'cashfreeAppId', value)}
          description="Your Cashfree Application ID"
        />
        
        <SettingField
          label="Cashfree Secret Key"
          type="password"
          value={settings.payment.cashfreeSecretKey || ''}
          onChange={(value) => updateSetting('payment', 'cashfreeSecretKey', value)}
          description="Your Cashfree Secret Key (keep secure)"
        />
        
        <SettingField
          label="Minimum Payment Amount (₹)"
          type="number"
          value={settings.payment.minimumPaymentAmount}
          onChange={(value) => updateSetting('payment', 'minimumPaymentAmount', value)}
          description="Minimum amount for online payments"
        />
        
        <SettingField
          label="Payment Gateway Fee (%)"
          type="number"
          value={settings.payment.gatewayFeePercentage || 2.5}
          onChange={(value) => updateSetting('payment', 'gatewayFeePercentage', value)}
          description="Gateway fee percentage charged by Cashfree"
        />
      </div>
      
      <div className="border-t pt-6 space-y-4">
        <h4 className="text-md font-medium text-gray-900">Payment Methods</h4>
        
        <SettingField
          label="UPI Payments"
          type="checkbox"
          value={settings.payment.upiEnabled || true}
          onChange={(value) => updateSetting('payment', 'upiEnabled', value)}
          description="Allow customers to pay via UPI (PhonePe, Google Pay, etc.)"
        />
        
        <SettingField
          label="Net Banking"
          type="checkbox"
          value={settings.payment.netBankingEnabled || true}
          onChange={(value) => updateSetting('payment', 'netBankingEnabled', value)}
          description="Allow customers to pay via Net Banking"
        />
        
        <SettingField
          label="Credit/Debit Cards"
          type="checkbox"
          value={settings.payment.cardPaymentsEnabled || true}
          onChange={(value) => updateSetting('payment', 'cardPaymentsEnabled', value)}
          description="Allow customers to pay with cards"
        />
        
        <SettingField
          label="Digital Wallets"
          type="checkbox"
          value={settings.payment.walletEnabled || true}
          onChange={(value) => updateSetting('payment', 'walletEnabled', value)}
          description="Allow payments via Paytm, Amazon Pay, etc."
        />
        
        <SettingField
          label="Cash on Delivery"
          type="checkbox"
          value={settings.payment.cashOnDeliveryEnabled}
          onChange={(value) => updateSetting('payment', 'cashOnDeliveryEnabled', value)}
          description="Allow cash payments on delivery"
        />
      </div>
      
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Cashfree Configuration</h4>
        
        <SettingField
          label="Test Mode"
          type="checkbox"
          value={settings.payment.testMode || false}
          onChange={(value) => updateSetting('payment', 'testMode', value)}
          description="Enable test mode for Cashfree payments (use for development)"
        />
        
        <SettingField
          label="Auto Settlement"
          type="checkbox"
          value={settings.payment.autoSettlement || true}
          onChange={(value) => updateSetting('payment', 'autoSettlement', value)}
          description="Automatically settle payments to your bank account"
        />
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
      
      <div className="space-y-4">
        <SettingField
          label="Email Notifications"
          type="checkbox"
          value={settings.notifications.emailNotificationsEnabled}
          onChange={(value) => updateSetting('notifications', 'emailNotificationsEnabled', value)}
          description="Send notifications via email"
        />
        
        <SettingField
          label="SMS Notifications"
          type="checkbox"
          value={settings.notifications.smsNotificationsEnabled}
          onChange={(value) => updateSetting('notifications', 'smsNotificationsEnabled', value)}
          description="Send notifications via SMS"
        />
        
        <SettingField
          label="Push Notifications"
          type="checkbox"
          value={settings.notifications.pushNotificationsEnabled}
          onChange={(value) => updateSetting('notifications', 'pushNotificationsEnabled', value)}
          description="Send push notifications to mobile apps"
        />
        
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Notification Types</h4>
          
          <SettingField
            label="Order Status Updates"
            type="checkbox"
            value={settings.notifications.orderStatusUpdates}
            onChange={(value) => updateSetting('notifications', 'orderStatusUpdates', value)}
            description="Notify users about order status changes"
          />
          
          <SettingField
            label="Promotional Emails"
            type="checkbox"
            value={settings.notifications.promotionalEmails}
            onChange={(value) => updateSetting('notifications', 'promotionalEmails', value)}
            description="Send promotional offers and updates"
          />
        </div>
      </div>
    </div>
  );

  const FeatureSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Feature Configuration</h3>
      
      <div className="space-y-4">
        <SettingField
          label="Real-time Order Tracking"
          type="checkbox"
          value={settings.features.realTimeTracking}
          onChange={(value) => updateSetting('features', 'realTimeTracking', value)}
          description="Enable live tracking of orders and delivery agents"
        />
        
        <SettingField
          label="Ratings and Reviews"
          type="checkbox"
          value={settings.features.ratingsAndReviews}
          onChange={(value) => updateSetting('features', 'ratingsAndReviews', value)}
          description="Allow customers to rate and review restaurants"
        />
        
        <SettingField
          label="Loyalty Program"
          type="checkbox"
          value={settings.features.loyaltyProgram}
          onChange={(value) => updateSetting('features', 'loyaltyProgram', value)}
          description="Enable customer loyalty points and rewards"
        />
        
        <SettingField
          label="Restaurant Analytics"
          type="checkbox"
          value={settings.features.restaurantAnalytics}
          onChange={(value) => updateSetting('features', 'restaurantAnalytics', value)}
          description="Provide detailed analytics to restaurant owners"
        />
        
        <SettingField
          label="Agent Scheduling"
          type="checkbox"
          value={settings.features.agentScheduling}
          onChange={(value) => updateSetting('features', 'agentScheduling', value)}
          description="Advanced scheduling system for delivery agents"
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'platform':
        return <PlatformSettings />;
      case 'payment':
        return <PaymentSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'features':
        return <FeatureSettings />;
      default:
        return <PlatformSettings />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <TabButton
          id="platform"
          label="🏢 Platform"
          isActive={activeTab === 'platform'}
          onClick={setActiveTab}
        />
        <TabButton
          id="payment"
          label="💳 Payment"
          isActive={activeTab === 'payment'}
          onClick={setActiveTab}
        />
        <TabButton
          id="notifications"
          label="🔔 Notifications"
          isActive={activeTab === 'notifications'}
          onClick={setActiveTab}
        />
        <TabButton
          id="features"
          label="⚙️ Features"
          isActive={activeTab === 'features'}
          onClick={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {renderTabContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-600">
          Changes will be applied immediately to all users.
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => loadSettings()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset Changes
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Maintenance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear the system cache?')) {
                adminService.clearSystemCache();
                alert('System cache cleared successfully!');
              }
            }}
            className="flex items-center justify-center space-x-2 p-3 border border-yellow-300 rounded-lg hover:bg-yellow-50 text-yellow-700 transition-colors"
          >
            <span>🧹</span>
            <span>Clear Cache</span>
          </button>
          
          <button
            onClick={() => {
              if (confirm('Are you sure you want to run a system backup?')) {
                adminService.runSystemBackup();
                alert('System backup initiated!');
              }
            }}
            className="flex items-center justify-center space-x-2 p-3 border border-blue-300 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors"
          >
            <span>💾</span>
            <span>Run Backup</span>
          </button>
          
          <button
            onClick={() => {
              alert('System logs viewer (feature coming soon)');
            }}
            className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <span>📋</span>
            <span>View Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;