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

# Add these functions to your existing backend/utils/validators.py file

def validate_restaurant_data(data, is_update=False):
    """Validate restaurant profile data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Required fields for creation
    if not is_update:
        if 'restaurant_name' not in data or not data['restaurant_name'].strip():
            return {'valid': False, 'error': 'Restaurant name is required'}
    
    # Validate restaurant name
    if 'restaurant_name' in data:
        name = data['restaurant_name'].strip()
        if len(name) < 2:
            return {'valid': False, 'error': 'Restaurant name must be at least 2 characters long'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Restaurant name must be less than 100 characters'}
    
    # Validate email if provided
    if 'email' in data and data['email']:
        if not validate_email(data['email']):
            return {'valid': False, 'error': 'Invalid email format'}
    
    # Validate phone if provided
    if 'phone' in data and data['phone']:
        if not validate_phone(data['phone']):
            return {'valid': False, 'error': 'Invalid phone number format'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 1000:
            return {'valid': False, 'error': 'Description must be less than 1000 characters'}
    
    # Validate address
    if 'address' in data:
        address = data['address']
        if len(address) > 500:
            return {'valid': False, 'error': 'Address must be less than 500 characters'}
    
    # Validate cuisine type
    if 'cuisine_type' in data:
        cuisine = data['cuisine_type']
        if len(cuisine) > 100:
            return {'valid': False, 'error': 'Cuisine type must be less than 100 characters'}
    
    return {'valid': True}

def validate_menu_category_data(data, is_update=False):
    """Validate menu category data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Required fields for creation
    if not is_update:
        if 'name' not in data or not data['name'].strip():
            return {'valid': False, 'error': 'Category name is required'}
    
    # Validate category name
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 2:
            return {'valid': False, 'error': 'Category name must be at least 2 characters long'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Category name must be less than 100 characters'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 500:
            return {'valid': False, 'error': 'Description must be less than 500 characters'}
    
    # Validate sort order
    if 'sort_order' in data:
        try:
            sort_order = int(data['sort_order'])
            if sort_order < 0:
                return {'valid': False, 'error': 'Sort order must be a positive number'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Sort order must be a valid number'}
    
    # Validate is_active
    if 'is_active' in data:
        if not isinstance(data['is_active'], bool):
            return {'valid': False, 'error': 'is_active must be a boolean value'}
    
    return {'valid': True}

def validate_menu_item_data(data, is_update=False):
    """Validate menu item data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Required fields for creation
    if not is_update:
        required_fields = ['name', 'price']
        if not is_update:
            required_fields.append('category_id')
        
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return {'valid': False, 'error': f'{field} is required'}
    
    # Validate item name
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 2:
            return {'valid': False, 'error': 'Item name must be at least 2 characters long'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Item name must be less than 100 characters'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 1000:
            return {'valid': False, 'error': 'Description must be less than 1000 characters'}
    
    # Validate price
    if 'price' in data:
        try:
            price = float(data['price'])
            if price < 0:
                return {'valid': False, 'error': 'Price must be a positive number'}
            if price > 10000:  # Reasonable max price
                return {'valid': False, 'error': 'Price must be less than 10,000'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Price must be a valid number'}
    
    # Validate prep time
    if 'prep_time' in data:
        try:
            prep_time = int(data['prep_time'])
            if prep_time < 1:
                return {'valid': False, 'error': 'Prep time must be at least 1 minute'}
            if prep_time > 300:  # 5 hours max
                return {'valid': False, 'error': 'Prep time must be less than 300 minutes'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Prep time must be a valid number'}
    
    # Validate sort order
    if 'sort_order' in data:
        try:
            sort_order = int(data['sort_order'])
            if sort_order < 0:
                return {'valid': False, 'error': 'Sort order must be a positive number'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Sort order must be a valid number'}
    
    # Validate boolean fields
    boolean_fields = ['is_vegetarian', 'is_vegan', 'is_available']
    for field in boolean_fields:
        if field in data and not isinstance(data[field], bool):
            return {'valid': False, 'error': f'{field} must be a boolean value'}
    
    # Validate arrays
    array_fields = ['ingredients', 'allergens']
    for field in array_fields:
        if field in data:
            if not isinstance(data[field], list):
                return {'valid': False, 'error': f'{field} must be an array'}
            # Validate each item in array
            for item in data[field]:
                if not isinstance(item, str):
                    return {'valid': False, 'error': f'Each item in {field} must be a string'}
                if len(item.strip()) == 0:
                    return {'valid': False, 'error': f'Empty items not allowed in {field}'}
    
    # Validate image URL
    if 'image_url' in data:
        image_url = data['image_url']
        if image_url and len(image_url) > 1000:
            return {'valid': False, 'error': 'Image URL must be less than 1000 characters'}
    
    return {'valid': True}
# Add these functions to your existing backend/utils/validators.py file

def validate_restaurant_basic_info(data):
    """Validate restaurant basic info"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Validate restaurant name
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 2:
            return {'valid': False, 'error': 'Restaurant name must be at least 2 characters long'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Restaurant name must be less than 100 characters'}
    
    # Validate email if provided
    if 'email' in data and data['email']:
        if not validate_email(data['email']):
            return {'valid': False, 'error': 'Invalid email format'}
    
    # Validate phone if provided
    if 'phone' in data and data['phone']:
        if not validate_phone(data['phone']):
            return {'valid': False, 'error': 'Invalid phone number format'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 1000:
            return {'valid': False, 'error': 'Description must be less than 1000 characters'}
    
    # Validate address
    if 'address' in data:
        address = data['address']
        if len(address) > 500:
            return {'valid': False, 'error': 'Address must be less than 500 characters'}
    
    return {'valid': True}

def validate_menu_category(data):
    """Validate menu category data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Validate category name
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 1:
            return {'valid': False, 'error': 'Category name is required'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Category name must be less than 100 characters'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 500:
            return {'valid': False, 'error': 'Description must be less than 500 characters'}
    
    # Validate sort order
    if 'sort_order' in data:
        try:
            sort_order = int(data['sort_order'])
            if sort_order < 0:
                return {'valid': False, 'error': 'Sort order must be a positive number'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Sort order must be a valid number'}
    
    return {'valid': True}

def validate_menu_item(data):
    """Validate menu item data"""
    if not isinstance(data, dict):
        return {'valid': False, 'error': 'Data must be a dictionary'}
    
    # Validate item name
    if 'name' in data:
        name = data['name'].strip()
        if len(name) < 1:
            return {'valid': False, 'error': 'Item name is required'}
        if len(name) > 100:
            return {'valid': False, 'error': 'Item name must be less than 100 characters'}
    
    # Validate description
    if 'description' in data:
        description = data['description']
        if len(description) > 1000:
            return {'valid': False, 'error': 'Description must be less than 1000 characters'}
    
    # Validate price
    if 'price' in data:
        try:
            price = float(data['price'])
            if price < 0:
                return {'valid': False, 'error': 'Price must be a positive number'}
            if price > 10000:
                return {'valid': False, 'error': 'Price must be reasonable (less than 10,000)'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Price must be a valid number'}
    
    # Validate prep time
    if 'prep_time' in data:
        try:
            prep_time = int(data['prep_time'])
            if prep_time < 1:
                return {'valid': False, 'error': 'Prep time must be at least 1 minute'}
            if prep_time > 300:
                return {'valid': False, 'error': 'Prep time must be less than 300 minutes'}
        except (ValueError, TypeError):
            return {'valid': False, 'error': 'Prep time must be a valid number'}
    
    # Validate ingredients array
    if 'ingredients' in data:
        if not isinstance(data['ingredients'], list):
            return {'valid': False, 'error': 'Ingredients must be an array'}
        for ingredient in data['ingredients']:
            if not isinstance(ingredient, str) or not ingredient.strip():
                return {'valid': False, 'error': 'Each ingredient must be a non-empty string'}
    
    # Validate allergens array
    if 'allergens' in data:
        if not isinstance(data['allergens'], list):
            return {'valid': False, 'error': 'Allergens must be an array'}
        for allergen in data['allergens']:
            if not isinstance(allergen, str) or not allergen.strip():
                return {'valid': False, 'error': 'Each allergen must be a non-empty string'}
    
    return {'valid': True}

def validate_password(password):
    """Validate password"""
    if len(password) < 6:
        return {'valid': False, 'error': 'Password must be at least 6 characters long'}
    if len(password) > 100:
        return {'valid': False, 'error': 'Password must be less than 100 characters'}
    return {'valid': True}
