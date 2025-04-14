import os
import secrets
from datetime import timedelta

# Base directory of the application
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUDENT_DATA_FILE = os.path.join(BASE_DIR, "students.xlsx")


class Config:
    """Base configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
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

    # Email settings
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "True").lower() in [
        "true",
        "1",
        "yes",
    ]
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")

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
