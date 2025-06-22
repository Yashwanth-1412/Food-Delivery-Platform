// frontend/src/components/Customer/CustomerApp.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';
import RestaurantList from './RestaurantList';
import RestaurantDetails from './RestaurantDetails';
import CartManager from './CartManager';
import OrderHistory from './OrderHistory';
import CustomerProfile from './CustomerProfile';

const CustomerApp = ({ user, userRole, onLogout }) => {
  const [activeView, setActiveView] = useState('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  const loadCustomerProfile = async () => {
    try {
      setLoading(true);
      // Try to load customer profile
      try {
        const profileRes = await customerService.getProfile();
        if (profileRes.success && profileRes.data) {
          setCustomerProfile(profileRes.data);
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        // Set default profile
        setCustomerProfile({
          name: user?.displayName || 'Customer',
          email: user?.email || '',
          phone: '',
          addresses: []
        });
      }
    } catch (error) {
      console.error('Error loading customer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view, data = null) => {
    setActiveView(view);
    if (view === 'restaurant-details' && data) {
      setSelectedRestaurant(data);
    }
  };

  const addToCart = (restaurant, item, quantity = 1) => {
    // If cart has items from different restaurant, confirm switch
    if (cartRestaurant && cartRestaurant.id !== restaurant.id && cart.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart contains items from ${cartRestaurant.name}. Do you want to clear it and add items from ${restaurant.name}?`
      );
      if (!confirmSwitch) return;
      
      setCart([]);
    }

    setCartRestaurant(restaurant);
    
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      setCart(prev => [...prev, { ...item, quantity }]);
    }
  };

  const updateCartItem = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    
    // Clear cart restaurant if cart becomes empty
    if (cart.length === 1) {
      setCartRestaurant(null);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCartRestaurant(null);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { id: 'restaurants', name: 'Restaurants', icon: '🏪', description: 'Browse restaurants' },
    { id: 'orders', name: 'My Orders', icon: '📦', description: 'Order history' },
    { id: 'profile', name: 'Profile', icon: '👤', description: 'Account settings' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'restaurants':
        return (
          <RestaurantList 
            onSelectRestaurant={(restaurant) => handleViewChange('restaurant-details', restaurant)}
          />
        );
      case 'restaurant-details':
        return (
          <RestaurantDetails 
            restaurant={selectedRestaurant}
            onBack={() => handleViewChange('restaurants')}
            onAddToCart={addToCart}
            cart={cart}
          />
        );
      case 'orders':
        return <OrderHistory />;
      case 'profile':
        return (
          <CustomerProfile 
            profile={customerProfile}
            onUpdate={loadCustomerProfile}
          />
        );
      default:
        return (
          <RestaurantList 
            onSelectRestaurant={(restaurant) => handleViewChange('restaurant-details', restaurant)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-2xl">🍽️</span>
                <h1 className="ml-2 text-xl font-semibold text-gray-900">FoodDelivery</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <button
                onClick={() => setActiveView('cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <span className="text-2xl">🛒</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Hello, {customerProfile?.name || user?.displayName || 'Customer'}</span>
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div className="text-left">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>

          {/* Cart Sidebar */}
          {cart.length > 0 && (
            <div className="w-80">
              <CartManager
                cart={cart}
                restaurant={cartRestaurant}
                onUpdateItem={updateCartItem}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                total={getCartTotal()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Cart Modal for Mobile/Small Screens */}
      {activeView === 'cart' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Cart</h3>
              <button
                onClick={() => setActiveView('restaurants')}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {cart.length > 0 ? (
                <CartManager
                  cart={cart}
                  restaurant={cartRestaurant}
                  onUpdateItem={updateCartItem}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  total={getCartTotal()}
                  isModal={true}
                />
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">🛒</span>
                  <p className="text-gray-500">Your cart is empty</p>
                  <button
                    onClick={() => setActiveView('restaurants')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Browse Restaurants
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerApp;