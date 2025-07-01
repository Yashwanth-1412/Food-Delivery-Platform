from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, require_role, require_restaurant_or_admin, get_current_user_id
from models.roles import UserRole
from services.restaurant_service import restaurant_service

# Create Blueprint
restaurants_bp = Blueprint('restaurants', __name__, url_prefix='/api/restaurants')

# ===== RESTAURANT PROFILE MANAGEMENT =====

@restaurants_bp.route('/profile', methods=['GET'])
@require_auth
@require_restaurant_or_admin
def get_restaurant_profile():
    """Get restaurant profile"""
    try:
        uid = get_current_user_id()
        profile = restaurant_service.get_restaurant_profile(uid)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'Restaurant profile not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/profile', methods=['PUT'])
@require_restaurant_or_admin
def update_restaurant_profile():
    """Update restaurant profile"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        updated_profile = restaurant_service.update_restaurant_profile(uid, data)
        
        return jsonify({
            'success': True,
            'message': 'Restaurant profile updated successfully',
            'data': updated_profile
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

@restaurants_bp.route('/settings', methods=['GET'])
@require_restaurant_or_admin
def get_restaurant_settings():
    """Get restaurant settings"""
    try:
        uid = get_current_user_id()
        settings = restaurant_service.get_restaurant_settings(uid)
        
        return jsonify({
            'success': True,
            'data': settings
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/settings', methods=['PUT'])
@require_restaurant_or_admin
def update_restaurant_settings():
    """Update restaurant settings"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        updated_settings = restaurant_service.update_restaurant_settings(uid, data)
        
        return jsonify({
            'success': True,
            'message': 'Restaurant settings updated successfully',
            'data': updated_settings
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

# ===== MENU CATEGORY MANAGEMENT =====

@restaurants_bp.route('/categories', methods=['GET'])
@require_restaurant_or_admin
def get_menu_categories():
    """Get all menu categories for restaurant"""
    try:
        uid = get_current_user_id()
        categories = restaurant_service.get_menu_categories(uid)
        
        return jsonify({
            'success': True,
            'data': categories,
            'count': len(categories)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/categories', methods=['POST'])
@require_restaurant_or_admin
def create_menu_category():
    """Create new menu category"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        new_category = restaurant_service.create_menu_category(uid, data)
        
        return jsonify({
            'success': True,
            'message': 'Menu category created successfully',
            'data': new_category
        }), 201
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

@restaurants_bp.route('/categories/<category_id>', methods=['PUT'])
@require_restaurant_or_admin
def update_menu_category(category_id):
    """Update menu category"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        updated_category = restaurant_service.update_menu_category(uid, category_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Menu category updated successfully',
            'data': updated_category
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

@restaurants_bp.route('/categories/<category_id>', methods=['DELETE'])
@require_restaurant_or_admin
def delete_menu_category(category_id):
    """Delete menu category"""
    try:
        uid = get_current_user_id()
        deleted_category = restaurant_service.delete_menu_category(uid, category_id)
        
        return jsonify({
            'success': True,
            'message': 'Menu category deleted successfully',
            'data': deleted_category
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

# ===== MENU ITEM MANAGEMENT =====

@restaurants_bp.route('/menu-items', methods=['GET'])
@require_restaurant_or_admin
def get_menu_items():
    """Get all menu items for restaurant"""
    try:
        uid = get_current_user_id()
        category_id = request.args.get('category_id')
        
        if category_id:
            menu_items = restaurant_service.get_menu_items(uid, category_id)
        else:
            menu_items = restaurant_service.get_menu_items(uid)
        
        return jsonify({
            'success': True,
            'data': menu_items,
            'count': len(menu_items)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/menu-items', methods=['POST'])
@require_restaurant_or_admin
def create_menu_item():
    """Create new menu item"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        new_item = restaurant_service.create_menu_item(uid, data)
        
        return jsonify({
            'success': True,
            'message': 'Menu item created successfully',
            'data': new_item
        }), 201
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

@restaurants_bp.route('/menu-items/<item_id>', methods=['PUT'])
@require_restaurant_or_admin
def update_menu_item(item_id):
    """Update menu item"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        updated_item = restaurant_service.update_menu_item(item_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Menu item updated successfully',
            'data': updated_item
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

@restaurants_bp.route('/menu-items/<item_id>', methods=['DELETE'])
@require_restaurant_or_admin
def delete_menu_item(item_id):
    """Delete menu item"""
    try:
        uid = get_current_user_id()
        deleted_item = restaurant_service.delete_menu_item(uid, item_id)
        
        return jsonify({
            'success': True,
            'message': 'Menu item deleted successfully',
            'data': deleted_item
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

@restaurants_bp.route('/menu-items/<item_id>/toggle', methods=['PUT'])
@require_restaurant_or_admin
def toggle_menu_item_availability(item_id):
    """Toggle menu item availability"""
    try:
        uid = get_current_user_id()
        updated_item = restaurant_service.toggle_menu_item_availability(uid, item_id)
        
        return jsonify({
            'success': True,
            'message': 'Menu item availability updated',
            'data': updated_item
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

# ===== ORDER MANAGEMENT =====

@restaurants_bp.route('/orders', methods=['GET'])
@require_restaurant_or_admin
def get_restaurant_orders():
    """Get orders for restaurant"""
    try:
        uid = get_current_user_id()
        status = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        
        orders = restaurant_service.get_restaurant_orders(uid, status, limit)
        
        return jsonify({
            'success': True,
            'data': orders,
            'count': len(orders)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/orders/<order_id>/status', methods=['PUT'])
@require_restaurant_or_admin
def update_order_status(order_id):
    """Update order status"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        updated_order = restaurant_service.update_order_status(uid, order_id, data['status'])
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully',
            'data': updated_order
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

# ===== ANALYTICS & STATS =====

@restaurants_bp.route('/stats', methods=['GET'])
@require_restaurant_or_admin
def get_restaurant_stats():
    """Get restaurant statistics"""
    try:
        uid = get_current_user_id()
        stats = restaurant_service.get_restaurant_stats(uid)
        
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@restaurants_bp.route('/analytics', methods=['GET'])
@require_restaurant_or_admin
def get_restaurant_analytics():
    """Get restaurant analytics"""
    try:
        uid = get_current_user_id()
        period = request.args.get('period', 'week')  # week, month, year
        
        analytics = restaurant_service.get_restaurant_analytics(uid, period)
        
        return jsonify({
            'success': True,
            'data': analytics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== IMAGE UPLOAD =====

@restaurants_bp.route('/menu/items/<string:item_id>/upload-image', methods=['POST'])
@require_restaurant_or_admin
def upload_menu_item_image(item_id):
    """Upload menu item image"""
    try:
        uid = get_current_user_id()
        
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        image_url = restaurant_service.upload_menu_item_image(uid, item_id, file)
        
        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully',
            'image_url': image_url
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


@restaurants_bp.route('/summary', methods=['GET'])
@require_restaurant_or_admin
def get_summary():
    """Get restaurant menu summary"""
    try:
        uid = get_current_user_id()
        summary = restaurant_service.get_restaurant_summary(uid)
        
        return jsonify({
            'success': True,
            'data': summary
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Add this to backend/routes/restaurants.py

@restaurants_bp.route('/upload-logo', methods=['POST'])
@require_restaurant_or_admin
def upload_restaurant_logo():
    """Upload restaurant logo"""
    try:
        uid = get_current_user_id()
        
        if 'logo' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No logo file provided'
            }), 400
        
        file = request.files['logo']
        
        # Upload the logo and get the URL
        logo_url = restaurant_service.upload_restaurant_logo(uid, file)
        
        return jsonify({
            'success': True,
            'message': 'Logo uploaded successfully',
            'logo_url': logo_url
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