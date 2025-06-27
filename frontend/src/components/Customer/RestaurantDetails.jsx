// frontend/src/components/Customer/RestaurantDetails.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';

const RestaurantDetails = ({ restaurant, onBack, onAddToCart, cart }) => {
  const [menu, setMenu] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (restaurant) {
      loadMenu();
    }
  }, [restaurant]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      try {
        const response = await customerService.getRestaurantMenu(restaurant.id);
        if (response.success && response.data) {
          setMenu(response.data);
        } else {
          throw new Error('Backend menu not available');
        }
      } catch (error) {
        console.error('Error loading menu:', error);
        console.log('Using mock menu data');
        
        // Mock menu data for demonstration
        const mockMenu = {
          categories: [
            {
              id: 'appetizers',
              name: 'Appetizers',
              description: 'Start your meal right',
              items: [
                {
                  id: 'app1',
                  name: 'Crispy Calamari',
                  description: 'Fresh squid rings with marinara sauce',
                  price: 12.99,
                  image_url: null,
                  dietary_options: ['gluten-free available'],
                  prep_time: '10-15 min'
                },
                {
                  id: 'app2',
                  name: 'Buffalo Wings',
                  description: 'Spicy chicken wings with blue cheese dip',
                  price: 14.99,
                  image_url: null,
                  dietary_options: ['spicy'],
                  prep_time: '15-20 min'
                }
              ]
            },
            {
              id: 'mains',
              name: 'Main Courses',
              description: 'Hearty and satisfying meals',
              items: [
                {
                  id: 'main1',
                  name: 'Grilled Salmon',
                  description: 'Atlantic salmon with lemon herb butter',
                  price: 24.99,
                  image_url: null,
                  dietary_options: ['healthy', 'gluten-free'],
                  prep_time: '20-25 min'
                },
                {
                  id: 'main2',
                  name: 'Pasta Carbonara',
                  description: 'Creamy pasta with bacon and parmesan',
                  price: 18.99,
                  image_url: null,
                  dietary_options: [],
                  prep_time: '15-20 min'
                },
                {
                  id: 'main3',
                  name: 'Veggie Burger',
                  description: 'Plant-based patty with avocado and sprouts',
                  price: 16.99,
                  image_url: null,
                  dietary_options: ['vegetarian', 'vegan available'],
                  prep_time: '12-18 min'
                }
              ]
            },
            {
              id: 'desserts',
              name: 'Desserts',
              description: 'Sweet endings to your meal',
              items: [
                {
                  id: 'dessert1',
                  name: 'Chocolate Lava Cake',
                  description: 'Warm chocolate cake with vanilla ice cream',
                  price: 8.99,
                  image_url: null,
                  dietary_options: ['vegetarian'],
                  prep_time: '8-12 min'
                },
                {
                  id: 'dessert2',
                  name: 'Tiramisu',
                  description: 'Classic Italian coffee-flavored dessert',
                  price: 7.99,
                  image_url: null,
                  dietary_options: ['vegetarian'],
                  prep_time: '5 min'
                }
              ]
            }
          ]
        };
        
        setMenu(mockMenu);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setMenu({ categories: [] });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    if (!menu.categories) return [];
    
    let allItems = [];
    menu.categories.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          allItems.push({ ...item, categoryId: category.id, categoryName: category.name });
        });
      }
    });
  
    // Filter by category
    if (selectedCategory !== 'all') {
      allItems = allItems.filter(item => item.categoryId === selectedCategory);
    }
  
    // Filter by search term
    if (searchTerm) {
      allItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return allItems;
  };
  
  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getDietaryIcon = (option) => {
    const icons = {
      'vegetarian': '🌱',
      'vegan': '🌿',
      'vegan available': '🌿',
      'gluten-free': '🌾',
      'gluten-free available': '🌾',
      'spicy': '🌶️',
      'healthy': '💚'
    };
    return icons[option] || '🍽️';
  };

  if (loading) {
    return (
      <div className="p-12">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Menu</h3>
            <p className="text-gray-600">Preparing delicious options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">←</span>
          <span className="font-medium text-gray-700">Back to Restaurants</span>
        </button>

        {/* Restaurant Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  {restaurant.name}
                </h1>
                <p className="text-xl text-gray-600 mb-3">{restaurant.description}</p>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-xl font-medium">
                    <span className="mr-2">🍴</span>
                    {restaurant.cuisine}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500 text-lg">⭐</span>
                    <span className="font-bold text-gray-800">{restaurant.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`px-4 py-2 rounded-xl font-bold ${
                restaurant.is_open 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {restaurant.is_open ? '🟢 Open Now' : '🔴 Closed'}
              </div>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="font-medium text-gray-700">{restaurant.delivery_time}</div>
              <div className="text-sm text-gray-500">Delivery Time</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">🚚</div>
              <div className="font-medium text-gray-700">${restaurant.delivery_fee}</div>
              <div className="text-sm text-gray-500">Delivery Fee</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium text-gray-700">${restaurant.minimum_order}</div>
              <div className="text-sm text-gray-500">Minimum Order</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
            >
              <option value="all">All Categories</option>
              {menu.categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {getFilteredItems().length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-gray-400">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No items found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or category filter</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold"
          >
            Show All Items
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getFilteredItems().map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              restaurant={restaurant}
              onAddToCart={onAddToCart}
              cartQuantity={getCartItemQuantity(item.id)}
              getDietaryIcon={getDietaryIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Premium Menu Item Card Component
const MenuItemCard = ({ item, restaurant, onAddToCart, cartQuantity, getDietaryIcon }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(restaurant, item, quantity);
    setQuantity(1);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 overflow-hidden group hover:shadow-2xl transition-all duration-300">
      {/* Item Image */}
      <div className="h-48 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🍽️</div>
              <div className="text-gray-500 font-medium">{item.categoryName}</div>
            </div>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2">
          <span className="text-2xl font-bold text-gray-800">${item.price}</span>
        </div>

        {/* Prep Time */}
        {item.prep_time && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white rounded-xl px-3 py-1 text-sm font-medium">
            ⏱️ {item.prep_time}
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Dietary Options */}
        {item.dietary_options && item.dietary_options.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {item.dietary_options.map((option, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                >
                  <span className="mr-1">{getDietaryIcon(option)}</span>
                  {option}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart Section */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center bg-white rounded-xl border border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-l-xl transition-colors"
                >
                  −
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-medium text-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-r-xl transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddToCart}
              disabled={!restaurant.is_open}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
                restaurant.is_open
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {restaurant.is_open ? `Add ${(item.price * quantity).toFixed(2)}` : 'Unavailable'}
            </button>
          </div>

          {/* Cart Status */}
          {cartQuantity > 0 && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                <span className="mr-2">✓</span>
                {cartQuantity} in cart
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;