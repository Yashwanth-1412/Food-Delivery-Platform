# backend/routes/admin.py
from flask import Blueprint, request, jsonify
from decorators.auth_decorators import require_auth, require_admin
from decorators.role_decorators import require_role
from models.user_role import UserRole
from utils.auth_utils import get_current_user_id
from services.admin_service import admin_service

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# ===== USER MANAGEMENT ROUTES =====

@admin_bp.route('/users', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_all_users():
    """Get all users with optional filtering"""
    try:
        # Get query parameters for filtering
        filters = {
            'role': request.args.get('role'),
            'status': request.args.get('status'),
            'search': request.args.get('search')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = admin_service.get_all_users(filters)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'count': len(result['data'])
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_user_by_id(user_id):
    """Get detailed user information"""
    try:
        result = admin_service.get_user_by_id(user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 404 if 'not found' in result['error'].lower() else 500
            
    except Exception as e:
        print(f"Error in get_user_by_id: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/users/<user_id>/suspend', methods=['POST'])
@require_role(UserRole.ADMIN)
def suspend_user(user_id):
    """Suspend a user account"""
    try:
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        current_user = get_current_user_id()
        
        result = admin_service.suspend_user(user_id, reason, current_user)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'User {user_id} suspended successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in suspend_user: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/users/<user_id>/activate', methods=['POST'])
@require_role(UserRole.ADMIN)
def activate_user(user_id):
    """Activate a suspended user"""
    try:
        current_user = get_current_user_id()
        
        result = admin_service.activate_user(user_id, current_user)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'User {user_id} activated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in activate_user: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_role(UserRole.ADMIN)
def delete_user(user_id):
    """Delete a user (soft delete)"""
    try:
        current_user = get_current_user_id()
        
        result = admin_service.delete_user(user_id, current_user)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'User {user_id} deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in delete_user: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== SYSTEM OVERVIEW ROUTES =====

@admin_bp.route('/stats', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_system_stats():
    """Get system statistics"""
    try:
        result = admin_service.get_system_stats()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_system_stats: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/activities', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_recent_activities():
    """Get recent system activities"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        result = admin_service.get_recent_activities(limit)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_recent_activities: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/health', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_system_health():
    """Get system health status"""
    try:
        result = admin_service.get_system_health()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_system_health: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== PLATFORM SETTINGS ROUTES =====

@admin_bp.route('/settings', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_platform_settings():
    """Get platform configuration settings"""
    try:
        result = admin_service.get_platform_settings()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_platform_settings: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@admin_bp.route('/settings', methods=['PUT'])
@require_role(UserRole.ADMIN)
def update_platform_settings():
    """Update platform configuration settings"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No settings data provided'
            }), 400
        
        current_user = get_current_user_id()
        
        result = admin_service.update_platform_settings(data, current_user)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Platform settings updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in update_platform_settings: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== RESTAURANT MANAGEMENT ROUTES =====

@admin_bp.route('/restaurants', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_all_restaurants():
    """Get all restaurants with optional filtering"""
    try:
        filters = {
            'status': request.args.get('status'),
            'search': request.args.get('search')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = admin_service.get_all_restaurants(filters)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'count': len(result['data'])
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        print(f"Error in get_all_restaurants: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== ORDER MONITORING ROUTES =====

@admin_bp.route('/orders', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_all_orders():
    """Get all orders with optional filtering"""
    try:
        # This would be implemented similar to restaurants
        # For now, returning mock data
        return jsonify({
            'success': True,
            'data': [],
            'message': 'Order monitoring endpoint - implementation pending'
        })
        
    except Exception as e:
        print(f"Error in get_all_orders: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== ANALYTICS ROUTES =====

@admin_bp.route('/analytics/revenue', methods=['GET'])
@require_role(UserRole.ADMIN)
def get_revenue_analytics():
    """Get revenue analytics"""
    try:
        period = request.args.get('period', '30d')
        
        # This would implement actual analytics
        # For now, returning mock data
        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'total_revenue': 45280.50,
                'growth_rate': 12.5
            },
            'message': 'Revenue analytics endpoint - implementation pending'
        })
        
    except Exception as e:
        print(f"Error in get_revenue_analytics: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== SYSTEM REPORTS =====

@admin_bp.route('/reports/generate', methods=['POST'])
@require_role(UserRole.ADMIN)
def generate_system_report():
    """Generate system report"""
    try:
        data = request.get_json()
        period = data.get('period', '24h') if data else '24h'
        
        # This would generate actual reports
        # For now, returning success message
        return jsonify({
            'success': True,
            'message': f'System report for {period} generated successfully',
            'data': {
                'report_id': 'report_12345',
                'period': period,
                'generated_at': '2024-01-15T10:30:00Z'
            }
        })
        
    except Exception as e:
        print(f"Error in generate_system_report: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# ===== ERROR HANDLERS =====

@admin_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Access denied. Admin privileges required.'
    }), 403

@admin_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@admin_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500