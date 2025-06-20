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
        print("🔥 Attempting to initialize Firebase...")
        
        # Check if service account file exists
        if not os.path.exists('firebase-config.json'):
            print("❌ firebase-config.json not found!")
            return False
        
        # Check if Firebase is already initialized
        try:
            firebase_admin.get_app()
            print("⚠️  Firebase already initialized, getting existing services...")
        except ValueError:
            # Firebase not initialized yet, initialize it
            print("🔥 Initializing Firebase for the first time...")
            cred = credentials.Certificate('firebase-config.json')
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'food-delivery2-eafda.appspot.com'
            })
        
        # Initialize services
        print("🔥 Initializing Firestore client...")
        db = firestore.client()
        print(f"✅ Firestore client created: {type(db)}")
        
        print("🔥 Initializing Storage bucket...")
        bucket = storage.bucket()
        print(f"✅ Storage bucket created: {type(bucket)}")
        
        # Test the connection
        print("🧪 Testing Firestore connection...")
        test_collection = db.collection('_test')
        print("✅ Firestore connection successful!")
        
        print("✅ Firebase Admin SDK initialized successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        print(f"❌ Current working directory: {os.getcwd()}")
        print(f"❌ Firebase config exists: {os.path.exists('firebase-config.json')}")
        import traceback
        traceback.print_exc()
        return False

def get_db():
    """Get Firestore database client"""
    global db
    if db is None:
        print("⚠️  Warning: get_db() called but db is None")
        print("🔄 Attempting to reinitialize Firebase...")
        initialize_firebase()
    return db

def get_bucket():
    """Get Firebase Storage bucket"""
    global bucket
    if bucket is None:
        print("⚠️  Warning: get_bucket() called but bucket is None")
        print("🔄 Attempting to reinitialize Firebase...")
        initialize_firebase()
    return bucket

def get_auth():
    """Get Firebase Auth service"""
    return auth