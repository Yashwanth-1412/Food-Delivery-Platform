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
  const [uploading, setUploading] = useState(false);

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
      
      // Set default category for form
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

  const uploadImage = async (itemId) => {
    if (!selectedFile) return null;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/restaurants/menu/items/${itemId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      return data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
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
      
      // First create/update the menu item
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        prep_time: parseInt(formData.prep_time) || null,
        allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a)
      };
      
      let itemId;
      let response;
      if (editingItem) {
        response = await restaurantService.updateMenuItem(editingItem.id, submitData);
        itemId = editingItem.id;
      } else {
        response = await restaurantService.createMenuItem(submitData);
        itemId = response.data.id;
      }
      
      // Then upload the image if a file was selected
      if (selectedFile) {
        try {
          const imageUrl = await uploadImage(itemId);
          if (imageUrl) {
            // Update the menu item with the new image URL
            await restaurantService.updateMenuItem(itemId, { image_url: imageUrl });
          }
        } catch (error) {
          console.error('Image upload failed, but menu item was saved:', error);
          // Continue even if image upload fails
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
    setSelectedFile(null); // Reset selected file when editing
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

  /*const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImage = async (itemId) => {
    if (!selectedFile) return null;*/
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/restaurants/menu/items/${itemId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      return data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
          <p className="text-gray-600">Manage your restaurant's menu items</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            + Add Menu Item
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  name="prep_time"
                  value={formData.prep_time}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your menu item..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergens
                </label>
                <input
                  type="text"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., nuts, dairy, gluten"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple allergens with commas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Image
                </label>
                <div className="mt-1 flex items-center">
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Choose File
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <span className="ml-2 text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                </div>
                {formData.image_url && !selectedFile && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Current image:</p>
                    <img 
                      src={formData.image_url} 
                      alt={formData.name}
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </div>
                )}
                {selectedFile && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">New image preview:</p>
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Available</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_vegetarian"
                  checked={formData.is_vegetarian}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Vegetarian</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_vegan"
                  checked={formData.is_vegan}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Vegan</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_spicy"
                  checked={formData.is_spicy}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Spicy</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium transition-colors"
              >
                {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      {categories.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">
            You need to create menu categories before adding menu items.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No items found' : 'No menu items yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first menu item to get started.'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Add First Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <span className="text-lg font-bold text-green-600">${item.price?.toFixed(2)}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{getCategoryName(item.category_id)}</p>
                
                {item.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{item.description}</p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.is_vegetarian && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🌱 Vegetarian</span>
                  )}
                  {item.is_vegan && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🌿 Vegan</span>
                  )}
                  {item.is_spicy && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">🌶️ Spicy</span>
                  )}
                  {item.prep_time && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">⏱️ {item.prep_time}min</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.is_available !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        item.is_available !== false
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      } transition-colors`}
                    >
                      {item.is_available !== false ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              Showing <strong>{filteredItems.length}</strong> of <strong>{menuItems.length}</strong> menu items
              {selectedCategory !== 'all' && ` in ${getCategoryName(selectedCategory)}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemManager;