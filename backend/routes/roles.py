from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, require_admin, require_role, get_current_user_id, get_current_user_role, check_role_hierarchy
from models.roles import UserRole, Permission, RoleHelper

# Create Blueprint
roles_bp = Blueprint('roles', __name__, url_prefix='/api/roles')

@roles_bp.route('/assign', methods=['POST'])

def assign_role():
    from services.role_service import role_service
    """Assign a role to a user (Admin only)"""
    try:
        data = request.get_json()
        
        if not data or 'uid' not in data or 'role' not in data:
            return jsonify({
                'success': False,
                'error': 'UID and role are required'
            }), 400
        
        uid = data['uid']
        role_str = data['role']
        
        # Validate role
        if not UserRole.is_valid_role(role_str):
            return jsonify({
                'success': False,
                'error': f'Invalid role. Valid roles: {UserRole.get_all_roles()}'
            }), 400
        
        role = UserRole(role_str)
        
        # Assign role
        success = role_service.assign_role(uid, role)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Role {role.value} assigned to user {uid}',
                'data': {
                    'uid': uid,
                    'role': role.value,
                    'permissions': [p.value for p in RoleHelper.get_role_permissions(role)]
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to assign role'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/update', methods=['PUT'])
@require_admin
@check_role_hierarchy
def update_role():
    """Update user's role (Admin only)"""
    from services.role_service import role_service
    try:
        data = request.get_json()
        
        if not data or 'uid' not in data or 'role' not in data:
            return jsonify({
                'success': False,
                'error': 'UID and role are required'
            }), 400
        
        uid = data['uid']
        role_str = data['role']
        
        # Validate role
        if not UserRole.is_valid_role(role_str):
            return jsonify({
                'success': False,
                'error': f'Invalid role. Valid roles: {UserRole.get_all_roles()}'
            }), 400
        
        new_role = UserRole(role_str)
        current_user_id = get_current_user_id()
        
        # Update role
        success = role_service.update_user_role(uid, new_role, current_user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Role updated to {new_role.value} for user {uid}',
                'data': {
                    'uid': uid,
                    'role': new_role.value,
                    'permissions': [p.value for p in RoleHelper.get_role_permissions(new_role)]
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update role'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/user/<uid>', methods=['GET'])
@require_auth
def get_user_role(uid):
    from services.role_service import role_service
    """Get user's role and permissions"""
    try:
        # Check if user can view this role (admin or self)
        current_user_id = get_current_user_id()
        current_user_role = get_current_user_role()
        
        if current_user_id != uid and current_user_role != UserRole.ADMIN:
            return jsonify({
                'success': False,
                'error': 'You can only view your own role'
            }), 403
        
        user_role = role_service.get_user_role(uid)
        
        if not user_role:
            return jsonify({
                'success': False,
                'error': 'No role assigned to user'
            }), 404
        
        permissions = RoleHelper.get_role_permissions(user_role)
        role_data = role_service.get_role_specific_data(uid)
        
        return jsonify({
            'success': True,
            'data': {
                'uid': uid,
                'role': user_role.value,
                'description': RoleHelper.get_role_description(user_role),
                'permissions': [p.value for p in permissions],
                'role_specific_data': role_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/my-role', methods=['GET'])
@require_auth
def get_my_role():
    from services.role_service import role_service
    """Get current user's role and permissions"""
    try:
        uid = get_current_user_id()
        user_role = role_service.get_user_role(uid)
        
        if not user_role:
            # Assign default role if none exists
            default_role = RoleHelper.get_default_role()
            role_service.assign_role(uid, default_role)
            user_role = default_role
        
        permissions = RoleHelper.get_role_permissions(user_role)
        role_data = role_service.get_role_specific_data(uid)
        
        return jsonify({
            'success': True,
            'data': {
                'uid': uid,
                'role': user_role.value,
                'description': RoleHelper.get_role_description(user_role),
                'permissions': [p.value for p in permissions],
                'role_specific_data': role_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/by-role/<role>', methods=['GET'])
@require_admin
def get_users_by_role(role):
    from services.role_service import role_service
    """Get all users with a specific role (Admin only)"""
    try:
        # Validate role
        if not UserRole.is_valid_role(role):
            return jsonify({
                'success': False,
                'error': f'Invalid role. Valid roles: {UserRole.get_all_roles()}'
            }), 400
        
        user_role = UserRole(role)
        users = role_service.get_users_by_role(user_role)
        
        return jsonify({
            'success': True,
            'data': users,
            'count': len(users),
            'role': user_role.value
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/permissions', methods=['GET'])
@require_auth
def get_available_permissions():
    from services.role_service import role_service
    """Get all available permissions and roles"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'roles': [
                    {
                        'value': role.value,
                        'description': RoleHelper.get_role_description(role),
                        'permissions': [p.value for p in RoleHelper.get_role_permissions(role)]
                    }
                    for role in UserRole
                ],
                'permissions': [p.value for p in Permission]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/statistics', methods=['GET'])
@require_admin
def get_role_statistics():
    from services.role_service import role_service
    """Get role distribution statistics (Admin only)"""
    try:
        stats = role_service.get_role_statistics()
        total_users = sum(stats.values())
        
        return jsonify({
            'success': True,
            'data': {
                'role_distribution': stats,
                'total_users': total_users,
                'breakdown': [
                    {
                        'role': role,
                        'count': count,
                        'percentage': round((count / total_users * 100), 2) if total_users > 0 else 0
                    }
                    for role, count in stats.items()
                ]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/check-permission', methods=['POST'])
@require_auth
def check_permission():
    from services.role_service import role_service
    """Check if current user has specific permission"""
    try:
        data = request.get_json()
        
        if not data or 'permission' not in data:
            return jsonify({
                'success': False,
                'error': 'Permission is required'
            }), 400
        
        permission_str = data['permission']
        
        # Validate permission
        try:
            permission = Permission(permission_str)
        except ValueError:
            return jsonify({
                'success': False,
                'error': f'Invalid permission: {permission_str}'
            }), 400
        
        uid = get_current_user_id()
        has_permission = role_service.has_permission(uid, permission)
        
        return jsonify({
            'success': True,
            'data': {
                'uid': uid,
                'permission': permission.value,
                'has_permission': has_permission
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/role-data', methods=['GET'])
@require_auth
def get_my_role_data():
    from services.role_service import role_service
    """Get current user's role-specific data"""
    try:
        uid = get_current_user_id()
        role_data = role_service.get_role_specific_data(uid)
        
        if not role_data:
            return jsonify({
                'success': False,
                'error': 'No role-specific data found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': role_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/role-data', methods=['PUT'])
@require_auth
def update_my_role_data():
    from services.role_service import role_service
    """Update current user's role-specific data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        uid = get_current_user_id()
        
        # Remove sensitive fields that shouldn't be updated directly
        protected_fields = ['uid', 'role', 'created_at']
        for field in protected_fields:
            data.pop(field, None)
        
        success = role_service.update_role_specific_data(uid, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Role-specific data updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update role-specific data'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@roles_bp.route('/remove/<uid>', methods=['DELETE'])
@require_admin
@check_role_hierarchy
def remove_user_role(uid):
    from services.role_service import role_service
    """Remove/deactivate user's role (Admin only)"""
    try:
        success = role_service.remove_user_role(uid)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Role removed for user {uid}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to remove role'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500