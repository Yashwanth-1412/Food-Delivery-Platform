from firebase_admin import firestore
from config.firebase import get_db
from models.roles import UserRole, Permission, RoleHelper, RoleSpecificData
from typing import Optional, Dict, List, Any

class RoleService:
    def __init__(self):
        self.db = get_db()
        self.roles_collection = 'user_roles'
        self.role_data_collection = 'role_specific_data'
    
    def assign_role(self, uid: str, role: UserRole) -> bool:
        """Assign a role to a user"""
        try:
            # Validate role
            if not isinstance(role, UserRole):
                raise ValueError("Invalid role type")
            
            # Prepare role data
            role_data = {
                'uid': uid,
                'role': role.value,
                'assigned_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'is_active': True
            }
            
            # Save to database
            role_ref = self.db.collection(self.roles_collection).document(uid)
            role_ref.set(role_data)
            
            # Create role-specific data
            self._create_role_specific_data(uid, role)
            
            return True
        except Exception as e:
            raise Exception(f"Error assigning role: {str(e)}")
    
    def get_user_role(self, uid: str) -> Optional[UserRole]:
        """Get user's role"""
        try:
            role_ref = self.db.collection(self.roles_collection).document(uid)
            role_doc = role_ref.get()
            
            if role_doc.exists:
                role_data = role_doc.to_dict()
                if role_data.get('is_active', True):
                    role_str = role_data.get('role')
                    if role_str and UserRole.is_valid_role(role_str):
                        return UserRole(role_str)
            
            return None
        except Exception as e:
            raise Exception(f"Error getting user role: {str(e)}")
    
    def update_user_role(self, uid: str, new_role: UserRole, updated_by: str = None) -> bool:
        """Update user's role"""
        try:
            # Get current role for logging
            current_role = self.get_user_role(uid)
            
            # Update role
            role_ref = self.db.collection(self.roles_collection).document(uid)
            update_data = {
                'role': new_role.value,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'previous_role': current_role.value if current_role else None,
                'updated_by': updated_by
            }
            role_ref.update(update_data)
            
            # Update role-specific data
            self._update_role_specific_data(uid, current_role, new_role)
            
            return True
        except Exception as e:
            raise Exception(f"Error updating user role: {str(e)}")
    
    def remove_user_role(self, uid: str) -> bool:
        """Remove user's role (deactivate)"""
        try:
            role_ref = self.db.collection(self.roles_collection).document(uid)
            role_ref.update({
                'is_active': False,
                'deactivated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            raise Exception(f"Error removing user role: {str(e)}")
    
    def get_users_by_role(self, role: UserRole) -> List[Dict[str, Any]]:
        """Get all users with a specific role"""
        try:
            roles_ref = self.db.collection(self.roles_collection)
            query = roles_ref.where('role', '==', role.value).where('is_active', '==', True)
            
            users = []
            for doc in query.stream():
                role_data = doc.to_dict()
                role_data['uid'] = doc.id
                users.append(role_data)
            
            return users
        except Exception as e:
            raise Exception(f"Error getting users by role: {str(e)}")
    
    def get_user_permissions(self, uid: str) -> List[Permission]:
        """Get user's permissions based on their role"""
        try:
            user_role = self.get_user_role(uid)
            if user_role:
                return RoleHelper.get_role_permissions(user_role)
            return []
        except Exception as e:
            raise Exception(f"Error getting user permissions: {str(e)}")
    
    def has_permission(self, uid: str, permission: Permission) -> bool:
        """Check if user has a specific permission"""
        try:
            user_permissions = self.get_user_permissions(uid)
            return permission in user_permissions
        except Exception as e:
            raise Exception(f"Error checking user permission: {str(e)}")
    
    def get_role_specific_data(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get role-specific data for a user"""
        try:
            data_ref = self.db.collection(self.role_data_collection).document(uid)
            data_doc = data_ref.get()
            
            if data_doc.exists:
                return data_doc.to_dict()
            return None
        except Exception as e:
            raise Exception(f"Error getting role-specific data: {str(e)}")
    
    def update_role_specific_data(self, uid: str, data: Dict[str, Any]) -> bool:
        """Update role-specific data for a user"""
        try:
            data_ref = self.db.collection(self.role_data_collection).document(uid)
            data['updated_at'] = firestore.SERVER_TIMESTAMP
            data_ref.update(data)
            return True
        except Exception as e:
            raise Exception(f"Error updating role-specific data: {str(e)}")
    
    def _create_role_specific_data(self, uid: str, role: UserRole):
        """Create initial role-specific data"""
        try:
            # Get default data for the role
            role_data = {}
            if role == UserRole.CUSTOMER:
                role_data = RoleSpecificData.get_customer_data()
            elif role == UserRole.AGENT:
                role_data = RoleSpecificData.get_agent_data()
            elif role == UserRole.RESTAURANT:
                role_data = RoleSpecificData.get_restaurant_data()
            elif role == UserRole.ADMIN:
                role_data = RoleSpecificData.get_admin_data()
            
            # Add metadata
            role_data.update({
                'uid': uid,
                'role': role.value,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            # Save to database
            data_ref = self.db.collection(self.role_data_collection).document(uid)
            data_ref.set(role_data)
            
        except Exception as e:
            print(f"Error creating role-specific data: {str(e)}")
    
    def _update_role_specific_data(self, uid: str, old_role: Optional[UserRole], new_role: UserRole):
        """Update role-specific data when role changes"""
        try:
            # If completely new role, create fresh data
            if not old_role or old_role != new_role:
                self._create_role_specific_data(uid, new_role)
            
        except Exception as e:
            print(f"Error updating role-specific data: {str(e)}")
    
    def get_role_statistics(self) -> Dict[str, int]:
        """Get statistics about role distribution"""
        try:
            stats = {}
            roles_ref = self.db.collection(self.roles_collection)
            
            for role in UserRole:
                query = roles_ref.where('role', '==', role.value).where('is_active', '==', True)
                count = len(list(query.stream()))
                stats[role.value] = count
            
            return stats
        except Exception as e:
            raise Exception(f"Error getting role statistics: {str(e)}")

# Create a singleton instance - Firebase is already initialized by app.py
role_service = RoleService()