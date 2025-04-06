from datetime import datetime
import bcrypt
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
)
import os
import re
import html


def generate_password_hash(password):
    """Generate a secure password hash."""
    if isinstance(password, str):
        password = password.encode("utf-8")
    return bcrypt.hashpw(password, bcrypt.gensalt())


def check_password_hash(password, hashed):
    """Check if a password matches the hash."""
    try:
        # Make sure password is bytes
        if isinstance(password, str):
            password = password.encode("utf-8")

        # Make sure hashed is bytes
        if isinstance(hashed, str):
            hashed = hashed.encode("utf-8")

        return bcrypt.checkpw(password, hashed)
    except Exception as e:
        print(f"Password verification error: {str(e)}")
        return False


def create_tokens(identity):
    """Create access and refresh tokens."""
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    return access_token, refresh_token


def sanitize_input(input_string):
    """Sanitize user input to prevent XSS attacks."""
    if not isinstance(input_string, str):
        return input_string
    return html.escape(input_string)


def validate_email(email):
    """Validate email format."""
    email_pattern = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
    return bool(email_pattern.match(email))


def get_client_ip():
    """Get client IP address."""
    if request.environ.get("HTTP_X_FORWARDED_FOR"):
        return request.environ["HTTP_X_FORWARDED_FOR"]
    return request.environ.get("REMOTE_ADDR")


def log_security_event(event_type, user=None, details=None):
    """Log security-related events."""
    from app.models.base import db

    if details is None:
        details = {}

    event = {
        "type": event_type,
        "timestamp": datetime.now(),
        "ip": get_client_ip(),
        "user": user,
        **details,
    }

    security_logs = db.security_logs
    security_logs.insert_one(event)
