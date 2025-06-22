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
    
    # Replace these methods in your RestaurantService class

    def get_restaurant_profile(self, restaurant_id: str) -> Optional[Dict[str, Any]]:
        """Get restaurant profile by ID, create if doesn't exist"""
        try:
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_doc = restaurant_ref.get()
            
            if restaurant_doc.exists:
                data = restaurant_doc.to_dict()
                data['id'] = restaurant_doc.id
                return data
            else:
                # Create default profile if doesn't exist
                return self._create_default_restaurant_profile(restaurant_id)
        except Exception as e:
            raise Exception(f"Error getting restaurant profile: {str(e)}")

    def _create_default_restaurant_profile(self, restaurant_id: str) -> Dict[str, Any]:
        """Create a default restaurant profile"""
        try:
            from services.role_service import role_service
            
            # Get user info from role service if available
            try:
                role_data = role_service.get_role_specific_data(restaurant_id)
                user_email = role_data.get('email', '') if role_data else ''
            except:
                user_email = ''
            
            default_profile = {
                'restaurant_name': 'My Restaurant',
                'description': 'Welcome to our restaurant!',
                'cuisine_type': '',
                'phone': '',
                'email': user_email,
                'address': '',
                'city': '',
                'state': '',
                'zip_code': '',
                'website': '',
                'is_open': True,
                'operating_hours': {
                    'monday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'tuesday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'wednesday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'thursday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'friday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'saturday': {'open': '09:00', 'close': '21:00', 'closed': False},
                    'sunday': {'open': '09:00', 'close': '21:00', 'closed': False}
                },
                'settings': {
                    'delivery_radius': 5.0,
                    'min_order_amount': 15.0,
                    'delivery_fee': 2.99,
                    'tax_rate': 8.25,
                    'prep_time': 30,
                    'is_delivery_available': True,
                    'is_pickup_available': True,
                    'auto_accept_orders': False
                },
                'stats': {
                    'total_orders': 0,
                    'total_revenue': 0.0,
                    'rating': 0.0,
                    'total_reviews': 0
                },
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'is_active': True
            }
            
            # Save to database
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_ref.set(default_profile)
            
            # Return with ID
            default_profile['id'] = restaurant_id
            return default_profile
            
        except Exception as e:
            raise Exception(f"Error creating default restaurant profile: {str(e)}")

    def update_restaurant_profile(self, restaurant_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update restaurant profile, create if doesn't exist"""
        try:
            restaurant_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            restaurant_doc = restaurant_ref.get()
            
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            if restaurant_doc.exists:
                # Update existing profile
                restaurant_ref.update(update_data)
            else:
                # Create new profile with update data
                default_profile = self._create_default_restaurant_profile(restaurant_id)
                # Merge update data with defaults
                merged_data = {**default_profile, **update_data}
                restaurant_ref.set(merged_data)
            
            # Return updated profile
            updated_doc = restaurant_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = restaurant_id
            
            return updated_data
            
        except Exception as e:
            raise Exception(f"Error updating restaurant profile: {str(e)}")

    def get_restaurant_settings(self, restaurant_id: str) -> Dict[str, Any]:
        """Get restaurant settings, create defaults if needed"""
        try:
            profile = self.get_restaurant_profile(restaurant_id)
            
            if not profile:
                profile = self._create_default_restaurant_profile(restaurant_id)
            
            # Return settings portion or defaults
            return profile.get('settings', {
                'delivery_radius': 5.0,
                'min_order_amount': 15.0,
                'delivery_fee': 2.99,
                'tax_rate': 8.25,
                'prep_time': 30,
                'is_delivery_available': True,
                'is_pickup_available': True,
                'auto_accept_orders': False
            })
            
        except Exception as e:
            raise Exception(f"Error getting restaurant settings: {str(e)}")

    def update_restaurant_settings(self, restaurant_id: str, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update restaurant settings"""
        try:
            # Ensure profile exists
            profile = self.get_restaurant_profile(restaurant_id)
            
            # Update settings within profile
            update_data = {
                'settings': settings_data,
                'updated_at': datetime.utcnow()
            }
            
            return self.update_restaurant_profile(restaurant_id, update_data)
            
        except Exception as e:
            raise Exception(f"Error updating restaurant settings: {str(e)}")

    # Also update the route handlers to use user ID correctly
    def get_restaurant_profile_by_user_id(self, user_id: str) -> Dict[str, Any]:
        """Get restaurant profile using user ID (for restaurant owners)"""
        try:
            # For restaurant users, their user_id IS their restaurant_id
            return self.get_restaurant_profile(user_id)
        except Exception as e:
            raise Exception(f"Error getting restaurant profile by user ID: {str(e)}")

    def update_restaurant_profile_by_user_id(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update restaurant profile using user ID"""
        try:
            # For restaurant users, their user_id IS their restaurant_id
            return self.update_restaurant_profile(user_id, update_data)
        except Exception as e:
            raise Exception(f"Error updating restaurant profile by user ID: {str(e)}")
    
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
    
    def upload_menu_item_image(self, uid: str, item_id: str, file) -> str:
        """Upload menu item image
        
        Args:
            uid: User ID (restaurant owner)
            item_id: Menu item ID
            file: Image file to upload
            
        Returns:
            str: Public URL of the uploaded image
        """
        try:
            from services.storage_service import storage_service
            
            # Verify the menu item exists and belongs to the user's restaurant
            item = self.get_menu_item_by_id(item_id)
            if not item:
                raise ValueError("Menu item not found")
                
            # Upload using storage service with the item_id in the path
            image_url = storage_service.upload_menu_item_image(file, f"{uid}_{item_id}")
            
            # Update the menu item with the new image URL
            self.update_menu_item(item_id, {'image_url': image_url})
            
            return image_url
        except Exception as e:
            raise Exception(f"Error uploading menu item image: {str(e)}")
    
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
        



            # ===== ORDER MANAGEMENT =====

    def get_restaurant_orders(self, restaurant_id: str, status: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get orders for restaurant with optional status filter (no index required)"""
        try:
            orders_ref = self.db.collection('orders')
            
            # Simple query without ordering to avoid index requirement
            if status:
                # Query with both restaurant_id and status
                query = orders_ref.where('restaurant_id', '==', restaurant_id).where('status', '==', status)
            else:
                # Query with just restaurant_id
                query = orders_ref.where('restaurant_id', '==', restaurant_id)
            
            # Get all matching orders (no ordering in Firestore)
            orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                
                # Ensure timestamps are properly formatted
                if 'created_at' in order_data and order_data['created_at']:
                    if hasattr(order_data['created_at'], 'isoformat'):
                        order_data['created_at'] = order_data['created_at'].isoformat()
                    elif hasattr(order_data['created_at'], 'strftime'):
                        order_data['created_at'] = order_data['created_at'].strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                
                if 'updated_at' in order_data and order_data['updated_at']:
                    if hasattr(order_data['updated_at'], 'isoformat'):
                        order_data['updated_at'] = order_data['updated_at'].isoformat()
                    elif hasattr(order_data['updated_at'], 'strftime'):
                        order_data['updated_at'] = order_data['updated_at'].strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                
                orders.append(order_data)
            
            # Sort in Python by created_at (newest first)
            orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Apply limit in Python
            return orders[:limit]
            
        except Exception as e:
            # If no orders exist, create mock orders for testing
            if "No document to update" in str(e) or not orders:
                return self._create_mock_orders_data(restaurant_id)[:limit]
            raise Exception(f"Error getting restaurant orders: {str(e)}")
    def update_order_status(self, restaurant_id: str, order_id: str, new_status: str) -> Dict[str, Any]:
        """Update order status"""
        try:
            # Validate status
            valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']
            if new_status not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
            
            # Get order and verify it belongs to restaurant
            order_ref = self.db.collection('orders').document(order_id)
            order_doc = order_ref.get()
            
            if not order_doc.exists:
                raise ValueError("Order not found")
            
            order_data = order_doc.to_dict()
            if order_data.get('restaurant_id') != restaurant_id:
                raise ValueError("Order does not belong to this restaurant")
            
            # Update status with timestamp
            update_data = {
                'status': new_status,
                'updated_at': datetime.utcnow(),
                f'{new_status}_at': datetime.utcnow()  # Track when status was set
            }
            
            order_ref.update(update_data)
            
            # Return updated order
            updated_doc = order_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = order_id
            
            # Format timestamps
            for key, value in updated_data.items():
                if key.endswith('_at') and hasattr(value, 'isoformat'):
                    updated_data[key] = value.isoformat()
            
            return updated_data
        except Exception as e:
            raise Exception(f"Error updating order status: {str(e)}")

    def get_restaurant_orders_by_status(self, restaurant_id: str, status: str) -> List[Dict[str, Any]]:
        """Get orders filtered by specific status"""
        return self.get_restaurant_orders(restaurant_id, status=status)

    def get_pending_orders(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get pending orders for restaurant"""
        return self.get_restaurant_orders(restaurant_id, status='pending')

    def get_active_orders(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get active orders (confirmed, preparing, ready)"""
        try:
            orders_ref = self.db.collection('orders')
            query = orders_ref.where('restaurant_id', '==', restaurant_id)
            query = query.where('status', 'in', ['confirmed', 'preparing', 'ready'])
            
            orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                
                # Format timestamps
                if 'created_at' in order_data and hasattr(order_data['created_at'], 'isoformat'):
                    order_data['created_at'] = order_data['created_at'].isoformat()
                
                orders.append(order_data)
            
            # Sort by created_at
            orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return orders
        except Exception as e:
            raise Exception(f"Error getting active orders: {str(e)}")

    def cancel_order(self, restaurant_id: str, order_id: str, reason: str = None) -> Dict[str, Any]:
        """Cancel an order"""
        try:
            # Get order and verify
            order_ref = self.db.collection('orders').document(order_id)
            order_doc = order_ref.get()
            
            if not order_doc.exists:
                raise ValueError("Order not found")
            
            order_data = order_doc.to_dict()
            if order_data.get('restaurant_id') != restaurant_id:
                raise ValueError("Order does not belong to this restaurant")
            
            # Check if order can be cancelled
            current_status = order_data.get('status')
            if current_status in ['delivered', 'cancelled']:
                raise ValueError(f"Cannot cancel order with status: {current_status}")
            
            # Update to cancelled
            update_data = {
                'status': 'cancelled',
                'cancelled_at': datetime.utcnow(),
                'cancellation_reason': reason or 'Cancelled by restaurant',
                'updated_at': datetime.utcnow()
            }
            
            order_ref.update(update_data)
            
            # Return updated order
            updated_doc = order_ref.get()
            updated_data = updated_doc.to_dict()
            updated_data['id'] = order_id
            
            return updated_data
        except Exception as e:
            raise Exception(f"Error cancelling order: {str(e)}")

    # ===== ORDER STATISTICS =====

    def get_order_stats(self, restaurant_id: str, period: str = 'today') -> Dict[str, Any]:
        """Get order statistics for different periods"""
        try:
            from datetime import datetime, timedelta
            
            # Calculate date range based on period
            now = datetime.utcnow()
            if period == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            else:
                start_date = now - timedelta(days=1)
            
            # Get orders in date range
            orders_ref = self.db.collection('orders')
            query = orders_ref.where('restaurant_id', '==', restaurant_id)
            query = query.where('created_at', '>=', start_date)
            
            orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                orders.append(order_data)
            
            # Calculate statistics
            total_orders = len(orders)
            completed_orders = len([o for o in orders if o.get('status') == 'delivered'])
            cancelled_orders = len([o for o in orders if o.get('status') == 'cancelled'])
            pending_orders = len([o for o in orders if o.get('status') == 'pending'])
            
            # Calculate revenue (completed orders only)
            total_revenue = sum([o.get('total', 0) for o in orders if o.get('status') == 'delivered'])
            
            # Calculate average order value
            avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0
            
            return {
                'period': period,
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'cancelled_orders': cancelled_orders,
                'pending_orders': pending_orders,
                'total_revenue': round(total_revenue, 2),
                'average_order_value': round(avg_order_value, 2),
                'completion_rate': round((completed_orders / total_orders * 100), 2) if total_orders > 0 else 0,
                'cancellation_rate': round((cancelled_orders / total_orders * 100), 2) if total_orders > 0 else 0
            }
        except Exception as e:
            raise Exception(f"Error getting order stats: {str(e)}")

# Create a singleton instance
restaurant_service = RestaurantService()