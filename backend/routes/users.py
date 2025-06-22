from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, get_current_user_id
from services.user_service import user_service
from utils.validators import validate_password

# Create Blueprint
users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@require_auth
def get_users():
    """Get all users or search users"""
    try:
        search_term = request.args.get('search', '').strip()
        
        if search_term:
            users = user_service.search_users(search_term)
        else:
            users = user_service.get_all_users()
        
        return jsonify({
            'success': True,
            'data': users,
            'count': len(users)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@users_bp.route('/<user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get a specific user by ID"""
    try:
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@users_bp.route('', methods=['POST'])
@require_auth
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Create user
        new_user = user_service.create_user(data)
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'data': new_user
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

@users_bp.route('/<user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    """Update an existing user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Update user
        updated_user = user_service.update_user(user_id, data)
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'data': updated_user
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

@users_bp.route('/<user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    """Delete a user"""
    try:
        current_user_id = get_current_user_id()
        
        # Prevent users from deleting themselves (optional)
        # if current_user_id == user_id:
        #     return jsonify({
        #         'success': False,
        #         'error': 'You cannot delete your own account'
        #     }), 400
        
        # Delete user
        deleted_user = user_service.delete_user(user_id)
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully',
            'data': deleted_user
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

@users_bp.route('/email/<email>', methods=['GET'])
@require_auth
def get_user_by_email(email):
    """Get user by email address"""
    try:
        user = user_service.get_user_by_email(email)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@users_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():

    try:
        data = request.get_json()
        current_user_id = get_current_user_id()
        
        if not data or 'current_password' not in data or 'new_password' not in data:
            return jsonify({
                'success': False,
                'error': 'current_password and new_password are required'
            }), 400
            
        # Validate new password
        password_validation = validate_password(data['new_password'])
        if not password_validation['valid']:
            return jsonify({
                'success': False,
                'error': password_validation['message']
            }), 400
            
        # Change the password
        result = user_service.change_password(
            user_id=current_user_id,
            current_password=data['current_password'],
            new_password=data['new_password']
        )
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
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