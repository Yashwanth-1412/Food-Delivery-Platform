import uuid
from werkzeug.utils import secure_filename
from config.firebase import get_bucket
from utils.validators import validate_image_file

class StorageService:
    def __init__(self):
        self.bucket = get_bucket()
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        self.max_file_size = 5 * 1024 * 1024  # 5MB
    
    def upload_avatar(self, file, uid):
        """Upload user avatar to Firebase Storage"""
        try:
            # Validate file
            validation_result = validate_image_file(file, self.allowed_extensions, self.max_file_size)
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            # Get file extension
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            
            # Generate unique filename
            filename = f"avatars/{uid}/{uuid.uuid4()}.{file_extension}"
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(filename)
            blob.upload_from_file(file, content_type=file.content_type)
            
            # Make the file publicly accessible
            blob.make_public()
            
            # Return the public URL
            return blob.public_url
        except Exception as e:
            raise Exception(f"Error uploading avatar: {str(e)}")
    
    def delete_file(self, file_url):
        """Delete a file from Firebase Storage"""
        try:
            # Extract the file path from the URL
            # This is a simplified approach - you might want to improve this
            if 'googleapis.com' in file_url:
                # Extract the path after the bucket name
                path_start = file_url.find('/o/') + 3
                path_end = file_url.find('?')
                if path_end == -1:
                    path_end = len(file_url)
                
                file_path = file_url[path_start:path_end].replace('%2F', '/')
                
                # Delete the file
                blob = self.bucket.blob(file_path)
                blob.delete()
                
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    def get_file_info(self, file_path):
        """Get file information"""
        try:
            blob = self.bucket.blob(file_path)
            blob.reload()
            
            return {
                'name': blob.name,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created,
                'updated': blob.updated,
                'public_url': blob.public_url
            }
        except Exception as e:
            raise Exception(f"Error getting file info: {str(e)}")

# Create a singleton instance
storage_service = StorageService()