# backend/services/admin_service.py
from datetime import datetime, timedelta
from firebase_admin import firestore
from models.user_role import UserRole
from services.role_service import role_service
import json

class AdminService:
    def __init__(self):
        self.db = firestore.client()
        self.users_collection = self.db.collection('users')
        self.restaurants_collection = self.db.collection('restaurants')
        self.orders_collection = self.db.collection('orders')
        self.activities_collection = self.db.collection('system_activities')
        self.settings_collection = self.db.collection('platform_settings')

    # ===== USER MANAGEMENT =====
    
    def get_all_users(self, filters=None):
        """Get all users with optional filtering"""
        try:
            query = self.users_collection
            
            # Apply filters
            if filters:
                if filters.get('role') and filters['role'] != 'all':
                    query = query.where('role', '==', filters['role'])
                if filters.get('status') and filters['status'] != 'all':
                    query = query.where('status', '==', filters['status'])
            
            users = []
            docs = query.get()
            
            for doc in docs:
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                
                # Apply search filter (done locally for flexibility)
                if filters and filters.get('search'):
                    search_term = filters['search'].lower()
                    searchable_text = f"{user_data.get('email', '')} {user_data.get('displayName', '')}".lower()
                    if search_term not in searchable_text:
                        continue
                
                users.append(user_data)
            
            return {
                'success': True,
                'data': users
            }
        except Exception as e:
            print(f"Error getting users: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_by_id(self, user_id):
        """Get detailed user information"""
        try:
            doc = self.users_collection.document(user_id).get()
            if not doc.exists:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            
            # Get additional role-specific data
            role_data = role_service.get_role_specific_data(user_id)
            if role_data:
                user_data['role_data'] = role_data
            
            return {
                'success': True,
                'data': user_data
            }
        except Exception as e:
            print(f"Error getting user: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def suspend_user(self, user_id, reason, suspended_by):
        """Suspend a user account"""
        try:
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'status': 'suspended',
                'suspension_reason': reason,
                'suspended_by': suspended_by,
                'suspended_at': datetime.now().isoformat()
            })
            
            # Log activity
            self._log_activity(
                type='user_suspended',
                description=f'User {user_id} suspended by {suspended_by}',
                details={'user_id': user_id, 'reason': reason}
            )
            
            return {'success': True}
        except Exception as e:
            print(f"Error suspending user: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def activate_user(self, user_id, activated_by):
        """Activate a suspended user"""
        try:
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'status': 'active',
                'suspension_reason': firestore.DELETE_FIELD,
                'suspended_by': firestore.DELETE_FIELD,
                'suspended_at': firestore.DELETE_FIELD,
                'activated_by': activated_by,
                'activated_at': datetime.now().isoformat()
            })
            
            # Log activity
            self._log_activity(
                type='user_activated',
                description=f'User {user_id} activated by {activated_by}',
                details={'user_id': user_id}
            )
            
            return {'success': True}
        except Exception as e:
            print(f"Error activating user: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_user(self, user_id, deleted_by):
        """Delete a user (soft delete)"""
        try:
            user_ref = self.users_collection.document(user_id)
            user_ref.update({
                'status': 'deleted',
                'deleted_by': deleted_by,
                'deleted_at': datetime.now().isoformat()
            })
            
            # Log activity
            self._log_activity(
                type='user_deleted',
                description=f'User {user_id} deleted by {deleted_by}',
                details={'user_id': user_id}
            )
            
            return {'success': True}
        except Exception as e:
            print(f"Error deleting user: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===== SYSTEM STATISTICS =====
    
    def get_system_stats(self):
        """Get comprehensive system statistics"""
        try:
            stats = {}
            
            # User statistics
            users = self.users_collection.get()
            total_users = len(users)
            active_users = len([u for u in users if u.to_dict().get('status') == 'active'])
            
            # Users by role
            role_counts = {}
            for user in users:
                role = user.to_dict().get('role', 'unknown')
                role_counts[role] = role_counts.get(role, 0) + 1
            
            # Restaurant statistics
            restaurants = self.restaurants_collection.where('status', '==', 'approved').get()
            total_restaurants = len(restaurants)
            
            # Order statistics (last 24 hours)
            yesterday = datetime.now() - timedelta(days=1)
            recent_orders = self.orders_collection.where(
                'created_at', '>=', yesterday.isoformat()
            ).get()
            
            orders_today = len(recent_orders)
            active_orders = len([o for o in recent_orders if o.to_dict().get('status') in ['pending', 'preparing', 'on_way']])
            
            # Revenue calculation (last 24 hours)
            revenue_today = sum([
                float(order.to_dict().get('total_amount', 0)) 
                for order in recent_orders 
                if order.to_dict().get('status') == 'completed'
            ])
            
            # New users today
            new_users_today = len([
                u for u in users 
                if u.to_dict().get('created_at', '') >= yesterday.isoformat()
            ])
            
            stats = {
                'totalUsers': total_users,
                'activeUsers': active_users,
                'totalRestaurants': total_restaurants,
                'activeOrders': active_orders,
                'ordersToday': orders_today,
                'revenueToday': revenue_today,
                'newUsersToday': new_users_today,
                'roleDistribution': role_counts,
                'userGrowthRate': self._calculate_growth_rate('users'),
                'restaurantGrowthRate': self._calculate_growth_rate('restaurants'),
                'orderGrowthRate': self._calculate_growth_rate('orders'),
                'revenueGrowthRate': self._calculate_growth_rate('revenue')
            }
            
            return {
                'success': True,
                'data': stats
            }
        except Exception as e:
            print(f"Error getting system stats: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_recent_activities(self, limit=10):
        """Get recent system activities"""
        try:
            activities = []
            docs = self.activities_collection.order_by(
                'timestamp', direction=firestore.Query.DESCENDING
            ).limit(limit).get()
            
            for doc in docs:
                activity = doc.to_dict()
                activity['id'] = doc.id
                activities.append(activity)
            
            return {
                'success': True,
                'data': activities
            }
        except Exception as e:
            print(f"Error getting activities: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_system_health(self):
        """Check system health status"""
        try:
            health_status = {
                'database': 'healthy',
                'paymentGateway': 'healthy',
                'emailService': 'warning',  # Example warning
                'fileStorage': 'healthy',
                'databaseDetails': 'Response time: 45ms',
                'paymentDetails': 'Success rate: 99.8%',
                'emailDetails': 'Queue: 234 pending',
                'storageDetails': 'Usage: 45% of quota'
            }
            
            # You can add actual health checks here
            # For now, returning mock data
            
            return {
                'success': True,
                'data': health_status
            }
        except Exception as e:
            print(f"Error checking system health: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===== PLATFORM SETTINGS =====
    
    def get_platform_settings(self):
        """Get platform configuration settings"""
        try:
            doc = self.settings_collection.document('platform_config').get()
            
            if doc.exists:
                settings = doc.to_dict()
            else:
                # Return default settings if none exist
                settings = self._get_default_settings()
                # Save defaults to database
                self.settings_collection.document('platform_config').set(settings)
            
            return {
                'success': True,
                'data': settings
            }
        except Exception as e:
            print(f"Error getting platform settings: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_platform_settings(self, settings, updated_by):
        """Update platform configuration settings"""
        try:
            # Add metadata
            settings['updated_by'] = updated_by
            settings['updated_at'] = datetime.now().isoformat()
            
            # Save to database
            self.settings_collection.document('platform_config').set(settings, merge=True)
            
            # Log activity
            self._log_activity(
                type='settings_updated',
                description=f'Platform settings updated by {updated_by}',
                details={'updated_by': updated_by}
            )
            
            return {'success': True}
        except Exception as e:
            print(f"Error updating platform settings: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===== RESTAURANT MANAGEMENT =====
    
    def get_all_restaurants(self, filters=None):
        """Get all restaurants with optional filtering"""
        try:
            query = self.restaurants_collection
            
            if filters:
                if filters.get('status') and filters['status'] != 'all':
                    query = query.where('status', '==', filters['status'])
            
            restaurants = []
            docs = query.get()
            
            for doc in docs:
                restaurant_data = doc.to_dict()
                restaurant_data['id'] = doc.id
                
                # Apply search filter
                if filters and filters.get('search'):
                    search_term = filters['search'].lower()
                    searchable_text = f"{restaurant_data.get('name', '')} {restaurant_data.get('description', '')}".lower()
                    if search_term not in searchable_text:
                        continue
                
                restaurants.append(restaurant_data)
            
            return {
                'success': True,
                'data': restaurants
            }
        except Exception as e:
            print(f"Error getting restaurants: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===== HELPER METHODS =====
    
    def _log_activity(self, type, description, details=None):
        """Log system activity"""
        try:
            activity = {
                'type': type,
                'description': description,
                'timestamp': datetime.now().isoformat(),
                'details': details or {}
            }
            self.activities_collection.add(activity)
        except Exception as e:
            print(f"Error logging activity: {e}")
    
    def _calculate_growth_rate(self, metric_type):
        """Calculate growth rate for metrics (placeholder)"""
        # This would calculate actual growth rate based on historical data
        # For now, returning mock data
        import random
        return round(random.uniform(-5, 15), 1)
    
    def _get_default_settings(self):
        """Get default platform settings"""
        return {
            'general': {
                'platformName': 'FoodDelivery Pro',
                'supportEmail': 'support@fooddelivery.com',
                'currency': 'USD',
                'timezone': 'UTC',
                'maintenanceMode': False,
                'registrationEnabled': True
            },
            'payments': {
                'paymentGateway': 'stripe',
                'commissionRate': 15,
                'minimumOrderAmount': 10,
                'deliveryFee': 2.99,
                'processingFee': 0.30
            },
            'features': {
                'realTimeTracking': True,
                'ratingsAndReviews': True,
                'loyaltyProgram': False,
                'restaurantAnalytics': True,
                'agentScheduling': True,
                'multiLanguage': False
            },
            'notifications': {
                'emailNotificationsEnabled': True,
                'smsNotificationsEnabled': False,
                'pushNotificationsEnabled': True,
                'orderStatusUpdates': True,
                'promotionalEmails': True,
                'marketingNotifications': False
            },
            'security': {
                'twoFactorAuth': False,
                'sessionTimeout': 24,
                'maxLoginAttempts': 5,
                'passwordMinLength': 8,
                'requireStrongPasswords': True
            },
            'created_at': datetime.now().isoformat()
        }

# Create singleton instance
admin_service = AdminService()