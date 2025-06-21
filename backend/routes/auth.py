from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, get_current_user, get_current_user_id
from config.firebase import get_auth
from services.profile_service import profile_service

# Create Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """Verify Firebase ID token"""
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({
                'success': False,
                'error': 'Token is required'
            }), 400
        
        token = data['token']
        
        # Verify token with Firebase Admin SDK
        auth_service = get_auth()
        decoded_token = auth_service.verify_id_token(token)
        
        return jsonify({
            'success': True,
            'message': 'Token is valid',
            'data': {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'provider': decoded_token.get('firebase', {}).get('sign_in_provider', 'unknown'),
                'iat': decoded_token.get('iat'),
                'exp': decoded_token.get('exp')
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Invalid token',
            'details': str(e)
        }), 401

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_current_user_profile():
    """Get current authenticated user's profile"""
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
            'uid': uid,
            'email': user.get('email'),
            'email_verified': user.get('email_verified', False),
            'provider': user.get('firebase', {}).get('sign_in_provider', 'unknown'),
            'auth_time': user.get('auth_time'),
            'iat': user.get('iat'),
            'exp': user.get('exp')
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

@auth_bp.route('/refresh', methods=['POST'])
@require_auth
def refresh_token():
    """Refresh user token (mainly for validation)"""
    try:
        user = get_current_user()
        
        return jsonify({
            'success': True,
            'message': 'Token is still valid',
            'data': {
                'uid': user['uid'],
                'email': user.get('email'),
                'expires_at': user.get('exp')
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/user', methods=['GET'])
@require_auth
def get_current_user_info():
    """Get current authenticated user information"""
    try:
        user = get_current_user()
        
        # Return only safe user information
        user_info = {
            'uid': user['uid'],
            'email': user.get('email'),
            'email_verified': user.get('email_verified', False),
            'provider': user.get('firebase', {}).get('sign_in_provider', 'unknown'),
            'auth_time': user.get('auth_time'),
            'iat': user.get('iat'),
            'exp': user.get('exp')
        }
        
        return jsonify({
            'success': True,
            'data': user_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/check', methods=['GET'])
@require_auth
def check_auth():
    """Simple authentication check endpoint"""
    try:
        uid = get_current_user_id()
        user = get_current_user()
        
        return jsonify({
            'success': True,
            'authenticated': True,
            'uid': uid,
            'email': user.get('email')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'authenticated': False,
            'error': str(e)
        }), 401
    
