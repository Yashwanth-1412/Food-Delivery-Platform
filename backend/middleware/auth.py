from flask import request, jsonify
from functools import wraps
from config.firebase import get_auth

def require_auth(f):
    """Decorator to require Firebase authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify JWT token with Firebase Admin SDK
            auth_service = get_auth()
            decoded_token = auth_service.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
    
    return decorated_function

def get_current_user():
    """Get current authenticated user from request"""
    return getattr(request, 'user', None)

def get_current_user_id():
    """Get current authenticated user ID"""
    user = get_current_user()
    return user['uid'] if user else None