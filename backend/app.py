# Simple CORS fix from the post - Update your backend/app.py

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
from routes.restaurants import restaurants_bp
from routes.customer import customer_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Simple CORS setup as shown in the post
    CORS(app)  # This allows all origins for development
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(restaurants_bp)
    app.register_blueprint(customer_bp)
    
    # Basic routes
    @app.route('/')
    def home():
        return jsonify({
            "message": "🚀 Food Delivery Backend with Customer & Restaurant Management",
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "version": "3.2 - Customer Phase",
            "cors_enabled": True,
            "available_endpoints": {
                "auth": [
                    "POST /api/auth/verify",
                    "GET /api/auth/profile",
                    "GET /api/auth/user",
                    "GET /api/auth/check",
                    "POST /api/auth/refresh"
                ],
                "customer": [
                    "GET /api/customer/restaurants",
                    "GET /api/customer/restaurants/<id>",
                    "GET /api/customer/restaurants/<id>/menu",
                    "POST /api/customer/orders",
                    "GET /api/customer/orders",
                    "GET /api/customer/orders/<id>",
                    "PUT /api/customer/orders/<id>/cancel",
                    "GET/PUT /api/customer/profile",
                    "GET /api/customer/search",
                    "GET /api/customer/cuisines"
                ],
                "restaurants": [
                    "GET/PUT /api/restaurants/profile",
                    "GET/PUT /api/restaurants/settings",
                    "GET/POST /api/restaurants/categories",
                    "PUT/DELETE /api/restaurants/categories/<id>",
                    "GET/POST /api/restaurants/menu-items",
                    "PUT/DELETE /api/restaurants/menu-items/<id>",
                    "GET /api/restaurants/orders",
                    "PUT /api/restaurants/orders/<id>/status"
                ],
                "roles": [
                    "POST /api/roles/assign",
                    "PUT /api/roles/update", 
                    "GET /api/roles/user/<uid>",
                    "GET /api/roles/my-role"
                ]
            }
        })
    
    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "customer_features": "enabled",
            "cors": "enabled_for_all_origins"
        })
    
    # Test endpoint for customer restaurants
    @app.route('/api/test')
    def test_endpoint():
        return jsonify({
            "message": "Test endpoint working",
            "cors_test": "success"
        })
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Food Delivery Backend...")
    print("🌐 CORS enabled for all origins (development mode)")
    print("📍 Available at: http://localhost:5000")
    print("📍 Health check: http://localhost:5000/api/health")
    print("📍 Test endpoint: http://localhost:5000/api/test")
    
    app.run(debug=True, port=5000, host='0.0.0.0')