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

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(roles_bp)
    
    # Basic routes
    @app.route('/')
    def home():
        return jsonify({
            "message": "🚀 Food Delivery Backend with Role-Based Access Control",
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "version": "3.0 - Simple Init Pattern",
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
            "initialization": "simple_pattern"
        })
    
    @app.route('/api/setup-demo-user', methods=['POST'])
    def setup_demo_user():
        """Setup demo users for testing (remove in production)"""
        try:
            from services.role_service import role_service
            from models.roles import UserRole
            
            # This is just for demo - remove in production
            demo_users = [
                {'uid': 'demo_customer', 'role': UserRole.CUSTOMER},
                {'uid': 'demo_agent', 'role': UserRole.AGENT},
                {'uid': 'demo_restaurant', 'role': UserRole.RESTAURANT},
                {'uid': 'demo_admin', 'role': UserRole.ADMIN}
            ]
            
            created_users = []
            for user in demo_users:
                role_service.assign_role(user['uid'], user['role'])
                created_users.append({
                    'uid': user['uid'],
                    'role': user['role'].value
                })
            
            return jsonify({
                'success': True,
                'message': 'Demo users created',
                'users': created_users,
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
    print("🚀 Starting Food Delivery Backend...")
    print(f"📁 Firebase config file exists: {os.path.exists('firebase-config.json')}")
    print(f"🔧 Environment: {os.getenv('FLASK_ENV', 'production')}")
    print("✅ Firebase initialized before service imports")
    print("✅ All routes registered successfully")
    
    app.run(debug=True, port=5000, host='0.0.0.0')