# backend/routes/customer.py
from flask import Blueprint, request, jsonify
from functools import wraps
from middleware.auth import get_current_user_id, require_role
from models.roles import UserRole
from services.customer_service import customer_service
from services.restaurant_service import restaurant_service

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customer')


# ===== RESTAURANT DISCOVERY =====

@customer_bp.route('/restaurants', methods=['GET'])
def get_available_restaurants():
    """Get list of available restaurants for customers"""
    try:
        # Get query parameters
        cuisine = request.args.get('cuisine')
        search = request.args.get('search')
        is_open = request.args.get('is_open')
        min_rating = request.args.get('min_rating')
        
        filters = {}
        if cuisine:
            filters['cuisine'] = cuisine
        if search:
            filters['search'] = search
        if is_open is not None:
            filters['is_open'] = is_open.lower() == 'true'
        if min_rating:
            try:
                filters['min_rating'] = float(min_rating)
            except ValueError:
                pass
        
        restaurants = customer_service.get_available_restaurants(filters)
        
        return jsonify({
            'success': True,
            'data': restaurants
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== DELIVERY ADDRESSES =====
@customer_bp.route('/addresses', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_delivery_addresses():
    """Get customer's delivery addresses"""
    try:
        uid = get_current_user_id()
        addresses = customer_service.get_delivery_addresses(uid)
       
        return jsonify({
            'success': True,
            'data': addresses
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/addresses', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def add_delivery_address():
    """Add a new delivery address"""
    try:
        uid = get_current_user_id()
        address_data = request.get_json()
       
        # Updated required fields to include receiver_name
        required_fields = ['receiver_name', 'address_line_1', 'city', 'state', 'zip_code']
        for field in required_fields:
            if field not in address_data or not address_data[field].strip():
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
       
        address = customer_service.add_delivery_address(uid, address_data)
       
        return jsonify({
            'success': True,
            'message': 'Address added successfully',
            'data': address
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/addresses/<address_id>', methods=['PUT'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def update_delivery_address(address_id):
    """Update a delivery address"""
    try:
        uid = get_current_user_id()
        address_data = request.get_json()
       
        updated_address = customer_service.update_delivery_address(uid, address_id, address_data)
       
        return jsonify({
            'success': True,
            'message': 'Address updated successfully',
            'data': updated_address
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/addresses/<address_id>', methods=['DELETE'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def delete_delivery_address(address_id):
    """Delete a delivery address"""
    try:
        uid = get_current_user_id()
        customer_service.delete_delivery_address(uid, address_id)
       
        return jsonify({
            'success': True,
            'message': 'Address deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
# ===== FAVORITES =====

@customer_bp.route('/favorites', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_favorite_restaurants():
    """Get customer's favorite restaurants"""
    try:
        uid = get_current_user_id()
        favorites = customer_service.get_favorite_restaurants(uid)
        
        return jsonify({
            'success': True,
            'data': favorites
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/favorites', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def add_to_favorites():
    """Add restaurant to favorites"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        restaurant_id = data.get('restaurant_id')
        
        if not restaurant_id:
            return jsonify({
                'success': False,
                'error': 'Missing restaurant_id'
            }), 400
        
        customer_service.add_to_favorites(uid, restaurant_id)
        
        return jsonify({
            'success': True,
            'message': 'Restaurant added to favorites'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/favorites/<restaurant_id>', methods=['DELETE'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def remove_from_favorites(restaurant_id):
    """Remove restaurant from favorites"""
    try:
        uid = get_current_user_id()
        customer_service.remove_from_favorites(uid, restaurant_id)
        
        return jsonify({
            'success': True,
            'message': 'Restaurant removed from favorites'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== SEARCH & DISCOVERY =====

@customer_bp.route('/search', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def search_restaurants():
    """Search restaurants by query"""
    try:
        query = request.args.get('q', '')
        if not query.strip():
            return jsonify({
                'success': False,
                'error': 'Search query is required'
            }), 400
        
        results = customer_service.search_restaurants(query)
        
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cuisines', methods=['GET'])
@customer_bp.route('/cuisines', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_cuisine_types():
    """Get available cuisine types"""
    try:
        cuisines = customer_service.get_cuisine_types()
        
        return jsonify({
            'success': True,
            'data': cuisines
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
@customer_bp.route('/restaurants/<restaurant_id>', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_restaurant_details(restaurant_id):
    """Get detailed information about a specific restaurant"""
    try:
        restaurant = customer_service.get_restaurant_details(restaurant_id)
        
        return jsonify({
            'success': True,
            'data': restaurant
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/restaurants/<restaurant_id>/menu', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_restaurant_menu(restaurant_id):
    """Get restaurant menu for customers"""
    try:
        menu = customer_service.get_restaurant_menu(restaurant_id)
        
        return jsonify({
            'success': True,
            'data': menu
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== ORDER MANAGEMENT =====

@customer_bp.route('/orders', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def create_order():
    """Create a new order"""
    try:
        uid = get_current_user_id()
        order_data = request.get_json()
        
        # Validate required fields
        required_fields = ['restaurant_id', 'items', 'delivery_address', 'total']
        for field in required_fields:
            if field not in order_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Create the order
        order = customer_service.create_order(uid, order_data)
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'data': order
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/orders', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_customer_orders():
    """Get customer's order history"""
    try:
        uid = get_current_user_id()
        status = request.args.get('status')
        limit = request.args.get('limit', 20, type=int)
        
        orders = customer_service.get_customer_orders(uid, status, limit)
        
        return jsonify({
            'success': True,
            'data': orders
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/orders/<order_id>', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_order_details(order_id):
    """Get detailed information about a specific order"""
    try:
        uid = get_current_user_id()
        order = customer_service.get_order_details(uid, order_id)
        
        return jsonify({
            'success': True,
            'data': order
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/orders/<order_id>/cancel', methods=['PUT'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def cancel_order(order_id):
    """Cancel an order"""
    try:
        uid = get_current_user_id()
        result = customer_service.cancel_order(uid, order_id)
        
        return jsonify({
            'success': True,
            'message': 'Order cancelled successfully',
            'data': result
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== CUSTOMER PROFILE =====

@customer_bp.route('/profile', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_customer_profile():
    """Get customer profile"""
    try:
        uid = get_current_user_id()
        profile = customer_service.get_customer_profile(uid)
        
        return jsonify({
            'success': True,
            'data': profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


        
@customer_bp.route('/profile', methods=['PUT'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def update_customer_profile():
    """Update customer profile"""
    try:
        uid = get_current_user_id()
        profile_data = request.get_json()
        
        updated_profile = customer_service.update_customer_profile(uid, profile_data)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': updated_profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ===== CART MANAGEMENT =====

@customer_bp.route('/cart', methods=['GET'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def get_pending_cart():
    """Get customer's pending cart"""
    try:
        uid = get_current_user_id()
        cart = customer_service.get_pending_cart(uid)
        
        return jsonify({
            'success': True,
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def save_pending_cart():
    """Save customer's pending cart"""
    try:
        uid = get_current_user_id()
        cart_data = request.get_json()
        
        cart = customer_service.save_pending_cart(uid, cart_data)
        
        return jsonify({
            'success': True,
            'message': 'Cart saved successfully',
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart/sync', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def sync_cart():
    """Sync entire cart with frontend state"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        cart_items = data.get('items', [])
        restaurant_info = data.get('restaurant_info')
        
        cart = customer_service.sync_cart_items(uid, cart_items, restaurant_info)
        
        return jsonify({
            'success': True,
            'message': 'Cart synced successfully',
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart/items', methods=['POST'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def add_item_to_cart():
    """Add item to customer's pending cart"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['restaurant_id', 'restaurant_info', 'item']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        cart = customer_service.add_item_to_cart(
            uid, 
            data['restaurant_id'], 
            data['restaurant_info'], 
            data['item']
        )
        
        return jsonify({
            'success': True,
            'message': 'Item added to cart',
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart/items/<item_id>', methods=['PUT'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def update_cart_item(item_id):
    """Update item quantity in cart"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        quantity = data.get('quantity')
        if quantity is None:
            return jsonify({
                'success': False,
                'error': 'Quantity is required'
            }), 400
        
        cart = customer_service.update_cart_item_quantity(uid, item_id, quantity)
        
        return jsonify({
            'success': True,
            'message': 'Cart item updated',
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart/items/<item_id>', methods=['DELETE'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def remove_cart_item(item_id):
    """Remove item from cart"""
    try:
        uid = get_current_user_id()
        
        cart = customer_service.remove_item_from_cart(uid, item_id)
        
        return jsonify({
            'success': True,
            'message': 'Item removed from cart',
            'data': cart
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/cart', methods=['DELETE'])
@require_role(UserRole.CUSTOMER, UserRole.ADMIN)
def clear_cart():
    """Clear customer's pending cart"""
    try:
        uid = get_current_user_id()
        
        customer_service.clear_pending_cart(uid)
        
        return jsonify({
            'success': True,
            'message': 'Cart cleared successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500