from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin
try:
    cred = credentials.Certificate('firebase-config.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase Admin SDK initialized successfully!")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    db = None

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
    
    return decorated_function

# Basic routes
@app.route('/')
def home():
    return jsonify({
        "message": "🚀 Flask backend with Firebase is running!",
        "status": "healthy",
        "firebase_connected": db is not None
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "firebase_admin": firebase_admin._apps != {},
        "firestore_connected": db is not None
    })

# Authentication routes
@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    try:
        data = request.get_json()
        token = data.get('token') if data else None
        
        if not token:
            return jsonify({'valid': False, 'error': 'No token provided'}), 400
        
        decoded_token = auth.verify_id_token(token)
        return jsonify({
            'valid': True,
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name', decoded_token.get('email', 'User'))
        })
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401

# Protected routes for users
@app.route('/api/users', methods=['GET'])
@require_auth
def get_users():
    try:
        if not db:
            return jsonify({'error': 'Database not connected'}), 500
            
        users_ref = db.collection('users')
        users = []
        for doc in users_ref.stream():
            user_data = doc.to_dict()
            user_data['id'] = doc.id
            users.append(user_data)
        
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['POST'])
@require_auth
def create_user():
    try:
        if not db:
            return jsonify({'error': 'Database not connected'}), 500
            
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        # Add metadata
        data['created_by'] = request.user['uid']
        data['created_at'] = firestore.SERVER_TIMESTAMP
        data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        # Add to Firestore
        doc_ref = db.collection('users').add(data)
        
        return jsonify({
            'message': 'User created successfully',
            'id': doc_ref[1].id,
            'data': {
                'name': data['name'],
                'email': data['email'],
                'created_by': data['created_by']
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    try:
        if not db:
            return jsonify({'error': 'Database not connected'}), 500
            
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Add update metadata
        data['updated_at'] = firestore.SERVER_TIMESTAMP
        data['updated_by'] = request.user['uid']
        
        # Update document
        doc_ref = db.collection('users').document(user_id)
        doc_ref.update(data)
        
        return jsonify({
            'message': 'User updated successfully',
            'id': user_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    try:
        if not db:
            return jsonify({'error': 'Database not connected'}), 500
            
        # Check if document exists
        doc_ref = db.collection('users').document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete document
        doc_ref.delete()
        
        return jsonify({
            'message': 'User deleted successfully',
            'id': user_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User profile routes
@app.route('/api/profile', methods=['GET'])
@require_auth
def get_profile():
    try:
        user_info = {
            'uid': request.user['uid'],
            'email': request.user.get('email'),
            'name': request.user.get('name', request.user.get('email', 'User')),
            'email_verified': request.user.get('email_verified', False)
        }
        return jsonify(user_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

# Development helper routes
@app.route('/api/test')
def test_endpoint():
    from datetime import datetime
    return jsonify({
        "message": "Test endpoint working!",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv('FLASK_ENV', 'production')
    })

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print(f"📁 Firebase config file exists: {os.path.exists('firebase-config.json')}")
    print(f"🔧 Environment: {os.getenv('FLASK_ENV', 'production')}")
    
    app.run(debug=True, port=5000, host='0.0.0.0')