# backend/services/customer_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import uuid
from firebase_admin import firestore

class CustomerService:
    def __init__(self):
        self.db = firestore.client()
        self.customers_collection = 'customers'
        self.orders_collection = 'orders'
        self.restaurants_collection = 'restaurants'
        self.addresses_collection = 'customer_addresses'
        self.favorites_collection = 'customer_favorites'

    # ===== RESTAURANT DISCOVERY =====
    
    def get_available_restaurants(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get list of available restaurants with optional filters"""
        try:
            restaurants_ref = self.db.collection(self.restaurants_collection)
            
            # Start with base query
            query = restaurants_ref
            
            # Apply filters
            if filters:
                if filters.get('is_open') is not None:
                    query = query.where('is_open', '==', filters['is_open'])
                
                if filters.get('cuisine'):
                    query = query.where('cuisine', '==', filters['cuisine'])
            
            restaurants = []
            for doc in query.stream():
                restaurant_data = doc.to_dict()
                restaurant_data['id'] = doc.id
                
                # Apply post-query filters
                if filters:
                    # Search filter
                    if filters.get('search'):
                        search_term = filters['search'].lower()
                        name_match = search_term in restaurant_data.get('name', '').lower()
                        desc_match = search_term in restaurant_data.get('description', '').lower()
                        cuisine_match = search_term in restaurant_data.get('cuisine', '').lower()
                        
                        if not (name_match or desc_match or cuisine_match):
                            continue
                    
                    # Rating filter
                    if filters.get('min_rating'):
                        if restaurant_data.get('rating', 0) < filters['min_rating']:
                            continue
                
                # Ensure required fields exist
                restaurant_data.setdefault('rating', 0.0)
                restaurant_data.setdefault('delivery_time', '30-45 min')
                restaurant_data.setdefault('delivery_fee', 2.99)
                restaurant_data.setdefault('min_order', 15.00)
                restaurant_data.setdefault('is_open', True)
                
                restaurants.append(restaurant_data)
            
            return restaurants
        except Exception as e:
            raise Exception(f"Error getting available restaurants: {str(e)}")
    
    def get_restaurant_details(self, restaurant_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific restaurant"""
        try:
            doc_ref = self.db.collection(self.restaurants_collection).document(restaurant_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise ValueError("Restaurant not found")
            
            restaurant_data = doc.to_dict()
            restaurant_data['id'] = doc.id
            
            return restaurant_data
        except Exception as e:
            raise Exception(f"Error getting restaurant details: {str(e)}")
    
    def get_restaurant_menu(self, restaurant_id: str) -> Dict[str, Any]:
        """Get restaurant menu for customers"""
        try:
            # Get restaurant info
            restaurant = self.get_restaurant_details(restaurant_id)
            
            # Get menu categories
            categories_ref = self.db.collection('menu_categories')
            query = categories_ref.where('restaurant_id', '==', restaurant_id).where('is_active', '==', True)
            
            categories = []
            for doc in query.stream():
                category_data = doc.to_dict()
                category_data['id'] = doc.id
                
                # Get menu items for this category
                items_ref = self.db.collection('menu_items')
                items_query = items_ref.where('restaurant_id', '==', restaurant_id).where('category_id', '==', doc.id).where('is_available', '==', True)
                
                items = []
                for item_doc in items_query.stream():
                    item_data = item_doc.to_dict()
                    item_data['id'] = item_doc.id
                    items.append(item_data)
                
                # Sort items by name
                items.sort(key=lambda x: x.get('name', ''))
                category_data['items'] = items
                categories.append(category_data)
            
            # Sort categories by sort_order
            categories.sort(key=lambda x: x.get('sort_order', 0))
            
            return {
                'restaurant': restaurant,
                'categories': categories
            }
        except Exception as e:
            raise Exception(f"Error getting restaurant menu: {str(e)}")

    # ===== ORDER MANAGEMENT =====
    
    def create_order(self, customer_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order"""
        try:
            # Validate restaurant exists and is open
            restaurant = self.get_restaurant_details(order_data['restaurant_id'])
            if not restaurant.get('is_open', False):
                raise ValueError("Restaurant is currently closed")
            
            # Validate minimum order amount
            min_order = restaurant.get('min_order', 0)
            subtotal = order_data.get('subtotal', 0)
            if subtotal < min_order:
                raise ValueError(f"Minimum order amount is ${min_order}")
            
            # Generate order number
            order_number = f"ORD-{int(datetime.now().timestamp())}"
            
            # Create order document
            order_doc = {
                'order_number': order_number,
                'customer_id': customer_id,
                'restaurant_id': order_data['restaurant_id'],
                'restaurant_name': restaurant.get('name', ''),
                'items': order_data['items'],
                'subtotal': order_data.get('subtotal', 0),
                'delivery_fee': order_data.get('delivery_fee', 0),
                'tax': order_data.get('tax', 0),
                'total': order_data['total'],
                'status': 'pending',
                'delivery_address': order_data['delivery_address'],
                'special_instructions': order_data.get('special_instructions', ''),
                'payment_method': order_data.get('payment_method', 'cash'),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Save to database
            doc_ref = self.db.collection(self.orders_collection).add(order_doc)
            order_id = doc_ref[1].id
            
            order_doc['id'] = order_id
            return order_doc
        except Exception as e:
            raise Exception(f"Error creating order: {str(e)}")
    
    def get_customer_orders(self, customer_id: str, status: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get customer's order history"""
        try:
            orders_ref = self.db.collection(self.orders_collection)
            query = orders_ref.where('customer_id', '==', customer_id)
            
            if status:
                query = query.where('status', '==', status)
            
            # Get orders (limit applied in Python since we can't order by created_at without index)
            orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                orders.append(order_data)
            
            # Sort by created_at in Python
            orders.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
            
            # Apply limit
            return orders[:limit]
        except Exception as e:
            raise Exception(f"Error getting customer orders: {str(e)}")
    
    def get_order_details(self, customer_id: str, order_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific order"""
        try:
            doc_ref = self.db.collection(self.orders_collection).document(order_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise ValueError("Order not found")
            
            order_data = doc.to_dict()
            
            # Verify order belongs to customer
            if order_data.get('customer_id') != customer_id:
                raise ValueError("Order not found")
            
            order_data['id'] = doc.id
            return order_data
        except Exception as e:
            raise Exception(f"Error getting order details: {str(e)}")
    
    def cancel_order(self, customer_id: str, order_id: str) -> Dict[str, Any]:
        """Cancel an order"""
        try:
            # Get order details
            order = self.get_order_details(customer_id, order_id)
            
            # Check if order can be cancelled
            if order['status'] not in ['pending', 'confirmed']:
                raise ValueError("Order cannot be cancelled at this stage")
            
            # Update order status
            doc_ref = self.db.collection(self.orders_collection).document(order_id)
            doc_ref.update({
                'status': 'cancelled',
                'cancelled_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            })
            
            order['status'] = 'cancelled'
            order['cancelled_at'] = datetime.utcnow()
            
            return order
        except Exception as e:
            raise Exception(f"Error cancelling order: {str(e)}")

    # ===== CUSTOMER PROFILE =====
    
    def get_customer_profile(self, customer_id: str) -> Dict[str, Any]:
        """Get customer profile"""
        try:
            doc_ref = self.db.collection(self.customers_collection).document(customer_id)
            doc = doc_ref.get()
            
            if doc.exists:
                profile_data = doc.to_dict()
            else:
                # Create default profile if doesn't exist
                profile_data = {
                    'name': '',
                    'email': '',
                    'phone': '',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                doc_ref.set(profile_data)
            
            profile_data['id'] = customer_id
            
            # Get delivery addresses
            addresses = self.get_delivery_addresses(customer_id)
            profile_data['addresses'] = addresses
            
            return profile_data
        except Exception as e:
            raise Exception(f"Error getting customer profile: {str(e)}")
    
    def update_customer_profile(self, customer_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update customer profile"""
        try:
            # Prepare update data
            update_data = {
                'updated_at': datetime.utcnow()
            }
            
            # Add allowed fields
            allowed_fields = ['name', 'email', 'phone']
            for field in allowed_fields:
                if field in profile_data:
                    update_data[field] = profile_data[field]
            
            # Update document
            doc_ref = self.db.collection(self.customers_collection).document(customer_id)
            doc_ref.update(update_data)
            
            # Return updated profile
            return self.get_customer_profile(customer_id)
        except Exception as e:
            raise Exception(f"Error updating customer profile: {str(e)}")

    # ===== DELIVERY ADDRESSES =====
    
    def get_delivery_addresses(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get customer's delivery addresses"""
        try:
            addresses_ref = self.db.collection(self.addresses_collection)
            query = addresses_ref.where('customer_id', '==', customer_id)
            
            addresses = []
            for doc in query.stream():
                address_data = doc.to_dict()
                address_data['id'] = doc.id
                addresses.append(address_data)
            
            return addresses
        except Exception as e:
            raise Exception(f"Error getting delivery addresses: {str(e)}")
    
    def add_delivery_address(self, customer_id: str, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new delivery address"""
        try:
            # Prepare address document
            address_doc = {
                'customer_id': customer_id,
                'label': address_data.get('label', ''),
                'address_line_1': address_data['address_line_1'].strip(),
                'address_line_2': address_data.get('address_line_2', '').strip(),
                'city': address_data['city'].strip(),
                'state': address_data['state'].strip(),
                'zip_code': address_data['zip_code'].strip(),
                'is_default': address_data.get('is_default', False),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # If this is set as default, unset other defaults
            if address_doc['is_default']:
                addresses_ref = self.db.collection(self.addresses_collection)
                query = addresses_ref.where('customer_id', '==', customer_id).where('is_default', '==', True)
                
                for doc in query.stream():
                    doc.reference.update({'is_default': False})
            
            # Save address
            doc_ref = self.db.collection(self.addresses_collection).add(address_doc)
            address_id = doc_ref[1].id
            
            address_doc['id'] = address_id
            return address_doc
        except Exception as e:
            raise Exception(f"Error adding delivery address: {str(e)}")
    
    def update_delivery_address(self, customer_id: str, address_id: str, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a delivery address"""
        try:
            # Verify address belongs to customer
            doc_ref = self.db.collection(self.addresses_collection).document(address_id)
            doc = doc_ref.get()
            
            if not doc.exists or doc.to_dict().get('customer_id') != customer_id:
                raise ValueError("Address not found")
            
            # Prepare update data
            update_data = {
                'updated_at': datetime.utcnow()
            }
            
            allowed_fields = ['label', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code', 'is_default']
            for field in allowed_fields:
                if field in address_data:
                    update_data[field] = address_data[field]
            
            # If setting as default, unset other defaults
            if update_data.get('is_default'):
                addresses_ref = self.db.collection(self.addresses_collection)
                query = addresses_ref.where('customer_id', '==', customer_id).where('is_default', '==', True)
                
                for doc in query.stream():
                    if doc.id != address_id:
                        doc.reference.update({'is_default': False})
            
            # Update address
            doc_ref.update(update_data)
            
            # Return updated address
            updated_doc = doc_ref.get()
            address_data = updated_doc.to_dict()
            address_data['id'] = address_id
            
            return address_data
        except Exception as e:
            raise Exception(f"Error updating delivery address: {str(e)}")
    
    def delete_delivery_address(self, customer_id: str, address_id: str) -> bool:
        """Delete a delivery address"""
        try:
            # Verify address belongs to customer
            doc_ref = self.db.collection(self.addresses_collection).document(address_id)
            doc = doc_ref.get()
            
            if not doc.exists or doc.to_dict().get('customer_id') != customer_id:
                raise ValueError("Address not found")
            
            # Delete address
            doc_ref.delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting delivery address: {str(e)}")

    # ===== FAVORITES =====
    
    def get_favorite_restaurants(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get customer's favorite restaurants"""
        try:
            favorites_ref = self.db.collection(self.favorites_collection)
            query = favorites_ref.where('customer_id', '==', customer_id)
            
            favorite_restaurant_ids = []
            for doc in query.stream():
                favorite_data = doc.to_dict()
                favorite_restaurant_ids.append(favorite_data['restaurant_id'])
            
            # Get restaurant details for favorites
            favorites = []
            for restaurant_id in favorite_restaurant_ids:
                try:
                    restaurant = self.get_restaurant_details(restaurant_id)
                    favorites.append(restaurant)
                except:
                    # Skip if restaurant no longer exists
                    continue
            
            return favorites
        except Exception as e:
            raise Exception(f"Error getting favorite restaurants: {str(e)}")
    
    def add_to_favorites(self, customer_id: str, restaurant_id: str) -> bool:
        """Add restaurant to favorites"""
        try:
            # Check if already in favorites
            favorites_ref = self.db.collection(self.favorites_collection)
            query = favorites_ref.where('customer_id', '==', customer_id).where('restaurant_id', '==', restaurant_id)
            
            existing = list(query.stream())
            if existing:
                return True  # Already in favorites
            
            # Add to favorites
            favorite_doc = {
                'customer_id': customer_id,
                'restaurant_id': restaurant_id,
                'created_at': datetime.utcnow()
            }
            
            favorites_ref.add(favorite_doc)
            return True
        except Exception as e:
            raise Exception(f"Error adding to favorites: {str(e)}")
    
    def remove_from_favorites(self, customer_id: str, restaurant_id: str) -> bool:
        """Remove restaurant from favorites"""
        try:
            favorites_ref = self.db.collection(self.favorites_collection)
            query = favorites_ref.where('customer_id', '==', customer_id).where('restaurant_id', '==', restaurant_id)
            
            for doc in query.stream():
                doc.reference.delete()
            
            return True
        except Exception as e:
            raise Exception(f"Error removing from favorites: {str(e)}")

    # ===== SEARCH & DISCOVERY =====
    
    def search_restaurants(self, query: str) -> List[Dict[str, Any]]:
        """Search restaurants by query"""
        try:
            # Get all restaurants and filter in Python (since Firestore doesn't support full-text search)
            restaurants = self.get_available_restaurants()
            
            search_term = query.lower()
            results = []
            
            for restaurant in restaurants:
                name_match = search_term in restaurant.get('name', '').lower()
                desc_match = search_term in restaurant.get('description', '').lower()
                cuisine_match = search_term in restaurant.get('cuisine', '').lower()
                
                if name_match or desc_match or cuisine_match:
                    results.append(restaurant)
            
            return results
        except Exception as e:
            raise Exception(f"Error searching restaurants: {str(e)}")
    
    def get_cuisine_types(self) -> List[str]:
        """Get available cuisine types"""
        try:
            restaurants = self.get_available_restaurants()
            cuisines = set()
            
            for restaurant in restaurants:
                cuisine = restaurant.get('cuisine')
                if cuisine:
                    cuisines.add(cuisine)
            
            return sorted(list(cuisines))
        except Exception as e:
            raise Exception(f"Error getting cuisine types: {str(e)}")

# Create a singleton instance
customer_service = CustomerService()