# backend/services/storage_service.py
import uuid
import os
from werkzeug.utils import secure_filename
from utils.validators import validate_image_file

class StorageService:
    def __init__(self):
        # Use local storage for images only
        self.upload_dir = 'static/uploads'
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        
        # Create upload directories for images
        os.makedirs(f'{self.upload_dir}/menu_items', exist_ok=True)
        os.makedirs(f'{self.upload_dir}/avatars', exist_ok=True)
        
        print("✅ Local image storage initialized")
        print(f"📁 Upload directory: {os.path.abspath(self.upload_dir)}")
    
    def upload_menu_item_image(self, file, item_id):
        """Upload menu item image to local storage"""
        try:
            print(f"🔄 Uploading image for item: {item_id}")
            
            # Validate file
            validation_result = validate_image_file(file, self.allowed_extensions, self.max_file_size)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Get file extension
            if '.' in file.filename:
                file_extension = file.filename.rsplit('.', 1)[1].lower()
            else:
                raise ValueError("File must have an extension")
            
            # Generate unique filename
            filename = f"{item_id}_{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(self.upload_dir, 'menu_items', filename)
            
            print(f"💾 Saving file to: {file_path}")
            
            # Save file locally
            file.seek(0)  # Reset file pointer
            file.save(file_path)
            
            # Verify file was saved
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"✅ File saved successfully: {file_size} bytes")
            else:
                raise Exception("File was not saved properly")
            
            # Return local URL
            image_url = f"http://localhost:5000/static/uploads/menu_items/{filename}"
            print(f"🔗 Image URL: {image_url}")
            return image_url
                
        except Exception as e:
            print(f"❌ Error uploading menu item image: {str(e)}")
            raise Exception(f"Error uploading menu item image: {str(e)}")
    
    def upload_avatar(self, file, uid):
        """Upload user avatar to local storage"""
        try:
            print(f"🔄 Uploading avatar for user: {uid}")
            
            # Validate file
            validation_result = validate_image_file(file, self.allowed_extensions, self.max_file_size)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Get file extension
            if '.' in file.filename:
                file_extension = file.filename.rsplit('.', 1)[1].lower()
            else:
                raise ValueError("File must have an extension")
            
            # Generate unique filename
            filename = f"{uid}_{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(self.upload_dir, 'avatars', filename)
            
            print(f"💾 Saving avatar to: {file_path}")
            
            # Save file locally
            file.seek(0)  # Reset file pointer
            file.save(file_path)
            
            # Verify file was saved
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"✅ Avatar saved successfully: {file_size} bytes")
            else:
                raise Exception("Avatar was not saved properly")
            
            # Return local URL
            avatar_url = f"http://localhost:5000/static/uploads/avatars/{filename}"
            print(f"🔗 Avatar URL: {avatar_url}")
            return avatar_url
                
        except Exception as e:
            print(f"❌ Error uploading avatar: {str(e)}")
            raise Exception(f"Error uploading avatar: {str(e)}")
    
    def delete_file(self, file_url):
        """Delete a file from local storage"""
        try:
            if 'localhost:5000/static/uploads' in file_url:
                # Extract filename from URL
                filename = file_url.split('/static/uploads/')[-1]
                file_path = os.path.join(self.upload_dir, filename)
                
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"🗑️ Deleted file: {file_path}")
                    return True
            return False
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    def get_file_info(self, file_path):
        """Get file information for local files"""
        try:
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                return {
                    'name': os.path.basename(file_path),
                    'size': stat.st_size,
                    'created': stat.st_ctime,
                    'updated': stat.st_mtime,
                    'path': file_path
                }
            return None
        except Exception as e:
            raise Exception(f"Error getting file info: {str(e)}")

    # Add this to backend/services/storage_service.py

    def upload_restaurant_logo(self, file, restaurant_id):
        """Upload restaurant logo to local storage"""
        try:
            print(f"🔄 Uploading logo for restaurant: {restaurant_id}")
            
            # Create restaurant logos directory
            os.makedirs(f'{self.upload_dir}/restaurant_logos', exist_ok=True)
            
            # Validate file
            validation_result = validate_image_file(file, self.allowed_extensions, self.max_file_size)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Get file extension
            if '.' in file.filename:
                file_extension = file.filename.rsplit('.', 1)[1].lower()
            else:
                raise ValueError("File must have an extension")
            
            # Generate unique filename
            filename = f"logo_{restaurant_id}_{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(self.upload_dir, 'restaurant_logos', filename)
            
            print(f"💾 Saving logo to: {file_path}")
            
            # Save file locally
            file.seek(0)  # Reset file pointer
            file.save(file_path)
            
            # Verify file was saved
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"✅ Logo saved successfully: {file_size} bytes")
            else:
                raise Exception("Logo file was not saved properly")
            
            # Return local URL
            logo_url = f"http://localhost:5000/static/uploads/restaurant_logos/{filename}"
            print(f"🔗 Logo URL: {logo_url}")
            return logo_url
                
        except Exception as e:
            print(f"❌ Error uploading restaurant logo: {str(e)}")
            raise Exception(f"Error uploading restaurant logo: {str(e)}")

# Create a singleton instance
storage_service = StorageService()