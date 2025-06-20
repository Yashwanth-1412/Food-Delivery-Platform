from enum import Enum
from typing import List, Dict, Any

class UserRole(Enum):
    """User roles in the food delivery system"""
    CUSTOMER = "customer"
    AGENT = "agent"
    RESTAURANT = "restaurant"
    ADMIN = "admin"
    
    @classmethod
    def get_all_roles(cls):
        """Get all available roles"""
        return [role.value for role in cls]
    
    @classmethod
    def is_valid_role(cls, role: str):
        """Check if a role is valid"""
        return role in cls.get_all_roles()

class Permission(Enum):
    """System permissions"""
    # User management
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    UPDATE_USERS = "update_users"
    DELETE_USERS = "delete_users"
    
    # Profile management
    VIEW_PROFILE = "view_profile"
    UPDATE_PROFILE = "update_profile"
    
    # Restaurant management
    MANAGE_MENU = "manage_menu"
    VIEW_RESTAURANT_ORDERS = "view_restaurant_orders"
    UPDATE_ORDER_STATUS = "update_order_status"
    
    # Customer actions
    PLACE_ORDER = "place_order"
    VIEW_ORDER_HISTORY = "view_order_history"
    CANCEL_ORDER = "cancel_order"
    
    # Agent actions
    VIEW_AVAILABLE_ORDERS = "view_available_orders"
    ACCEPT_ORDER = "accept_order"
    UPDATE_DELIVERY_STATUS = "update_delivery_status"
    
    # Admin actions
    VIEW_ALL_ORDERS = "view_all_orders"
    MANAGE_RESTAURANTS = "manage_restaurants"
    MANAGE_AGENTS = "manage_agents"
    VIEW_ANALYTICS = "view_analytics"
    SYSTEM_SETTINGS = "system_settings"

# Role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.CUSTOMER: [
        Permission.VIEW_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.PLACE_ORDER,
        Permission.VIEW_ORDER_HISTORY,
        Permission.CANCEL_ORDER,
    ],
    
    UserRole.AGENT: [
        Permission.VIEW_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_AVAILABLE_ORDERS,
        Permission.ACCEPT_ORDER,
        Permission.UPDATE_DELIVERY_STATUS,
    ],
    
    UserRole.RESTAURANT: [
        Permission.VIEW_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.MANAGE_MENU,
        Permission.VIEW_RESTAURANT_ORDERS,
        Permission.UPDATE_ORDER_STATUS,
    ],
    
    UserRole.ADMIN: [
        # Admin has all permissions
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.UPDATE_USERS,
        Permission.DELETE_USERS,
        Permission.VIEW_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.MANAGE_MENU,
        Permission.VIEW_RESTAURANT_ORDERS,
        Permission.UPDATE_ORDER_STATUS,
        Permission.PLACE_ORDER,
        Permission.VIEW_ORDER_HISTORY,
        Permission.CANCEL_ORDER,
        Permission.VIEW_AVAILABLE_ORDERS,
        Permission.ACCEPT_ORDER,
        Permission.UPDATE_DELIVERY_STATUS,
        Permission.VIEW_ALL_ORDERS,
        Permission.MANAGE_RESTAURANTS,
        Permission.MANAGE_AGENTS,
        Permission.VIEW_ANALYTICS,
        Permission.SYSTEM_SETTINGS,
    ]
}

class RoleHelper:
    """Helper class for role-related operations"""
    
    @staticmethod
    def get_role_permissions(role: UserRole) -> List[Permission]:
        """Get permissions for a specific role"""
        return ROLE_PERMISSIONS.get(role, [])
    
    @staticmethod
    def has_permission(role: UserRole, permission: Permission) -> bool:
        """Check if a role has a specific permission"""
        role_permissions = RoleHelper.get_role_permissions(role)
        return permission in role_permissions
    
    @staticmethod
    def get_role_description(role: UserRole) -> str:
        """Get human-readable description for a role"""
        descriptions = {
            UserRole.CUSTOMER: "Customer - Can browse menus and place orders",
            UserRole.AGENT: "Delivery Agent - Can accept and deliver orders",
            UserRole.RESTAURANT: "Restaurant Manager - Can manage menu and restaurant orders",
            UserRole.ADMIN: "Administrator - Full system access and management"
        }
        return descriptions.get(role, "Unknown role")
    
    @staticmethod
    def get_default_role() -> UserRole:
        """Get the default role for new users"""
        return UserRole.CUSTOMER
    
    @staticmethod
    def get_role_hierarchy() -> Dict[UserRole, int]:
        """Get role hierarchy (higher number = more privileges)"""
        return {
            UserRole.CUSTOMER: 1,
            UserRole.AGENT: 2,
            UserRole.RESTAURANT: 3,
            UserRole.ADMIN: 4
        }
    
    @staticmethod
    def can_manage_role(manager_role: UserRole, target_role: UserRole) -> bool:
        """Check if a role can manage another role"""
        hierarchy = RoleHelper.get_role_hierarchy()
        return hierarchy.get(manager_role, 0) > hierarchy.get(target_role, 0)

# Role-specific data structures
class RoleSpecificData:
    """Data structures for role-specific information"""
    
    @staticmethod
    def get_customer_data():
        return {
            'delivery_addresses': [],
            'payment_methods': [],
            'order_preferences': {},
            'loyalty_points': 0
        }
    
    @staticmethod
    def get_agent_data():
        return {
            'vehicle_type': '',
            'license_number': '',
            'availability_status': 'offline',
            'current_location': None,
            'rating': 0.0,
            'total_deliveries': 0
        }
    
    @staticmethod
    def get_restaurant_data():
        return {
            'restaurant_name': '',
            'cuisine_type': '',
            'address': '',
            'phone': '',
            'opening_hours': {},
            'rating': 0.0,
            'is_active': True
        }
    
    @staticmethod
    def get_admin_data():
        return {
            'permissions_level': 'full',
            'department': '',
            'last_login': None,
            'access_logs': []
        }