from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, get_current_user, get_current_user_id
from services.profile_service import profile_service
from services.storage_service import storage_service

# Create Blueprint
profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_bp.route('', methods=['GET'])
@require_auth
def get_profile():
    """Get current user's profile"""
    try:
        uid = get_current_user_id()
        user = get_current_user()
        
        # Get profile from database
        profile_data = profile_service.get_profile(uid)
        
        if not profile_data:
            # Create default profile if it doesn't exist
            profile_data = profile_service.create_default_profile(uid, user)
        
        # Add auth info
        profile_data.update({
            'email_verified': user.get('email_verified', False),
            'provider': user.get('firebase', {}).get('sign_in_provider', 'unknown')
        })
        
        return jsonify({
            'success': True,
            'data': profile_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@profile_bp.route('', methods=['PUT'])
@require_auth
def update_profile():
    """Update current user's profile"""
    try:
        uid = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Update profile
        updated_fields = profile_service.update_profile(uid, data)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields
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

@profile_bp.route('/avatar', methods=['POST'])
@require_auth
def upload_avatar():
    """Upload user avatar"""
    try:
        uid = get_current_user_id()
        
        if 'avatar' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['avatar']
        
        # Upload file
        avatar_url = storage_service.upload_avatar(file, uid)
        
        # Update profile with new avatar URL
        profile_service.update_avatar(uid, avatar_url)
        
        return jsonify({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'avatar_url': avatar_url
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

@profile_bp.route('/<user_id>', methods=['GET'])
@require_auth
def get_user_profile(user_id):
    """Get another user's public profile"""
    try:
        profile_data = profile_service.get_public_profile(user_id)
        
        if not profile_data:
            return jsonify({
                'success': False,
                'error': 'Profile not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': profile_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500