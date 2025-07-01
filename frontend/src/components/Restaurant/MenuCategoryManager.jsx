import React, { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantApi';

const MenuCategoryManager = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_available: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingCategory) {
        await restaurantService.updateCategory(editingCategory.id, formData);
      } else {
        await restaurantService.createCategory(formData);
      }
      
      await loadCategories();
      resetForm();
      alert(editingCategory ? 'Category updated successfully' : 'Category created successfully');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order || 0,
      is_available: category.is_available !== false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await restaurantService.deleteCategory(categoryId);
      await loadCategories();
      alert('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error.response?.data?.error?.includes('existing menu items')) {
        alert('Cannot delete category with existing menu items. Please remove all menu items first.');
      } else {
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sort_order: 0,
      is_available: true
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // Loading Screen matching the design system
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Categories</h2>
          <p className="text-gray-600">Getting your menu organization ready...</p>
        </div>
      </div>
    );
  }

  const CategoryCard = ({ category }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-102">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">Order: {category.sort_order || 0}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          category.is_available !== false
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {category.is_available !== false ? 'Available' : 'Hidden'}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {category.description || 'No description provided'}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 rounded-xl px-3 py-2">
            <span className="text-xs text-blue-600 font-medium">
              {category.items_count || 0} items
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Edit category"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDelete(category.id, category.name)}
            className={`p-2 rounded-xl transition-colors ${
              category.items_count > 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-red-600 hover:bg-red-50'
            }`}
            disabled={category.items_count > 0}
            title={category.items_count > 0 ? 'Cannot delete category with menu items' : 'Delete category'}
          >
            🗑️
          </button>
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
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📁</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Menu Categories
              </h1>
              <p className="text-gray-600 mt-1">Organize your menu items into categories</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              ➕ Add Category
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-xl">✏️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="e.g., Appetizers, Main Course"
                />
              </div>
              
              <div>
                <label htmlFor="sort_order" className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/70 backdrop-blur-sm resize-none"
                placeholder="Brief description of this category"
              />
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gray-50/80 rounded-2xl">
              <input
                type="checkbox"
                id="is_available"
                name="is_available"
                checked={formData.is_available}
                onChange={handleInputChange}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                Make this category available to customers
              </label>
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
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-orange-100 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl">📁</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No categories yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first menu category to start organizing your items. Categories help customers navigate your menu easily.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            ➕ Add First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {categories.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Category Overview</h3>
                <p className="text-sm text-gray-600">Your menu organization summary</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-xs text-gray-600 font-medium">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter(c => c.is_available !== false).length}
                </div>
                <div className="text-xs text-gray-600 font-medium">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {categories.reduce((sum, c) => sum + (c.items_count || 0), 0)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Menu Items</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategoryManager;