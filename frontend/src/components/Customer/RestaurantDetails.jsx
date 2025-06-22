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
          allItems.push({ ...item, categoryName: category.name });
        });
      }
    });

    // Filter by category
    if (selectedCategory !== 'all') {
      allItems = allItems.filter(item => 
        menu.categories.find(cat => cat.id === selectedCategory)?.items.includes(item)
      );
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

  const MenuItem = ({ item }) => {
    const cartQuantity = getCartItemQuantity(item.id);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                {item.description && (
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                )}
                
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-bold text-green-600">
                    ${item.price?.toFixed(2) || '0.00'}
                  </span>
                  
                  {item.prep_time && (
                    <span className="text-sm text-gray-500">🕒 {item.prep_time} min</span>
                  )}
                  
                  {item.is_vegetarian && (
                    <span className="text-green-600 text-sm">🌱 Vegetarian</span>
                  )}
                  
                  {item.is_vegan && (
                    <span className="text-green-600 text-sm">🌿 Vegan</span>
                  )}
                  
                  {item.is_spicy && (
                    <span className="text-red-600 text-sm">🌶️ Spicy</span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">
                  ${item.price?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className={`text-sm font-medium ${
                item.is_available 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {item.is_available ? 'Available' : 'Currently Unavailable'}
              </div>
              
              {item.is_available ? (
                <div className="flex items-center space-x-2">
                  {cartQuantity > 0 && (
                    <span className="text-sm text-gray-600">In cart: {cartQuantity}</span>
                  )}
                  <button
                    onClick={() => onAddToCart(restaurant, item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Unavailable
                </button>
              )}
            </div>
          </div>
          
          {item.image_url && (
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Restaurants
      </button>

      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <img
              src={restaurant.image_url || '/api/placeholder/300/200'}
              alt={restaurant.name}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgODBIMTgwVjEyMEgxMjBWODBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LXNpemU9IjEyIj5JbWFnZTwvdGV4dD4KPC9zdmc+';
              }}
            />
          </div>
          
          <div className="md:w-2/3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                <p className="text-gray-600 mt-2">{restaurant.description}</p>
                
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-medium ml-1">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  
                  <span className="text-gray-500">•</span>
                  
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    {restaurant.cuisine}
                  </div>
                  
                  <span className="text-gray-500">•</span>
                  
                  <span className="text-gray-600">🕒 {restaurant.delivery_time}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span>Delivery Fee: ${restaurant.delivery_fee?.toFixed(2) || '0.00'}</span>
                  <span>•</span>
                  <span>Minimum Order: ${restaurant.min_order?.toFixed(2) || '0.00'}</span>
                </div>
                
                {restaurant.address && (
                  <div className="mt-3 text-sm text-gray-600">
                    📍 {restaurant.address}
                  </div>
                )}
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                restaurant.is_open 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.is_open ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
        
        {/* Menu Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {menu.categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        {menu.categories && menu.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {menu.categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.items?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        {getFilteredItems().length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {menu.categories?.length === 0 ? 'No menu available' : 'No items found'}
            </h3>
            <p className="text-gray-500">
              {menu.categories?.length === 0 
                ? 'This restaurant hasn\'t uploaded their menu yet.'
                : 'Try adjusting your search or category filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredItems().map(item => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetails;