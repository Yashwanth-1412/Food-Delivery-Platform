from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import configuration
from config.firebase import initialize_firebase

# Import route blueprints
from routes.profile import profile_bp

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    CORS(app)
    
    # Initialize Firebase
    firebase_initialized = initialize_firebase()
    
    # Register blueprints
    app.register_blueprint(profile_bp)
    
    # Basic routes
    @app.route('/')
    def home():
        return jsonify({
            "message": "🚀 Flask backend with Firebase is running!",
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "version": "2.0 - Organized Structure"
        })
    
    @app.route('/api/health')
    def health_check():
        from config.firebase import get_db, get_bucket
        return jsonify({
            "status": "healthy",
            "firebase_connected": firebase_initialized,
            "firestore_connected": get_db() is not None,
            "storage_connected": get_bucket() is not None,
            "environment": os.getenv('FLASK_ENV', 'production')
        })
    
    @app.route('/api/test')
    def test_endpoint():
        from datetime import datetime
        return jsonify({
            "message": "Test endpoint working!",
            "timestamp": datetime.now().isoformat(),
            "environment": os.getenv('FLASK_ENV', 'production'),
            "structure": "organized"
        })
    
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
    
    return app

# Create the app
app = create_app()

if __name__ == '__main__':
    print("🚀 Starting organized Flask server...")
    print(f"📁 Firebase config file exists: {os.path.exists('firebase-config.json')}")
    print(f"🔧 Environment: {os.getenv('FLASK_ENV', 'production')}")
    print("📂 Using organized folder structure")
    
    app.run(debug=True, port=5000, host='0.0.0.0')