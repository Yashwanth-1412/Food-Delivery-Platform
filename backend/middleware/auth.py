from flask import request, jsonify
from functools import wraps
from config.firebase import get_auth
from models.roles import UserRole, Permission, RoleHelper

def require_auth(f):
    """Basic authentication decorator"""
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

def require_role(*allowed_roles):
    """Decorator to require specific roles for accessing endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # First check authentication
            token = request.headers.get('Authorization')
            
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            try:
                # Remove 'Bearer ' prefix if present
                if token.startswith('Bearer '):
                    token = token[7:]
                
                # Verify JWT token
                auth_service = get_auth()
                decoded_token = auth_service.verify_id_token(token)
                request.user = decoded_token
                
                # Get user role - lazy import to avoid circular imports
                from services.role_service import role_service
                uid = decoded_token['uid']
                user_role = role_service.get_user_role(uid)
                
                if not user_role:
                    return jsonify({'error': 'No role assigned to user'}), 403
                
                # Check if user has required role
                if user_role not in allowed_roles:
                    return jsonify({
                        'error': 'Insufficient permissions',
                        'required_roles': [role.value for role in allowed_roles],
                        'user_role': user_role.value
                    }), 403
                
                # Add role to request for use in endpoint
                request.user_role = user_role
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401
        
        return decorated_function
    return decorator

def require_permission(*required_permissions):
    """Decorator to require specific permissions for accessing endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # First check authentication
            token = request.headers.get('Authorization')
            
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            try:
                # Remove 'Bearer ' prefix if present
                if token.startswith('Bearer '):
                    token = token[7:]
                
                # Verify JWT token
                auth_service = get_auth()
                decoded_token = auth_service.verify_id_token(token)
                request.user = decoded_token
                
                # Get user role - lazy import to avoid circular imports
                from services.role_service import role_service
                uid = decoded_token['uid']
                user_role = role_service.get_user_role(uid)
                
                if not user_role:
                    return jsonify({'error': 'No role assigned to user'}), 403
                
                # Check if user has all required permissions
                user_permissions = RoleHelper.get_role_permissions(user_role)
                
                missing_permissions = []
                for permission in required_permissions:
                    if permission not in user_permissions:
                        missing_permissions.append(permission.value)
                
                if missing_permissions:
                    return jsonify({
                        'error': 'Insufficient permissions',
                        'missing_permissions': missing_permissions,
                        'user_role': user_role.value
                    }), 403
                
                # Add role to request for use in endpoint
                request.user_role = user_role
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': 'Authentication failed', 'details': str(e)}), 401
        
        return decorated_function
    return decorator

def require_admin(f):
    """Decorator to require admin role"""
    @require_role(UserRole.ADMIN)
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def require_restaurant_or_admin(f):
    """Decorator to require restaurant or admin role"""
    @require_role(UserRole.RESTAURANT, UserRole.ADMIN)
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def require_agent_or_admin(f):
    """Decorator to require agent or admin role"""
    @require_role(UserRole.AGENT, UserRole.ADMIN)
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current authenticated user from request"""
    return getattr(request, 'user', None)

def get_current_user_id():
    """Get current authenticated user ID"""
    user = get_current_user()
    return user['uid'] if user else None

def get_current_user_role():
    """Get current authenticated user role"""
    return getattr(request, 'user_role', None)

def check_role_hierarchy(f):
    """Decorator to check if current user can manage target user based on role hierarchy"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_role = get_current_user_role()
        
        # Extract target user ID from URL parameters or request body
        target_user_id = kwargs.get('user_id') or request.get_json().get('user_id')
        
        if target_user_id:
            from services.role_service import role_service
            target_user_role = role_service.get_user_role(target_user_id)
            
            if target_user_role and not RoleHelper.can_manage_role(current_user_role, target_user_role):
                return jsonify({
                    'error': 'Cannot manage user with equal or higher role',
                    'your_role': current_user_role.value,
                    'target_role': target_user_role.value
                }), 403
        
        return f(*args, **kwargs)
    return decorated_function

