from firebase_admin import firestore
from config.firebase import get_db
from utils.validators import validate_profile_data

class ProfileService:
    def __init__(self):
        self.db = get_db()
        self.collection = 'profiles'
    
    def get_profile(self, uid):
        """Get user profile by UID"""
        try:
            profile_ref = self.db.collection(self.collection).document(uid)
            profile_doc = profile_ref.get()
            
            if profile_doc.exists:
                return profile_doc.to_dict()
            return None
        except Exception as e:
            raise Exception(f"Error getting profile: {str(e)}")
    
    def create_default_profile(self, uid, user_data):
        """Create a default profile for new users"""
        try:
            profile_data = {
                'uid': uid,
                'email': user_data.get('email'),
                'name': user_data.get('name', user_data.get('email', 'User')),
                'bio': '',
                'phone': '',
                'location': '',
                'avatar_url': '',
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            profile_ref = self.db.collection(self.collection).document(uid)
            profile_ref.set(profile_data)
            
            return profile_data
        except Exception as e:
            raise Exception(f"Error creating profile: {str(e)}")
    
    def update_profile(self, uid, update_data):
        """Update user profile"""
        try:
            # Validate the data
            validation_result = validate_profile_data(update_data)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Prepare update data
            allowed_fields = ['name', 'bio', 'phone', 'location']
            filtered_data = {
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            for field in allowed_fields:
                if field in update_data:
                    filtered_data[field] = update_data[field]
            
            if len(filtered_data) == 1:  # Only updated_at
                raise ValueError("No valid fields to update")
            
            # Update profile
            profile_ref = self.db.collection(self.collection).document(uid)
            profile_ref.update(filtered_data)
            
            return list(filtered_data.keys())
        except Exception as e:
            raise Exception(f"Error updating profile: {str(e)}")
    
    def update_avatar(self, uid, avatar_url):
        """Update user avatar URL"""
        try:
            profile_ref = self.db.collection(self.collection).document(uid)
            profile_ref.update({
                'avatar_url': avatar_url,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            raise Exception(f"Error updating avatar: {str(e)}")
    
    def get_public_profile(self, uid):
        """Get public profile information (limited fields)"""
        try:
            profile = self.get_profile(uid)
            if not profile:
                return None
            
            # Return only public fields
            public_profile = {
                'uid': profile.get('uid'),
                'name': profile.get('name'),
                'bio': profile.get('bio'),
                'location': profile.get('location'),
                'avatar_url': profile.get('avatar_url'),
                'created_at': profile.get('created_at')
            }
            
            return public_profile
        except Exception as e:
            raise Exception(f"Error getting public profile: {str(e)}")

# Create a singleton instance
profile_service = ProfileService()