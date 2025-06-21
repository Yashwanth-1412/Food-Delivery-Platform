from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Firebase FIRST - before any other imports
from config.firebase import initialize_firebase
print("🔥 Initializing Firebase before importing services...")
firebase_initialized = initialize_firebase()

if not firebase_initialized:
    print("❌ Failed to initialize Firebase - exiting")
    exit(1)

# NOW import everything else - Firebase is ready
from routes.profile import profile_bp
from routes.users import users_bp
from routes.auth import auth_bp
from routes.roles import roles_bp
from routes.restaurants import restaurants_bp  # NEW!

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173"])
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(restaurants_bp)  # NEW!
    
    # Basic routes
    @app.route('/')
    def home():
        return jsonify({
            "message": "🚀 Food Delivery Backend with Restaurant Management",
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "version": "3.1 - Restaurant Phase",
            "roles": {
                "customer": "Can browse menus and place orders",
                "agent": "Can accept and deliver orders", 
                "restaurant": "Can manage menu and restaurant orders",
                "admin": "Full system access and management"
            },
            "available_endpoints": {
                "auth": [
                    "POST /api/auth/verify",
                    "GET /api/auth/profile",
                    "GET /api/auth/user",
                    "GET /api/auth/check",
                    "POST /api/auth/refresh"
                ],
                "users": [
                    "GET /api/users",
                    "POST /api/users",
                    "GET /api/users/<id>",
                    "PUT /api/users/<id>",
                    "DELETE /api/users/<id>",
                    "GET /api/users/email/<email>"
                ],
                "profile": [
                    "GET /api/profile",
                    "PUT /api/profile",
                    "POST /api/profile/avatar",
                    "GET /api/profile/<user_id>"
                ],
                "roles": [
                    "POST /api/roles/assign",
                    "PUT /api/roles/update", 
                    "GET /api/roles/user/<uid>",
                    "GET /api/roles/my-role",
                    "GET /api/roles/by-role/<role>",
                    "GET /api/roles/permissions",
                    "GET /api/roles/statistics",
                    "POST /api/roles/check-permission",
                    "GET /api/roles/role-data",
                    "PUT /api/roles/role-data",
                    "DELETE /api/roles/remove/<uid>"
                ],
                "restaurants": [
                    "GET/PUT /api/restaurants/profile",
                    "GET/PUT /api/restaurants/settings",
                    "GET/POST /api/restaurants/categories",
                    "PUT/DELETE /api/restaurants/categories/<id>",
                    "GET/POST /api/restaurants/menu-items",
                    "PUT/DELETE /api/restaurants/menu-items/<id>",
                    "PUT /api/restaurants/menu-items/<id>/toggle",
                    "GET /api/restaurants/orders",
                    "PUT /api/restaurants/orders/<id>/status",
                    "GET /api/restaurants/stats",
                    "GET /api/restaurants/analytics",
                    "POST /api/restaurants/upload-image"
                ]
            }
        })
    
    @app.route('/api/health')
    def health_check():
        from config.firebase import get_db, get_bucket
        return jsonify({
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "firestore_connected": get_db() is not None,
            "storage_connected": get_bucket() is not None,
            "environment": os.getenv('FLASK_ENV', 'production'),
            "restaurant_features": "enabled"
        })
    
    @app.route('/api/setup-demo-restaurant', methods=['POST'])
    def setup_demo_restaurant():
        """Setup demo restaurant data for testing (remove in production)"""
        try:
            from services.role_service import role_service
            from services.restaurant_service import restaurant_service
            from models.roles import UserRole
            
            # Create demo restaurant user
            demo_uid = 'demo_restaurant_123'
            
            # Assign restaurant role
            role_service.assign_role(demo_uid, UserRole.RESTAURANT)
            
            # Create restaurant profile
            restaurant_data = {
                'restaurant_name': 'Demo Pizza Palace',
                'cuisine_type': 'Italian',
                'description': 'Authentic Italian pizza and pasta',
                'address': '123 Main St, Demo City',
                'phone': '+1234567890',
                'email': 'demo@pizzapalace.com'
            }
            
            restaurant_profile = restaurant_service.create_restaurant_profile(demo_uid, restaurant_data)
            
            # Create demo categories
            categories_data = [
                {'name': 'Pizzas', 'description': 'Delicious wood-fired pizzas'},
                {'name': 'Pasta', 'description': 'Fresh homemade pasta dishes'},
                {'name': 'Beverages', 'description': 'Refreshing drinks'}
            ]
            
            created_categories = []
            for cat_data in categories_data:
                category = restaurant_service.create_menu_category(demo_uid, cat_data)
                created_categories.append(category)
            
            # Create demo menu items
            if created_categories:
                pizza_category_id = created_categories[0]['id']
                pasta_category_id = created_categories[1]['id']
                
                menu_items_data = [
                    {
                        'category_id': pizza_category_id,
                        'name': 'Margherita Pizza',
                        'description': 'Classic tomato, mozzarella, and basil',
                        'price': 12.99,
                        'is_vegetarian': True,
                        'prep_time': 15
                    },
                    {
                        'category_id': pizza_category_id,
                        'name': 'Pepperoni Pizza',
                        'description': 'Pepperoni and mozzarella cheese',
                        'price': 15.99,
                        'prep_time': 15
                    },
                    {
                        'category_id': pasta_category_id,
                        'name': 'Spaghetti Carbonara',
                        'description': 'Creamy pasta with bacon and parmesan',
                        'price': 14.99,
                        'prep_time': 20
                    }
                ]
                
                created_items = []
                for item_data in menu_items_data:
                    item = restaurant_service.create_menu_item(demo_uid, item_data)
                    created_items.append(item)
            
            return jsonify({
                'success': True,
                'message': 'Demo restaurant created successfully!',
                'data': {
                    'restaurant_uid': demo_uid,
                    'restaurant_profile': restaurant_profile,
                    'categories_count': len(created_categories),
                    'menu_items_count': len(created_items) if 'created_items' in locals() else 0
                },
                'warning': 'Remove this endpoint in production!'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad request'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'error': 'Unauthorized'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'error': 'Forbidden'
        }), 403
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Food Delivery Backend with Restaurant Features...")
    print(f"📁 Firebase config file exists: {os.path.exists('firebase-config.json')}")
    print(f"🔧 Environment: {os.getenv('FLASK_ENV', 'production')}")
    print("✅ Firebase initialized before service imports")
    print("✅ All routes registered successfully")
    print("🏪 Restaurant management endpoints ready!")
    
    app.run(debug=True, port=5000, host='0.0.0.0')