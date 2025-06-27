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
  const [cartSyncing, setCartSyncing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // Add state for user menu

  useEffect(() => {
    loadCustomerProfile();
    loadCartFromDatabase();
  }, []);

  // Auto-sync cart to database when cart changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cart.length > 0 || cartRestaurant) {
        syncCartToDatabase();
      }
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [cart, cartRestaurant]);

  const loadCartFromDatabase = async () => {
    try {
      const response = await customerService.getPendingCart();
      if (response.success && response.data) {
        const cartData = response.data;
        if (cartData.items && cartData.items.length > 0) {
          setCart(cartData.items);
          setCartRestaurant(cartData.restaurant_info);
          console.log('Cart loaded from database:', cartData.items.length, 'items');
        }
      }
    } catch (error) {
      console.error('Error loading cart from database:', error);
      // Fall back to localStorage if database fails
      loadCartFromLocalStorage();
    }
  };

  const syncCartToDatabase = async () => {
    try {
      setCartSyncing(true);
      await customerService.syncCart(cart, cartRestaurant);
      console.log('Cart synced to database');
    } catch (error) {
      console.error('Error syncing cart to database:', error);
      // Fall back to localStorage
      saveCartToLocalStorage();
    } finally {
      setCartSyncing(false);
    }
  };

  // Fallback localStorage functions
  const getCartStorageKey = (userId) => `cart_${userId}`;
  const getCartRestaurantStorageKey = (userId) => `cart_restaurant_${userId}`;

  const loadCartFromLocalStorage = () => {
    if (!user?.uid) return;
    
    try {
      const savedCart = JSON.parse(localStorage.getItem(getCartStorageKey(user.uid)) || '[]');
      const savedRestaurant = JSON.parse(localStorage.getItem(getCartRestaurantStorageKey(user.uid)) || 'null');
      
      if (savedCart.length > 0) {
        setCart(savedCart);
        setCartRestaurant(savedRestaurant);
        console.log('Cart loaded from localStorage (fallback):', savedCart.length, 'items');
        // Sync to database
        setTimeout(() => syncCartToDatabase(), 100);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  };

  const saveCartToLocalStorage = () => {
    if (!user?.uid) return;
    
    try {
      localStorage.setItem(getCartStorageKey(user.uid), JSON.stringify(cart));
      localStorage.setItem(getCartRestaurantStorageKey(user.uid), JSON.stringify(cartRestaurant));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

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

  const addToCart = async (restaurant, item, quantity = 1) => {
    // If cart has items from different restaurant, confirm switch
    if (cartRestaurant && cartRestaurant.id !== restaurant.id && cart.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart contains items from ${cartRestaurant.name}. Do you want to clear it and add items from ${restaurant.name}?`
      );
      if (!confirmSwitch) return;
      
      setCart([]);
      setCartRestaurant(null);
      // Clear in database
      try {
        await customerService.clearCart();
      } catch (error) {
        console.error('Error clearing cart in database:', error);
      }
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

    // Immediate sync for add to cart action
    try {
      await customerService.addItemToCart(restaurant.id, restaurant, {
        ...item,
        quantity
      });
    } catch (error) {
      console.error('Error adding item to cart in database:', error);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));

    // Sync to database
    try {
      await customerService.updateCartItemQuantity(itemId, quantity);
    } catch (error) {
      console.error('Error updating cart item in database:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    
    // Clear cart restaurant if cart becomes empty
    if (cart.length === 1) {
      setCartRestaurant(null);
    }

    // Sync to database
    try {
      await customerService.removeCartItem(itemId);
    } catch (error) {
      console.error('Error removing cart item from database:', error);
    }
  };

  const clearCart = async () => {
    setCart([]);
    setCartRestaurant(null);

    // Clear in database
    try {
      await customerService.clearCart();
    } catch (error) {
      console.error('Error clearing cart in database:', error);
    }

    // Clear localStorage backup
    if (user?.uid) {
      try {
        localStorage.removeItem(getCartStorageKey(user.uid));
        localStorage.removeItem(getCartRestaurantStorageKey(user.uid));
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Cart sync indicator component
  const CartSyncIndicator = () => {
    if (!cartSyncing) return null;

    return (
      <div className="fixed bottom-6 right-6 bg-white shadow-2xl border border-orange-200 text-orange-700 px-5 py-3 rounded-2xl text-sm z-50 flex items-center font-medium">
        <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full mr-3"></div>
        Syncing cart...
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Preparing Your Feast</h2>
          <p className="text-gray-600">Loading delicious options...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { 
      id: 'restaurants', 
      name: 'Discover', 
      icon: '🏪', 
      description: 'Find restaurants',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      id: 'orders', 
      name: 'Orders', 
      icon: '📦', 
      description: 'Track orders',
      gradient: 'from-blue-500 to-purple-500'
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      icon: '👤', 
      description: 'Your account',
      gradient: 'from-green-500 to-teal-500'
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Premium Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  FoodieHub
                </h1>
                <p className="text-sm text-gray-500 font-medium">Taste the difference</p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center space-x-6">
              {/* Search Bar */}
              <div className="hidden md:block relative">
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  className="w-80 pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>

              {/* Cart Button */}
              <button
                onClick={() => setActiveView('cart')}
                className="relative group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-xl">🛒</span>
                </div>
                {getCartItemCount() > 0 && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-sm rounded-full flex items-center justify-center font-bold shadow-lg">
                    {getCartItemCount()}
                  </div>
                )}
                {cartSyncing && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    <div className="animate-spin h-2 w-2 border border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </button>
              
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {customerProfile?.name || user?.displayName || 'Welcome'}
                  </p>
                  <p className="text-xs text-gray-500">Food Explorer</p>
                </div>
                <div className="relative group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(customerProfile?.name || user?.displayName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="absolute right-0 top-14 hidden group-hover:block bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-48">
                    <button
                      onClick={() => handleViewChange('profile')}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="w-full px-6 lg:px-8 py-8">
        <div className="flex gap-8 min-h-[calc(100vh-140px)]">
          {/* Sidebar Navigation */}
          <div className="w-80">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-100 p-8 sticky top-32">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Explore</h2>
                <p className="text-gray-600">Your culinary journey starts here</p>
              </div>
              
              <nav className="space-y-4">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                      activeView === item.id
                        ? 'shadow-xl scale-105'
                        : 'hover:shadow-lg hover:scale-102'
                    }`}
                  >
                    <div className={`w-full p-6 bg-gradient-to-r ${item.gradient} ${
                      activeView === item.id ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{item.icon}</div>
                        <div className="text-left text-white">
                          <div className="font-bold text-lg">{item.name}</div>
                          <div className="text-sm opacity-90">{item.description}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl border border-orange-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <span className="text-lg mr-2">📊</span>
                  Your Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-gray-600 font-medium">Cart Items</span>
                    <span className="font-bold text-orange-600 text-lg">{getCartItemCount()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="font-bold text-green-600 text-lg">${getCartTotal().toFixed(2)}</span>
                  </div>
                  {cartRestaurant && (
                    <div className="p-3 bg-white rounded-xl">
                      <span className="text-gray-600 font-medium text-sm">Current Restaurant</span>
                      <p className="font-bold text-gray-800 truncate">{cartRestaurant.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-100 min-h-full">
              {renderContent()}
            </div>
          </div>

          {/* Cart Sidebar */}
          {cart.length > 0 && (
            <div className="w-96">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-100 sticky top-32">
                <div className="p-6 border-b border-orange-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🛒</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Your Order</h3>
                      <p className="text-sm text-gray-600">{cartRestaurant?.name || 'Ready to checkout'}</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <CartManager
                    cart={cart}
                    restaurant={cartRestaurant}
                    onUpdateItem={updateCartItem}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                    total={getCartTotal()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Cart Modal */}
      {activeView === 'cart' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">🛒</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Your Cart</h3>
                    <p className="text-sm text-gray-600">{cartRestaurant?.name || 'Review your order'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('restaurants')}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
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
                <div className="text-center py-16 px-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🍽️</span>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h4>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Discover amazing restaurants and delicious food waiting for you
                  </p>
                  <button
                    onClick={() => setActiveView('restaurants')}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                  >
                    Start Exploring
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sync Indicator */}
      <CartSyncIndicator />
    </div>
  );
};

export default CustomerApp;