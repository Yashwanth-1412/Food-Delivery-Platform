import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';

const MenuItemManager = ({ onClose }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    prep_time: '',
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    allergens: '',
    image_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, categoriesResponse] = await Promise.all([
        restaurantService.getMenuItems(),
        restaurantService.getCategories()
      ]);
      
      setMenuItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      
      if (categoriesResponse.data?.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoriesResponse.data[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load menu data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Menu item name is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Valid price is required');
      return;
    }
    
    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        prep_time: parseInt(formData.prep_time) || null,
        allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a)
      };
      
      let itemId;
      if (editingItem) {
        await restaurantService.updateMenuItem(editingItem.id, submitData);
        itemId = editingItem.id;
      } else {
        const response = await restaurantService.createMenuItem(submitData);
        itemId = response.data.id;
      }
      
      if (selectedFile) {
        try {
          const imageResponse = await restaurantService.uploadMenuItemImage(itemId, selectedFile);
          if (imageResponse.success && imageResponse.image_url) {
            await restaurantService.updateMenuItem(itemId, { image_url: imageResponse.image_url });
          }
        } catch (error) {
          console.error('Image upload failed, but menu item was saved:', error);
          alert('Menu item saved but image upload failed. You can edit the item to upload an image later.');
        }
      }
      
      await loadData();
      resetForm();
      alert(editingItem ? 'Menu item updated successfully' : 'Menu item created successfully');
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item. ' + (error.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
      setSelectedFile(null);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category_id: item.category_id || '',
      prep_time: item.prep_time?.toString() || '',
      is_available: item.is_available !== false,
      is_vegetarian: item.is_vegetarian || false,
      is_vegan: item.is_vegan || false,
      is_spicy: item.is_spicy || false,
      allergens: item.allergens?.join(', ') || '',
      image_url: item.image_url || ''
    });
    setSelectedFile(null);
    setEditingItem(item);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await restaurantService.deleteMenuItem(itemId);
      await loadData();
      alert('Menu item deleted successfully');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item. Please try again.');
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await restaurantService.toggleMenuItemAvailability(itemId);
      await loadData();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update item availability. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      prep_time: '',
      is_available: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      allergens: '',
      image_url: ''
    });
    setSelectedFile(null);
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Menu Items</h2>
          <p className="text-gray-600">Preparing your delicious menu...</p>
        </div>
      </div>
    );
  }

  const MenuItemCard = ({ item }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-102">
      {/* Item Image */}
      {item.image_url && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.name}
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2">{item.name}</h3>
          <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-xl">
            ${item.price?.toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {getCategoryName(item.category_id)}
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            item.is_available !== false
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {item.is_available !== false ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {item.is_vegetarian && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              🌱 Vegetarian
            </span>
          )}
          {item.is_vegan && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              🌿 Vegan
            </span>
          )}
          {item.is_spicy && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              🌶️ Spicy
            </span>
          )}
          {item.prep_time && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              ⏱️ {item.prep_time}min
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => handleToggleAvailability(item.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 ${
              item.is_available !== false
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {item.is_available !== false ? 'Hide' : 'Show'}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(item)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="Edit item"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(item.id, item.name)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete item"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🍽️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Menu Items
              </h1>
              <p className="text-gray-600 mt-1">Manage your restaurant's delicious menu items</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ➕ Add Menu Item
            </button>
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
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-orange-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-xl">✏️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  name="prep_time"
                  value={formData.prep_time}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="15"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm resize-none"
                placeholder="Describe your delicious menu item..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Allergens
                </label>
                <input
                  type="text"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="e.g., nuts, dairy, gluten"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Separate multiple allergens with commas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Image
                </label>
                <div className="mt-1 flex items-center">
                  <label className="cursor-pointer bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 py-3 px-4 border border-gray-300 rounded-2xl shadow-sm text-sm font-medium text-gray-700 transition-all duration-300 hover:scale-105">
                    📷 Choose File
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <span className="ml-3 text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                </div>
                
                {formData.image_url && !selectedFile && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Current image:</p>
                    <img 
                      src={formData.image_url} 
                      alt={formData.name}
                      className="h-20 w-20 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                )}
                
                {selectedFile && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">New image preview:</p>
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Available</label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                <input
                  type="checkbox"
                  name="is_vegetarian"
                  checked={formData.is_vegetarian}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Vegetarian</label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                <input
                  type="checkbox"
                  name="is_vegan"
                  checked={formData.is_vegan}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Vegan</label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-2xl">
                <input
                  type="checkbox"
                  name="is_spicy"
                  checked={formData.is_spicy}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Spicy</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {categories.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-orange-100 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl">📂</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No categories found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need to create menu categories before adding menu items. Categories help organize your delicious offerings.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-orange-100 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl">🍽️</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {searchTerm || selectedCategory !== 'all' ? 'No items found' : 'No menu items yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
              : 'Create your first delicious menu item to get started and attract hungry customers.'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ➕ Add First Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredItems.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Menu Overview</h3>
                <p className="text-sm text-gray-600">Your delicious offerings summary</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{filteredItems.length}</div>
                <div className="text-xs text-gray-600 font-medium">
                  {searchTerm || selectedCategory !== 'all' ? 'Filtered Items' : 'Total Items'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredItems.filter(item => item.is_available !== false).length}
                </div>
                <div className="text-xs text-gray-600 font-medium">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  ${filteredItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Value</div>
              </div>
              {selectedCategory !== 'all' && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getCategoryName(selectedCategory)}</div>
                  <div className="text-xs text-gray-600 font-medium">Category</div>
                </div>
              )}
              {searchTerm && (
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600 truncate max-w-24">"{searchTerm}"</div>
                  <div className="text-xs text-gray-600 font-medium">Search Term</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemManager;