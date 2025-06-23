# backend/app.py - Add agent routes
from flask import Flask, jsonify,send_from_directory
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
from routes.agent import agent_bp  # Add agent routes
from routes.payment import payment_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Simple CORS setup for development
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(restaurants_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(agent_bp)  # Register agent routes
    app.register_blueprint(payment_bp)
    
    # Basic routes
    @app.route('/static/uploads/<path:filename>')
    def uploaded_file(filename):
        """Serve uploaded image files"""
        upload_dir = os.path.join(os.getcwd(), 'static', 'uploads')
        return send_from_directory(upload_dir, filename)        
        
    @app.route('/')
    def home():
        return jsonify({
            "message": "🚀 Food Delivery Backend - Full Multi-Role Platform",
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "version": "4.0 - Agent Interface Added",
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
                "agent": [
                    "GET /api/agent/available-orders",
                    "POST /api/agent/orders/<id>/accept",
                    "GET /api/agent/active-orders",
                    "PUT /api/agent/orders/<id>/status",
                    "GET /api/agent/delivery-history",
                    "GET /api/agent/earnings",
                    "GET/PUT /api/agent/profile",
                    "PUT /api/agent/status"
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
            "features_enabled": [
                "customer_ordering",
                "restaurant_management", 
                "agent_delivery",
                "role_based_access"
            ],
            "cors": "enabled_for_all_origins"
        })
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Food Delivery Backend...")
    print("🌐 CORS enabled for all origins (development mode)")
    print("📍 Available at: http://localhost:5000")
    print("📍 Health check: http://localhost:5000/api/health")
    print("✨ Features: Customer, Restaurant, Agent, Admin")
    
    app.run(debug=True, port=5000, host='0.0.0.0')