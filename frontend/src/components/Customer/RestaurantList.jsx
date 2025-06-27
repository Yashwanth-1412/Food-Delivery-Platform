// frontend/src/components/Customer/RestaurantList.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';

const RestaurantList = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterAndSortRestaurants();
  }, [restaurants, searchTerm, selectedCuisine, sortBy, showOpenOnly]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      
      // Try to load real restaurant data from backend
      try {
        const response = await customerService.getAvailableRestaurants();
        if (response.success && response.data && response.data.length > 0) {
          // Map backend data to frontend format
          const mappedRestaurants = response.data.map(restaurant => ({
            id: restaurant.id,
            restaurant_name: restaurant.name || restaurant.restaurant_name,
            name: restaurant.name || restaurant.restaurant_name,
            description: restaurant.description || 'Delicious food awaits you',
            cuisine_type: restaurant.cuisine || restaurant.cuisine_type,
            cuisine: restaurant.cuisine || restaurant.cuisine_type,
            logo_url: restaurant.image_url || restaurant.logo_url,
            image_url: restaurant.image_url || restaurant.logo_url,
            rating: restaurant.rating || 4.0,
            delivery_time: restaurant.delivery_time || '30-45 min',
            delivery_fee: restaurant.delivery_fee || 2.99,
            minimum_order: restaurant.minimum_order || 15.00,
            is_open: restaurant.is_open !== undefined ? restaurant.is_open : true,
            distance: restaurant.distance || '2.5 km'
          }));
          
          setRestaurants(mappedRestaurants);
          console.log('Loaded restaurants from backend:', mappedRestaurants.length);
        } else {
          throw new Error('No restaurants found in backend');
        }
      } catch (error) {
        console.error('Error loading restaurants from backend:', error);
        console.log('Using mock restaurant data');
        
        // Fallback to mock data
        const mockRestaurants = [
          {
            id: 'mock1',
            name: 'Bella Italia',
            description: 'Authentic Italian cuisine with fresh ingredients',
            cuisine: 'Italian',
            rating: 4.5,
            delivery_time: '25-35 min',
            delivery_fee: 2.99,
            minimum_order: 15.00,
            is_open: true,
            distance: '1.2 km',
            image_url: null
          },
          {
            id: 'mock2',
            name: 'Spice Garden',
            description: 'Traditional Indian flavors and aromatic spices',
            cuisine: 'Indian',
            rating: 4.3,
            delivery_time: '30-40 min',
            delivery_fee: 1.99,
            minimum_order: 20.00,
            is_open: true,
            distance: '2.8 km',
            image_url: null
          },
          {
            id: 'mock3',
            name: 'Tokyo Sushi',
            description: 'Fresh sushi and Japanese delicacies',
            cuisine: 'Japanese',
            rating: 4.7,
            delivery_time: '20-30 min',
            delivery_fee: 3.99,
            minimum_order: 25.00,
            is_open: false,
            distance: '1.5 km',
            image_url: null
          },
          {
            id: 'mock4',
            name: 'Burger Palace',
            description: 'Gourmet burgers and crispy fries',
            cuisine: 'American',
            rating: 4.2,
            delivery_time: '15-25 min',
            delivery_fee: 2.49,
            minimum_order: 12.00,
            is_open: true,
            distance: '0.8 km',
            image_url: null
          },
          {
            id: 'mock5',
            name: 'Green Bowl',
            description: 'Healthy salads and fresh smoothies',
            cuisine: 'Healthy',
            rating: 4.4,
            delivery_time: '20-30 min',
            delivery_fee: 1.99,
            minimum_order: 18.00,
            is_open: true,
            distance: '1.8 km',
            image_url: null
          }
        ];
        
        setRestaurants(mockRestaurants);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRestaurants = () => {
    let filtered = [...restaurants];

    // Filter by open status
    if (showOpenOnly) {
      filtered = filtered.filter(restaurant => restaurant.is_open);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by cuisine
    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase() === selectedCuisine.toLowerCase()
      );
    }

    // Sort restaurants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'delivery_time':
          return parseInt(a.delivery_time) - parseInt(b.delivery_time);
        case 'delivery_fee':
          return a.delivery_fee - b.delivery_fee;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        default:
          return 0;
      }
    });

    setFilteredRestaurants(filtered);
  };

  const getCuisineTypes = () => {
    const cuisines = [...new Set(restaurants.map(r => r.cuisine))];
    return cuisines.sort();
  };

  const getCuisineEmoji = (cuisine) => {
    const emojiMap = {
      'Italian': '🍝',
      'Indian': '🍛',
      'Japanese': '🍣',
      'American': '🍔',
      'Chinese': '🥢',
      'Mexican': '🌮',
      'Thai': '🍜',
      'French': '🥐',
      'Healthy': '🥗',
      'Pizza': '🍕',
      'Dessert': '🧁'
    };
    return emojiMap[cuisine] || '🍽️';
  };

  if (loading) {
    return (
      <div className="p-12">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Finding Amazing Restaurants</h3>
            <p className="text-gray-600">Discovering delicious options near you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
          Discover Restaurants
        </h1>
        <p className="text-xl text-gray-600">Find amazing food delivered to your door</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 text-lg"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </div>
            </div>
          </div>

          {/* Cuisine Filter */}
          <div>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 text-lg"
            >
              <option value="all">All Cuisines</option>
              {getCuisineTypes().map(cuisine => (
                <option key={cuisine} value={cuisine}>
                  {getCuisineEmoji(cuisine)} {cuisine}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 text-lg"
            >
              <option value="rating">⭐ Rating</option>
              <option value="delivery_time">⏱️ Delivery Time</option>
              <option value="delivery_fee">💰 Delivery Fee</option>
              <option value="distance">📍 Distance</option>
            </select>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowOpenOnly(!showOpenOnly)}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
              showOpenOnly
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">🟢</span>
            Open Now Only
          </button>
          
          <div className="text-gray-600 font-medium py-3 px-2">
            Found {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-gray-400">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No restaurants found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCuisine('all');
              setShowOpenOnly(false);
            }}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onSelect={() => onSelectRestaurant(restaurant)}
              getCuisineEmoji={getCuisineEmoji}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Premium Restaurant Card Component
const RestaurantCard = ({ restaurant, onSelect, getCuisineEmoji }) => {
  return (
    <div 
      onClick={onSelect}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
    >
      {/* Restaurant Image */}
      <div className="h-48 bg-gradient-to-br from-orange-100 via-red-50 to-yellow-100 relative overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">{getCuisineEmoji(restaurant.cuisine)}</div>
              <div className="text-gray-500 font-medium">{restaurant.cuisine}</div>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            restaurant.is_open
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {restaurant.is_open ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-bold text-gray-800">{restaurant.rating}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {restaurant.description}
          </p>
        </div>

        {/* Cuisine Type */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-medium">
            <span className="mr-2">{getCuisineEmoji(restaurant.cuisine)}</span>
            {restaurant.cuisine}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <span>⏱️</span>
              <span className="font-medium text-gray-700">{restaurant.delivery_time}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <span>🚚</span>
              <span className="font-medium text-gray-700">${restaurant.delivery_fee}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <span>📍</span>
              <span className="font-medium text-gray-700">{restaurant.distance}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <span>💳</span>
              <span className="font-medium text-gray-700">Min ${restaurant.minimum_order}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            restaurant.is_open
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-102'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!restaurant.is_open}
        >
          {restaurant.is_open ? 'View Menu 🍽️' : 'Currently Closed'}
        </button>
      </div>
    </div>
  );
};

export default RestaurantList;