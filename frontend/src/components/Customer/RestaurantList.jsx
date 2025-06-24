// frontend/src/components/Customer/RestaurantList.jsx - FIXED VERSION
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
            min_order: restaurant.min_order || 15.00,
            is_open: restaurant.is_open !== false, // Default to true if not specified
            address: restaurant.address || restaurant.address_line_1,
            phone: restaurant.phone
          }));
          
          setRestaurants(mappedRestaurants);
          return;
        }
      } catch (error) {
        console.log('Backend not available, using mock data:', error);
      }
      
      // Fallback to mock data if backend is not available
      const mockRestaurants = [
        {
          id: '1',
          restaurant_name: 'Burger Spot',
          name: 'Burger Spot',
          description: 'Lets eat fast burgers',
          cuisine_type: 'american',
          cuisine: 'american',
          logo_url: 'http://localhost:5000/static/uploads/restaurant_logos/logo_1_xyz.jpg',
          image_url: 'http://localhost:5000/static/uploads/restaurant_logos/logo_1_xyz.jpg',
          rating: 4.5,
          delivery_time: '30-45 min',
          delivery_fee: 2.99,
          min_order: 15.00,
          is_open: true,
          address: '123 Main St',
          phone: '(555) 123-4567'
        },
        {
          id: '2',
          restaurant_name: 'Pizza Palace',
          name: 'Pizza Palace',
          description: 'Authentic Italian pizzas made fresh',
          cuisine_type: 'italian',
          cuisine: 'italian',
          logo_url: '/api/placeholder/150/150',
          image_url: '/api/placeholder/300/200',
          rating: 4.2,
          delivery_time: '25-40 min',
          delivery_fee: 3.49,
          min_order: 20.00,
          is_open: true,
          address: '456 Oak Ave',
          phone: '(555) 987-6543'
        },
        {
          id: '3',
          restaurant_name: 'Taco House',
          name: 'Taco House',
          description: 'Fresh Mexican cuisine and tacos',
          cuisine_type: 'mexican',
          cuisine: 'mexican',
          logo_url: '/api/placeholder/150/150',
          image_url: '/api/placeholder/300/200',
          rating: 4.7,
          delivery_time: '20-35 min',
          delivery_fee: 2.49,
          min_order: 12.00,
          is_open: false,
          address: '789 Pine St',
          phone: '(555) 456-7890'
        }
      ];
      
      setRestaurants(mockRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };;

  const filterAndSortRestaurants = () => {
    let filtered = [...restaurants];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(restaurant => 
        (restaurant.restaurant_name || restaurant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (restaurant.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (restaurant.cuisine_type || restaurant.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Cuisine filter
    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(restaurant => 
        (restaurant.cuisine_type || restaurant.cuisine) === selectedCuisine
      );
    }

    // Open status filter
    if (showOpenOnly) {
      filtered = filtered.filter(restaurant => restaurant.is_open);
    }

    // Sort restaurants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'delivery_time': {
          const aTime = parseInt((a.delivery_time || '999').replace(/\D/g, '')) || 999;
          const bTime = parseInt((b.delivery_time || '999').replace(/\D/g, '')) || 999;
          return aTime - bTime;
        }
        case 'delivery_fee':
          return (a.delivery_fee || 999) - (b.delivery_fee || 999);
        case 'name':
          const aName = a.restaurant_name || a.name || '';
          const bName = b.restaurant_name || b.name || '';
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    setFilteredRestaurants(filtered);
  };

  const getCuisineTypes = () => {
    const cuisines = [...new Set(restaurants.map(r => r.cuisine_type || r.cuisine))].filter(Boolean);
    return cuisines.sort();
  };

  const RestaurantCard = ({ restaurant }) => {
    // Get the restaurant name (try multiple field names for compatibility)
    const restaurantName = restaurant.restaurant_name || restaurant.name || 'Unknown Restaurant';
    
    // Get the logo/image URL (try multiple field names)
    const imageUrl = restaurant.logo_url || restaurant.image_url || '/api/placeholder/300/200';
    
    // Get cuisine type
    const cuisineType = restaurant.cuisine_type || restaurant.cuisine || 'Various';
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelectRestaurant(restaurant)}
      >
        <div className="relative">
          <img
            src={imageUrl}
            alt={restaurantName}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgODBIMTgwVjEyMEgxMjBWODBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LXNpemU9IjEyIj5JbWFnZTwvdGV4dD4KPC9zdmc+';
            }}
          />
          
          {/* Restaurant Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              restaurant.is_open 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {restaurant.is_open ? 'Open' : 'Closed'}
            </div>
          </div>

          {/* Rating Badge */}
          {restaurant.rating && (
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full shadow-sm">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm font-medium">{restaurant.rating}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Restaurant Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {restaurantName}
          </h3>
          
          {/* Cuisine Type */}
          <p className="text-sm text-gray-600 mb-2 capitalize">
            {cuisineType}
          </p>
          
          {/* Description */}
          {restaurant.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          {/* Delivery Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span>🕒</span>
                <span>{restaurant.delivery_time || '30-45 min'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🚚</span>
                <span>${restaurant.delivery_fee || '2.99'}</span>
              </div>
            </div>
          </div>

          {/* Min Order */}
          {restaurant.min_order && (
            <div className="text-xs text-gray-500">
              Min order: ${restaurant.min_order}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurants Near You</h2>
        <p className="text-gray-600">Discover amazing food from local restaurants</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search restaurants, food, or cuisine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Cuisine Filter */}
          <div>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Cuisines</option>
              {getCuisineTypes().map(cuisine => (
                <option key={cuisine} value={cuisine} className="capitalize">
                  {cuisine}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Sort by Rating</option>
              <option value="delivery_time">Sort by Delivery Time</option>
              <option value="delivery_fee">Sort by Delivery Fee</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOpenOnly}
              onChange={(e) => setShowOpenOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Open now only</span>
          </label>
          
          <div className="ml-4 text-sm text-gray-500">
            Showing {filteredRestaurants.length} of {restaurants.length} restaurants
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCuisine !== 'all' || showOpenOnly
              ? 'Try adjusting your filters to see more results'
              : 'No restaurants available at the moment'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantList;