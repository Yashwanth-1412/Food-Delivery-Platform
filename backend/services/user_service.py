from firebase_admin import firestore
from config.firebase import get_db
from utils.validators import validate_user_data

class UserService:
    def __init__(self):
        self.db = get_db()
        self.collection = 'users'
    
    def get_all_users(self):
        """Get all users from the database"""
        try:
            users_ref = self.db.collection(self.collection)
            users = []
            
            for doc in users_ref.stream():
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                users.append(user_data)
            
            return users
        except Exception as e:
            raise Exception(f"Error getting users: {str(e)}")
    
    def get_user_by_id(self, user_id):
        """Get a specific user by ID"""
        try:
            user_ref = self.db.collection(self.collection).document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_data['id'] = user_doc.id
                return user_data
            return None
        except Exception as e:
            raise Exception(f"Error getting user: {str(e)}")
    
    def create_user(self, user_data):
        """Create a new user"""
        try:
            # Validate the data
            validation_result = validate_user_data(user_data)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Prepare user data
            new_user = {
                'name': user_data['name'].strip(),
                'email': user_data['email'].strip().lower(),
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            # Check if email already exists
            existing_user = self.get_user_by_email(user_data['email'])
            if existing_user:
                raise ValueError("A user with this email already exists")
            
            # Add to database
            doc_ref = self.db.collection(self.collection).add(new_user)
            user_id = doc_ref[1].id
            
            # Return the created user with ID
            new_user['id'] = user_id
            return new_user
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    def update_user(self, user_id, update_data):
        """Update an existing user"""
        try:
            # Validate the data
            validation_result = validate_user_data(update_data)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Check if user exists
            if not self.get_user_by_id(user_id):
                raise ValueError("User not found")
            
            # Prepare update data
            filtered_data = {
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            allowed_fields = ['name', 'email']
            for field in allowed_fields:
                if field in update_data:
                    if field == 'email':
                        filtered_data[field] = update_data[field].strip().lower()
                    else:
                        filtered_data[field] = update_data[field].strip()
            
            if len(filtered_data) == 1:  # Only updated_at
                raise ValueError("No valid fields to update")
            
            # Check for email conflicts if email is being updated
            if 'email' in filtered_data:
                existing_user = self.get_user_by_email(filtered_data['email'])
                if existing_user and existing_user['id'] != user_id:
                    raise ValueError("A user with this email already exists")
            
            # Update user
            user_ref = self.db.collection(self.collection).document(user_id)
            user_ref.update(filtered_data)
            
            # Return updated user
            return self.get_user_by_id(user_id)
        except Exception as e:
            raise Exception(f"Error updating user: {str(e)}")
    
    def delete_user(self, user_id):
        """Delete a user"""
        try:
            # Check if user exists
            user = self.get_user_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Delete user
            user_ref = self.db.collection(self.collection).document(user_id)
            user_ref.delete()
            
            return user
        except Exception as e:
            raise Exception(f"Error deleting user: {str(e)}")
    
    def get_user_by_email(self, email):
        """Get user by email address"""
        try:
            users_ref = self.db.collection(self.collection)
            query = users_ref.where('email', '==', email.strip().lower()).limit(1)
            
            for doc in query.stream():
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                return user_data
            
            return None
        except Exception as e:
            raise Exception(f"Error getting user by email: {str(e)}")
    
    def search_users(self, search_term):
        """Search users by name or email"""
        try:
            users_ref = self.db.collection(self.collection)
            all_users = []
            
            for doc in users_ref.stream():
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                all_users.append(user_data)
            
            # Filter users based on search term
            search_term = search_term.lower().strip()
            filtered_users = []
            
            for user in all_users:
                name_match = search_term in user.get('name', '').lower()
                email_match = search_term in user.get('email', '').lower()
                
                if name_match or email_match:
                    filtered_users.append(user)
            
            return filtered_users
        except Exception as e:
            raise Exception(f"Error searching users: {str(e)}")

# Create a singleton instance
user_service = UserService()