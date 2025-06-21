from firebase_admin import firestore
from config.firebase import get_db
from typing import Optional, Dict, List, Any
from datetime import datetime

class RestaurantService:
    def __init__(self):
        self.db = get_db()
        self.restaurants_collection = 'restaurants'
        self.categories_collection = 'menu_categories'
        self.menu_items_collection = 'menu_items'
    
    def get_restaurant_profile(self, restaurant_id: str) -> Optional[Dict[str, Any]]:
        """Get restaurant profile by ID"""
        try:
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_doc = restaurant_ref.get()
            
            if restaurant_doc.exists:
                data = restaurant_doc.to_dict()
                data['id'] = restaurant_doc.id
                return data
            return None
        except Exception as e:
            raise Exception(f"Error getting restaurant profile: {str(e)}")
    
    def create_restaurant_profile(self, restaurant_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create restaurant profile"""
        try:
            # Default restaurant profile structure
            default_profile = {
                'basic_info': {
                    'name': '',
                    'cuisine_type': '',
                    'description': '',
                    'address': '',
                    'phone': '',
                    'email': ''
                },
                'settings': {
                    'operating_hours': {
                        'monday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'tuesday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'wednesday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'thursday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'friday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'saturday': {'open': '09:00', 'close': '21:00', 'closed': False},
                        'sunday': {'open': '09:00', 'close': '21:00', 'closed': False}
                    },
                    'delivery_zones': [],
                    'min_order_amount': 0,
                    'delivery_fee': 0,
                    'avg_prep_time': 30,
                    'is_accepting_orders': True
                },
                'stats': {
                    'total_orders': 0,
                    'total_revenue': 0,
                    'rating': 0.0,
                    'total_reviews': 0
                },
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_active': True
            }
            
            # Merge with provided data
            for key, value in profile_data.items():
                if key in default_profile:
                    if isinstance(default_profile[key], dict) and isinstance(value, dict):
                        default_profile[key].update(value)
                    else:
                        default_profile[key] = value
            
            # Save to database
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_ref.set(default_profile)
            
            default_profile['id'] = restaurant_id
            return default_profile
        except Exception as e:
            raise Exception(f"Error creating restaurant profile: {str(e)}")
    
    def update_restaurant_profile(self, restaurant_id: str, update_data: Dict[str, Any]) -> bool:
        """Update restaurant profile"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_ref.update(update_data)
            
            return True
        except Exception as e:
            raise Exception(f"Error updating restaurant profile: {str(e)}")
    
    def get_restaurant_stats(self, restaurant_id: str) -> Dict[str, Any]:
        """Get restaurant statistics"""
        try:
            # Get basic stats from restaurant profile
            restaurant = self.get_restaurant_profile(restaurant_id)
            if not restaurant:
                return {}
            
            stats = restaurant.get('stats', {})
            
            # TODO: Add real-time calculations from orders
            # For now, return stored stats
            return {
                'total_orders': stats.get('total_orders', 0),
                'total_revenue': stats.get('total_revenue', 0),
                'rating': stats.get('rating', 0.0),
                'total_reviews': stats.get('total_reviews', 0),
                'today_orders': 0,  # Will be calculated from orders
                'today_revenue': 0,  # Will be calculated from orders
                'pending_orders': 0  # Will be calculated from orders
            }
        except Exception as e:
            raise Exception(f"Error getting restaurant stats: {str(e)}")
    
    def update_restaurant_settings(self, restaurant_id: str, settings: Dict[str, Any]) -> bool:
        """Update restaurant settings"""
        try:
            update_data = {
                'settings': settings,
                'updated_at': datetime.utcnow()
            }
            
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_ref.update(update_data)
            
            return True
        except Exception as e:
            raise Exception(f"Error updating restaurant settings: {str(e)}")
    
    def get_restaurant_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get restaurant profile by user ID (for role-based access)"""
        try:
            # Check if user has restaurant role data
            from services.role_service import role_service
            role_data = role_service.get_role_specific_data(user_id)
            
            if role_data and role_data.get('role') == 'restaurant':
                restaurant_id = role_data.get('restaurant_id')
                if restaurant_id:
                    return self.get_restaurant_profile(restaurant_id)
                else:
                    # Create restaurant profile if doesn't exist
                    restaurant_id = user_id  # Use user_id as restaurant_id
                    profile_data = {
                        'basic_info': {
                            'name': role_data.get('restaurant_name', 'My Restaurant'),
                            'email': role_data.get('email', ''),
                            'phone': role_data.get('phone', '')
                        }
                    }
                    
                    # Update role data with restaurant_id
                    role_service.update_role_specific_data(user_id, {
                        'restaurant_id': restaurant_id
                    })
                    
                    return self.create_restaurant_profile(restaurant_id, profile_data)
            
            return None
        except Exception as e:
            raise Exception(f"Error getting restaurant by user ID: {str(e)}")
    
    def validate_restaurant_access(self, user_id: str, restaurant_id: str) -> bool:
        """Check if user has access to this restaurant"""
        try:
            from services.role_service import role_service
            user_role = role_service.get_user_role(user_id)
            
            # Admin can access any restaurant
            if user_role and user_role.value == 'admin':
                return True
            
            # Restaurant user can only access their own restaurant
            if user_role and user_role.value == 'restaurant':
                role_data = role_service.get_role_specific_data(user_id)
                if role_data:
                    return role_data.get('restaurant_id') == restaurant_id
            
            return False
        except Exception as e:
            raise Exception(f"Error validating restaurant access: {str(e)}")
    
    # Add these methods to your existing RestaurantService class

    # ===== MENU CATEGORY MANAGEMENT =====
    
    def get_menu_categories(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get all menu categories for restaurant"""
        try:
            categories_ref = self.db.collection(self.categories_collection)
            query = categories_ref.where('restaurant_id', '==', restaurant_id).order_by('sort_order')
            
            categories = []
            for doc in query.stream():
                category_data = doc.to_dict()
                category_data['id'] = doc.id
                categories.append(category_data)
            
            return categories
        except Exception as e:
            # If ordering fails, try without ordering
            try:
                categories_ref = self.db.collection(self.categories_collection)
                query = categories_ref.where('restaurant_id', '==', restaurant_id)
                
                categories = []
                for doc in query.stream():
                    category_data = doc.to_dict()
                    category_data['id'] = doc.id
                    categories.append(category_data)
                
                # Sort in Python
                categories.sort(key=lambda x: x.get('sort_order', 0))
                return categories
            except Exception as e:
                raise Exception(f"Error getting menu categories: {str(e)}")
    
    def create_menu_category(self, restaurant_id: str, category_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new menu category"""
        try:
            # Validate required fields
            if not category_data.get('name', '').strip():
                raise ValueError("Category name is required")
            
            # Get current max sort order
            categories = self.get_menu_categories(restaurant_id)
            max_sort_order = max([cat.get('sort_order', 0) for cat in categories], default=0)
            
            new_category = {
                'restaurant_id': restaurant_id,
                'name': category_data['name'].strip(),
                'description': category_data.get('description', ''),
                'sort_order': category_data.get('sort_order', max_sort_order + 1),
                'is_active': category_data.get('is_active', True),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            doc_ref = self.db.collection(self.categories_collection).add(new_category)
            category_id = doc_ref[1].id
            
            new_category['id'] = category_id
            return new_category
        except Exception as e:
            raise Exception(f"Error creating menu category: {str(e)}")
    
    def update_menu_category(self, category_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update menu category"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            category_ref = self.db.collection(self.categories_collection).document(category_id)
            category_ref.update(update_data)
            
            # Return updated category
            updated_doc = category_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = category_id
            return updated_data
        except Exception as e:
            raise Exception(f"Error updating menu category: {str(e)}")
    
    def delete_menu_category(self, category_id: str) -> bool:
        """Delete menu category"""
        try:
            # Check if category has menu items
            items_query = self.db.collection(self.menu_items_collection).where('category_id', '==', category_id)
            items = list(items_query.stream())
            
            if items:
                raise ValueError("Cannot delete category with existing menu items")
            
            # Delete category
            category_ref = self.db.collection(self.categories_collection).document(category_id)
            category_ref.delete()
            
            return True
        except Exception as e:
            raise Exception(f"Error deleting menu category: {str(e)}")
    
    # ===== MENU ITEM MANAGEMENT =====
    
    def get_menu_items(self, restaurant_id: str, category_id: str = None) -> List[Dict[str, Any]]:
        """Get menu items for restaurant, optionally filtered by category"""
        try:
            items_ref = self.db.collection(self.menu_items_collection)
            query = items_ref.where('restaurant_id', '==', restaurant_id)
            
            if category_id:
                query = query.where('category_id', '==', category_id)
            
            menu_items = []
            for doc in query.stream():
                item_data = doc.to_dict()
                item_data['id'] = doc.id
                menu_items.append(item_data)
            
            # Sort by category and sort order
            menu_items.sort(key=lambda x: (x.get('category_id', ''), x.get('sort_order', 0)))
            return menu_items
        except Exception as e:
            raise Exception(f"Error getting menu items: {str(e)}")
    
    def create_menu_item(self, restaurant_id: str, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new menu item"""
        try:
            # Validate required fields
            required_fields = ['name', 'price', 'category_id']
            for field in required_fields:
                if not item_data.get(field):
                    raise ValueError(f"{field} is required")
            
            # Verify category exists and belongs to restaurant
            category_id = item_data['category_id']
            category_ref = self.db.collection(self.categories_collection).document(category_id)
            category_doc = category_ref.get()
            
            if not category_doc.exists:
                raise ValueError("Category not found")
            
            category_data = category_doc.to_dict()
            if category_data.get('restaurant_id') != restaurant_id:
                raise ValueError("Category does not belong to this restaurant")
            
            # Get current max sort order for category
            category_items = self.get_menu_items(restaurant_id, category_id)
            max_sort_order = max([item.get('sort_order', 0) for item in category_items], default=0)
            
            new_item = {
                'restaurant_id': restaurant_id,
                'category_id': category_id,
                'name': item_data['name'].strip(),
                'description': item_data.get('description', ''),
                'price': float(item_data['price']),
                'image_url': item_data.get('image_url', ''),
                'ingredients': item_data.get('ingredients', []),
                'allergens': item_data.get('allergens', []),
                'is_vegetarian': item_data.get('is_vegetarian', False),
                'is_vegan': item_data.get('is_vegan', False),
                'is_available': item_data.get('is_available', True),
                'prep_time': item_data.get('prep_time', 15),
                'sort_order': item_data.get('sort_order', max_sort_order + 1),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            doc_ref = self.db.collection(self.menu_items_collection).add(new_item)
            item_id = doc_ref[1].id
            
            new_item['id'] = item_id
            return new_item
        except Exception as e:
            raise Exception(f"Error creating menu item: {str(e)}")
    
    def update_menu_item(self, item_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update menu item"""
        try:
            # Convert price to float if provided
            if 'price' in update_data:
                update_data['price'] = float(update_data['price'])
            
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            item_ref = self.db.collection(self.menu_items_collection).document(item_id)
            item_ref.update(update_data)
            
            # Return updated item
            updated_doc = item_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = item_id
            return updated_data
        except Exception as e:
            raise Exception(f"Error updating menu item: {str(e)}")
    
    def delete_menu_item(self, item_id: str) -> bool:
        """Delete menu item"""
        try:
            item_ref = self.db.collection(self.menu_items_collection).document(item_id)
            item_ref.delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting menu item: {str(e)}")
    
    def toggle_menu_item_availability(self, item_id: str) -> Dict[str, Any]:
        """Toggle menu item availability"""
        try:
            item_ref = self.db.collection(self.menu_items_collection).document(item_id)
            item_doc = item_ref.get()
            
            if not item_doc.exists:
                raise ValueError("Menu item not found")
            
            item_data = item_doc.to_dict()
            current_availability = item_data.get('is_available', True)
            
            item_ref.update({
                'is_available': not current_availability,
                'updated_at': datetime.utcnow()
            })
            
            # Return updated item
            updated_doc = item_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = item_id
            return updated_data
        except Exception as e:
            raise Exception(f"Error toggling menu item availability: {str(e)}")
    
    # ===== IMAGE UPLOAD =====
    
    def upload_menu_item_image(self, restaurant_id: str, file) -> str:
        """Upload menu item image"""
        try:
            import uuid
            from services.storage_service import storage_service
            
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
            filename = f"menu_items/{restaurant_id}/{uuid.uuid4()}.{file_extension}"
            
            # Upload using storage service
            image_url = storage_service.upload_avatar(file, f"menu_items_{restaurant_id}")
            
            return image_url
        except Exception as e:
            raise Exception(f"Error uploading menu item image: {str(e)}")
    
    # ===== HELPER METHODS =====
    
    def get_menu_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get menu item by ID"""
        try:
            item_ref = self.db.collection(self.menu_items_collection).document(item_id)
            item_doc = item_ref.get()
            
            if item_doc.exists:
                item_data = item_doc.to_dict()
                item_data['id'] = item_id
                return item_data
            return None
        except Exception as e:
            raise Exception(f"Error getting menu item: {str(e)}")
    
    def get_category_by_id(self, category_id: str) -> Optional[Dict[str, Any]]:
        """Get category by ID"""
        try:
            category_ref = self.db.collection(self.categories_collection).document(category_id)
            category_doc = category_ref.get()
            
            if category_doc.exists:
                category_data = category_doc.to_dict()
                category_data['id'] = category_id
                return category_data
            return None
        except Exception as e:
            raise Exception(f"Error getting category: {str(e)}")
    
    def search_menu_items(self, restaurant_id: str, search_term: str) -> List[Dict[str, Any]]:
        """Search menu items by name or description"""
        try:
            all_items = self.get_menu_items(restaurant_id)
            search_term = search_term.lower().strip()
            
            filtered_items = []
            for item in all_items:
                name_match = search_term in item.get('name', '').lower()
                desc_match = search_term in item.get('description', '').lower()
                
                if name_match or desc_match:
                    filtered_items.append(item)
            
            return filtered_items
        except Exception as e:
            raise Exception(f"Error searching menu items: {str(e)}")
    
    def get_restaurant_menu_summary(self, restaurant_id: str) -> Dict[str, Any]:
        """Get summary of restaurant's menu"""
        try:
            categories = self.get_menu_categories(restaurant_id)
            all_items = self.get_menu_items(restaurant_id)
            
            # Calculate summary stats
            total_items = len(all_items)
            available_items = len([item for item in all_items if item.get('is_available', True)])
            vegetarian_items = len([item for item in all_items if item.get('is_vegetarian', False)])
            vegan_items = len([item for item in all_items if item.get('is_vegan', False)])
            
            # Price range
            prices = [item.get('price', 0) for item in all_items if item.get('price')]
            min_price = min(prices) if prices else 0
            max_price = max(prices) if prices else 0
            avg_price = sum(prices) / len(prices) if prices else 0
            
            # Categories with item counts
            categories_with_counts = []
            for category in categories:
                category_items = [item for item in all_items if item.get('category_id') == category['id']]
                category['item_count'] = len(category_items)
                category['available_items'] = len([item for item in category_items if item.get('is_available', True)])
                categories_with_counts.append(category)
            
            return {
                'total_categories': len(categories),
                'total_items': total_items,
                'available_items': available_items,
                'vegetarian_items': vegetarian_items,
                'vegan_items': vegan_items,
                'price_range': {
                    'min': min_price,
                    'max': max_price,
                    'average': round(avg_price, 2)
                },
                'categories': categories_with_counts
            }
        except Exception as e:
            raise Exception(f"Error getting menu summary: {str(e)}")
    
    def update_restaurant_stats_from_menu(self, restaurant_id: str) -> bool:
        """Update restaurant stats based on current menu"""
        try:
            menu_summary = self.get_restaurant_menu_summary(restaurant_id)
            
            # Update restaurant profile with menu stats
            update_data = {
                'menu_stats': {
                    'total_categories': menu_summary['total_categories'],
                    'total_items': menu_summary['total_items'],
                    'available_items': menu_summary['available_items'],
                    'price_range': menu_summary['price_range']
                },
                'updated_at': datetime.utcnow()
            }
            
            return self.update_restaurant_profile(restaurant_id, update_data)
        except Exception as e:
            raise Exception(f"Error updating restaurant stats: {str(e)}")

# Create a singleton instance
restaurant_service = RestaurantService()