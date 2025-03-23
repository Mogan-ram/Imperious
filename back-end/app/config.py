import os
import secrets
from datetime import timedelta

# Base directory of the application
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUDENT_DATA_FILE = os.path.join(BASE_DIR, "students.xlsx")


class Config:
    """Base configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(24))
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # Upload settings
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "app", "static", "uploads", "projects")
    NEWS_EVENTS_UPLOAD_FOLDER = os.path.join(
        BASE_DIR, "app", "static", "uploads", "news_events"
    )
    PROFILE_PHOTOS_FOLDER = os.path.join(
        BASE_DIR, "app", "static", "uploads", "profile_photos"
    )
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # MONGODB settings
    MONGODB_SETTINGS = {
        "host": os.environ.get("MONGODB_URI", "mongodb://localhost:27017/imperious")
    }

    # Other settings
    ALLOWED_EXTENSIONS = {
        "txt",
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "md",
        "py",
        "js",
        "html",
        "css",
        "json",
        "doc",
        "docx",
        "zip",
        "rar",
        "java",
        "cpp",
        "h",
        "c",
    }

    # Student data file
    STUDENT_DATA_FILE = os.path.join(BASE_DIR, "students.xlsx")


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True


# Add this class which was missing
class DefaultConfig(DevelopmentConfig):
    """Default configuration (same as development)."""

    pass


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    DEBUG = True
    # Use a separate test database
    MONGODB_SETTINGS = {
        "host": os.environ.get(
            "MONGODB_TEST_URI", "mongodb://localhost:27017/imperious_test"
        )
    }


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    # More secure settings for production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True
