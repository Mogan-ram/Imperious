import re
from bson import ObjectId
from app.utils.security import sanitize_input

def validate_object_id(id_str):
    """Validate that a string is a valid MongoDB ObjectId."""
    try:
        return ObjectId.is_valid(id_str)
    except:
        return False

def validate_user_input(data, required_fields=None, max_lengths=None, field_types=None):
    """
    Validate user input based on various criteria.
    
    Args:
        data: Dictionary of user input
        required_fields: List of required field names
        max_lengths: Dictionary mapping field names to maximum lengths
        field_types: Dictionary mapping field names to expected types
    
    Returns:
        (bool, str): Tuple of (is_valid, error_message)
    """
    # Sanitize all string inputs to prevent XSS
    sanitized_data = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized_data[key] = sanitize_input(value)
        else:
            sanitized_data[key] = value
    
    # Check required fields
    if required_fields:
        for field in required_fields:
            if field not in sanitized_data or sanitized_data[field] is None:
                return False, f"{field} is required"
    
    # Check maximum lengths
    if max_lengths:
        for field, max_length in max_lengths.items():
            if field in sanitized_data and isinstance(sanitized_data[field], str):
                if len(sanitized_data[field]) > max_length:
                    return False, f"{field} exceeds maximum length of {max_length}"
    
    # Check field types
    if field_types:
        for field, expected_type in field_types.items():
            if field in sanitized_data and sanitized_data[field] is not None:
                if expected_type == 'email':
                    if not validate_email(sanitized_data[field]):
                        return False, f"{field} must be a valid email address"
                elif expected_type == 'int':
                    try:
                        int(sanitized_data[field])
                    except (ValueError, TypeError):
                        return False, f"{field} must be a valid integer"
                elif expected_type == 'float':
                    try:
                        float(sanitized_data[field])
                    except (ValueError, TypeError):
                        return False, f"{field} must be a valid number"
                elif expected_type == 'objectid':
                    if not validate_object_id(sanitized_data[field]):
                        return False, f"{field} must be a valid ObjectId"
                elif not isinstance(sanitized_data[field], expected_type):
                    return False, f"{field} must be of type {expected_type.__name__}"
    
    return True, ""

def validate_email(email):
    """Validate email format."""
    email_pattern = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')
    return bool(email_pattern.match(email))

def validate_file_type(filename, allowed_extensions=None):
    """
    Validate that a file has an allowed extension.
    
    Args:
        filename: Name of the file to validate
        allowed_extensions: Set of allowed extensions (defaults to app config)
    
    Returns:
        bool: True if file type is allowed, False otherwise
    """
    if not allowed_extensions:
        from flask import current_app
        allowed_extensions = current_app.config['ALLOWED_EXTENSIONS']
    
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions