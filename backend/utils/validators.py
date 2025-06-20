import re
from werkzeug.datastructures import FileStorage

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # Check if it's a valid length (7-15 digits)
    return 7 <= len(digits_only) <= 15

def validate_profile_data(data):
    """Validate profile update data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Validate name
    if 'name' in data:
        name = data['name'].strip()
        if not name or len(name) < 2:
            return {'valid': False, 'error': 'Name must be at least 2 characters long'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Name must be less than 100 characters'}
    
    # Validate bio
    if 'bio' in data:
        bio = data['bio']
        if len(bio) > 500:
            return {'valid': False, 'error': 'Bio must be less than 500 characters'}
    
    # Validate phone
    if 'phone' in data:
        if not validate_phone(data['phone']):
            return {'valid': False, 'error': 'Invalid phone number format'}
    
    # Validate location
    if 'location' in data:
        location = data['location']
        if len(location) > 200:
            return {'valid': False, 'error': 'Location must be less than 200 characters'}
    
    return {'valid': True}

def validate_image_file(file, allowed_extensions, max_size):
    """Validate uploaded image file"""
    if not isinstance(file, FileStorage):
        return {'valid': False, 'error': 'Invalid file object'}
    
    if file.filename == '':
        return {'valid': False, 'error': 'No file selected'}
    
    # Check file extension
    if '.' not in file.filename:
        return {'valid': False, 'error': 'File must have an extension'}
    
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    if file_extension not in allowed_extensions:
        return {'valid': False, 'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions).upper()}'}
    
    # Check file size
    file.seek(0, 2)  # Seek to end of file
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        return {'valid': False, 'error': f'File size must be less than {max_size_mb}MB'}
    
    # Check if it's actually an image (basic check)
    if not file.content_type or not file.content_type.startswith('image/'):
        return {'valid': False, 'error': 'File must be an image'}
    
    return {'valid': True}

def validate_user_data(data):
    """Validate user creation/update data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Validate required fields for creation
    if 'name' not in data or not data['name'].strip():
        return {'valid': False, 'error': 'Name is required'}
    
    if 'email' not in data or not data['email'].strip():
        return {'valid': False, 'error': 'Email is required'}
    
    # Validate email format
    if not validate_email(data['email']):
        return {'valid': False, 'error': 'Invalid email format'}
    
    # Validate name length
    name = data['name'].strip()
    if len(name) < 2:
        return {'valid': False, 'error': 'Name must be at least 2 characters long'}
    if len(name) > 100:
        return {'valid': False, 'error': 'Name must be less than 100 characters'}
    
    return {'valid': True}