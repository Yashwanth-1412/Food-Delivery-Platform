import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      platformName: 'FoodDelivery Pro',
      supportEmail: 'support@fooddelivery.com',
      currency: 'USD',
      timezone: 'UTC',
      maintenanceMode: false,
      registrationEnabled: true
    },
    payments: {
      paymentGateway: 'stripe',
      commissionRate: 15,
      minimumOrderAmount: 10,
      deliveryFee: 2.99,
      processingFee: 0.30
    },
    features: {
      realTimeTracking: true,
      ratingsAndReviews: true,
      loyaltyProgram: false,
      restaurantAnalytics: true,
      agentScheduling: true,
      multiLanguage: false
    },
    notifications: {
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      pushNotificationsEnabled: true,
      orderStatusUpdates: true,
      promotionalEmails: true,
      marketingNotifications: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPasswords: true
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminApi.getPlatformSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
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
    setUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await adminApi.updatePlatformSettings(settings);
      if (response.success) {
        setUnsavedChanges(false);
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + response.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      // Reset to default values
      loadSettings();
      setUnsavedChanges(false);
    }
  };

  const SettingField = ({ label, type, value, onChange, description, options, disabled = false }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        
        {type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        )}
        
        {type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        )}
        
        {type === 'email' && (
          <input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        )}
        
        {type === 'select' && (
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
        )}
        
        {type === 'checkbox' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
            />
            <span className="ml-2 text-sm text-gray-600">Enable this feature</span>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
    );
  };

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  const GeneralSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField
          label="Platform Name"
          type="text"
          value={settings.general.platformName}
          onChange={(value) => updateSetting('general', 'platformName', value)}
          description="The name of your food delivery platform"
        />
        
        <SettingField
          label="Support Email"
          type="email"
          value={settings.general.supportEmail}
          onChange={(value) => updateSetting('general', 'supportEmail', value)}
          description="Email address for customer support"
        />
        
        <SettingField
          label="Default Currency"
          type="select"
          value={settings.general.currency}
          onChange={(value) => updateSetting('general', 'currency', value)}
          options={[
            { value: 'USD', label: 'USD - US Dollar' },
            { value: 'EUR', label: 'EUR - Euro' },
            { value: 'GBP', label: 'GBP - British Pound' },
            { value: 'INR', label: 'INR - Indian Rupee' }
          ]}
          description="Default currency for transactions"
        />
        
        <SettingField
          label="Timezone"
          type="select"
          value={settings.general.timezone}
          onChange={(value) => updateSetting('general', 'timezone', value)}
          options={[
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'Eastern Time' },
            { value: 'America/Los_Angeles', label: 'Pacific Time' },
            { value: 'Europe/London', label: 'London' },
            { value: 'Asia/Kolkata', label: 'India Standard Time' }
          ]}
          description="Platform timezone for scheduling and logs"
        />
        
        <SettingField
          label="Maintenance Mode"
          type="checkbox"
          value={settings.general.maintenanceMode}
          onChange={(value) => updateSetting('general', 'maintenanceMode', value)}
          description="Enable maintenance mode to temporarily disable the platform"
        />
        
        <SettingField
          label="User Registration"
          type="checkbox"
          value={settings.general.registrationEnabled}
          onChange={(value) => updateSetting('general', 'registrationEnabled', value)}
          description="Allow new users to register on the platform"
        />
      </div>
    </div>
  );

  const PaymentSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField
          label="Payment Gateway"
          type="select"
          value={settings.payments.paymentGateway}
          onChange={(value) => updateSetting('payments', 'paymentGateway', value)}
          options={[
            { value: 'stripe', label: 'Stripe' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'razorpay', label: 'Razorpay' },
            { value: 'square', label: 'Square' }
          ]}
          description="Primary payment processing service"
        />
        
        <SettingField
          label="Commission Rate (%)"
          type="number"
          value={settings.payments.commissionRate}
          onChange={(value) => updateSetting('payments', 'commissionRate', value)}
          description="Platform commission percentage on orders"
        />
        
        <SettingField
          label="Minimum Order Amount"
          type="number"
          value={settings.payments.minimumOrderAmount}
          onChange={(value) => updateSetting('payments', 'minimumOrderAmount', value)}
          description="Minimum order value required for checkout"
        />
        
        <SettingField
          label="Delivery Fee"
          type="number"
          value={settings.payments.deliveryFee}
          onChange={(value) => updateSetting('payments', 'deliveryFee', value)}
          description="Standard delivery fee charged to customers"
        />
        
        <SettingField
          label="Processing Fee"
          type="number"
          value={settings.payments.processingFee}
          onChange={(value) => updateSetting('payments', 'processingFee', value)}
          description="Fixed fee per transaction"
        />
      </div>
    </div>
  );

  const FeatureSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Feature Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <SettingField
          label="Multi-language Support"
          type="checkbox"
          value={settings.features.multiLanguage}
          onChange={(value) => updateSetting('features', 'multiLanguage', value)}
          description="Enable multiple language options for users"
        />
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notification Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <SettingField
          label="Marketing Notifications"
          type="checkbox"
          value={settings.notifications.marketingNotifications}
          onChange={(value) => updateSetting('notifications', 'marketingNotifications', value)}
          description="Send marketing and campaign notifications"
        />
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingField
          label="Two-Factor Authentication"
          type="checkbox"
          value={settings.security.twoFactorAuth}
          onChange={(value) => updateSetting('security', 'twoFactorAuth', value)}
          description="Require 2FA for admin and restaurant accounts"
        />
        
        <SettingField
          label="Session Timeout (hours)"
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(value) => updateSetting('security', 'sessionTimeout', value)}
          description="Automatic logout after inactivity"
        />
        
        <SettingField
          label="Max Login Attempts"
          type="number"
          value={settings.security.maxLoginAttempts}
          onChange={(value) => updateSetting('security', 'maxLoginAttempts', value)}
          description="Lock account after failed login attempts"
        />
        
        <SettingField
          label="Minimum Password Length"
          type="number"
          value={settings.security.passwordMinLength}
          onChange={(value) => updateSetting('security', 'passwordMinLength', value)}
          description="Minimum characters required for passwords"
        />
        
        <SettingField
          label="Strong Password Requirements"
          type="checkbox"
          value={settings.security.requireStrongPasswords}
          onChange={(value) => updateSetting('security', 'requireStrongPasswords', value)}
          description="Require uppercase, lowercase, numbers, and symbols"
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'payments':
        return <PaymentSettings />;
      case 'features':
        return <FeatureSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
          <p className="text-gray-600">Configure your platform's behavior and features</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !unsavedChanges}
            className={`px-4 py-2 rounded-md text-white ${
              saving || !unsavedChanges
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <span className="text-yellow-400 mr-3">⚠️</span>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
              <p className="text-sm text-yellow-700">You have unsaved changes. Don't forget to save your settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          <TabButton
            id="general"
            label="General"
            isActive={activeTab === 'general'}
            onClick={setActiveTab}
          />
          <TabButton
            id="payments"
            label="Payments"
            isActive={activeTab === 'payments'}
            onClick={setActiveTab}
          />
          <TabButton
            id="features"
            label="Features"
            isActive={activeTab === 'features'}
            onClick={setActiveTab}
          />
          <TabButton
            id="notifications"
            label="Notifications"
            isActive={activeTab === 'notifications'}
            onClick={setActiveTab}
          />
          <TabButton
            id="security"
            label="Security"
            isActive={activeTab === 'security'}
            onClick={setActiveTab}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PlatformSettings;