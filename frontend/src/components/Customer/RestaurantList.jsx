// frontend/src/components/Customer/RestaurantList.jsx
import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerApi';

const RestaurantList = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadRestaurants();
  }, []);

useEffect(() => {
    filterAndSortRestaurants();
}, [restaurants, searchTerm, selectedCuisine, showOpenOnly, sortBy]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend first
      try {
        const response = await customerService.getAvailableRestaurants();
        if (response.success && response.data) {
          setRestaurants(response.data);
        } else {
          throw new Error('Backend data not available');
        }
      } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
    } 
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRestaurants = () => {
    let filtered = [...restaurants];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by cuisine
    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(restaurant => restaurant.cuisine === selectedCuisine);
    }

    // Filter by open status
    if (showOpenOnly) {
      filtered = filtered.filter(restaurant => restaurant.is_open);
    }

    // Sort restaurants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'delivery_time': {
          const aTime = parseInt(a.delivery_time) || 999;
          const bTime = parseInt(b.delivery_time) || 999;
          return aTime - bTime;
        }
        case 'delivery_fee':
          return (a.delivery_fee || 999) - (b.delivery_fee || 999);
        case 'name':
          return a.name.localeCompare(b.name);
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

  const RestaurantCard = ({ restaurant }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelectRestaurant(restaurant)}
    >
      <div className="relative">
        <img
          src={restaurant.image_url || '/api/placeholder/300/200'}
          alt={restaurant.name}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgODBIMTgwVjEyMEgxMjBWODBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LXNpemU9IjEyIj5JbWFnZTwvdGV4dD4KPC9zdmc+';
          }}
        />
        {!restaurant.is_open && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
            <span className="text-white font-semibold">Closed</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-medium">
          ⭐ {restaurant.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="bg-gray-100 px-2 py-1 rounded-full">{restaurant.cuisine}</span>
          <span>🕒 {restaurant.delivery_time}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span>Delivery: ${restaurant.delivery_fee?.toFixed(2) || '0.00'}</span>
            <span className="mx-2">•</span>
            <span>Min: ${restaurant.min_order?.toFixed(2) || '0.00'}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            restaurant.is_open 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {restaurant.is_open ? 'Open' : 'Closed'}
          </div>
        </div>
      </div>
    </div>
  );

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
                <option key={cuisine} value={cuisine}>{cuisine}</option>
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
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOpenOnly}
              onChange={(e) => setShowOpenOnly(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Open now only</span>
          </label>
          
          <div className="text-sm text-gray-500">
            Showing {filteredRestaurants.length} of {restaurants.length} restaurants
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCuisine !== 'all' || showOpenOnly
              ? 'Try adjusting your filters to see more results.'
              : 'No restaurants are available in your area right now.'}
          </p>
          {(searchTerm || selectedCuisine !== 'all' || showOpenOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCuisine('all');
                setShowOpenOnly(false);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      {/* Quick Filters */}
      {restaurants.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Cuisines</h3>
          <div className="flex flex-wrap gap-2">
            {getCuisineTypes().slice(0, 6).map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCuisine === cuisine
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
            {selectedCuisine !== 'all' && (
              <button
                onClick={() => setSelectedCuisine('all')}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;