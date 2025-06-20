import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import os

# Global variables for Firebase services
db = None
bucket = None

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global db, bucket
    
    try:
        # Initialize Firebase Admin with service account
        cred = credentials.Certificate('firebase-config.json')
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'your-project-id.appspot.com'  # Replace with your bucket name
        })
        
        # Initialize services
        db = firestore.client()
        bucket = storage.bucket()
        
        print("✅ Firebase Admin SDK initialized successfully!")
        return True
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return False

def get_db():
    """Get Firestore database client"""
    return db

def get_bucket():
    """Get Firebase Storage bucket"""
    return bucket

def get_auth():
    """Get Firebase Auth service"""
    return auth