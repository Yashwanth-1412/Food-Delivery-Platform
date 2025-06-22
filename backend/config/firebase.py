# backend/config/firebase.py
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
            
            # Try different bucket name formats
            bucket_names = [
                'food-delivery2-eafda.appspot.com',
                'food-delivery2-eafda.firebasestorage.app',
                'food-delivery2-eafda'
            ]
            
            # Start with no bucket specified - let Firebase auto-detect
            firebase_admin.initialize_app(cred)
        
        # Initialize services
        print("🔥 Initializing Firestore client...")
        db = firestore.client()
        print(f"✅ Firestore client created: {type(db)}")
        
        print("🔥 Attempting to initialize Storage bucket...")
        
        # Try to get the default bucket first
        try:
            bucket = storage.bucket()
            print(f"✅ Got default bucket: {bucket.name}")
        except Exception as e:
            print(f"❌ Default bucket failed: {e}")
            
            # Try explicit bucket names
            for bucket_name in [
                'food-delivery2-eafda.appspot.com',
                'food-delivery2-eafda.firebasestorage.app'
            ]:
                try:
                    print(f"🔄 Trying bucket: {bucket_name}")
                    bucket = storage.bucket(bucket_name)
                    print(f"✅ Successfully connected to bucket: {bucket.name}")
                    break
                except Exception as bucket_error:
                    print(f"❌ Failed with {bucket_name}: {bucket_error}")
            else:
                print("❌ All bucket attempts failed")
                
                # List available buckets for debugging
                try:
                    from google.cloud import storage as gcs
                    client = gcs.Client()
                    print("📋 Available buckets in your project:")
                    for b in client.list_buckets():
                        print(f"  - {b.name}")
                except Exception as list_error:
                    print(f"❌ Could not list buckets: {list_error}")
                
                return False
        
        # Test the bucket connection if we have one
        if bucket:
            try:
                # Try to list some files to test bucket access
                blobs = list(bucket.list_blobs(max_results=1))
                print("✅ Storage bucket connection test successful!")
            except Exception as storage_error:
                print(f"⚠️  Storage bucket access test failed: {storage_error}")
        
        # Test Firestore connection
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