from datetime import datetime
import os
from bson import ObjectId
from werkzeug.utils import secure_filename
from flask import current_app
from PIL import Image
import uuid


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


def save_uploaded_file(
    file, folder_path, filename=None, optimize=True, max_size=(800, 800)
):
    """
    Save an uploaded file with proper security measures.

    Args:
        file: The uploaded file object
        folder_path: Path to save the file
        filename: Optional custom filename, otherwise secure random name is generated
        optimize: Whether to optimize image files
        max_size: Maximum dimensions for image resizing

    Returns:
        The path to the saved file relative to the application
    """
    # Ensure the folder exists
    os.makedirs(folder_path, exist_ok=True)

    # Secure the filename and make it unique
    if filename:
        filename = secure_filename(filename)
    else:
        ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
        filename = f"{uuid.uuid4()}.{ext}"

    filepath = os.path.join(folder_path, filename)

    # Check if it's an image that can be optimized
    if optimize and ext.lower() in ["jpg", "jpeg", "png", "gif"]:
        try:
            img = Image.open(file)

            # Resize if larger than max_size while maintaining aspect ratio
            img.thumbnail(max_size)

            # Convert to RGB if needed
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Save with optimization
            img.save(filepath, optimize=True, quality=85)
        except Exception as e:
            current_app.logger.error(f"Error processing image: {str(e)}")
            # Fall back to normal save
            file.save(filepath)
    else:
        # Save file normally
        file.save(filepath)

    # Return the relative path
    return os.path.relpath(filepath, current_app.config["UPLOAD_FOLDER"])


def to_json_serializable(obj):
    """Convert MongoDB data types to JSON serializable types."""
    if isinstance(obj, dict):
        return {k: to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_json_serializable(i) for i in obj]
    elif hasattr(obj, "isoformat"):  # datetime objects
        return obj.isoformat()
    elif hasattr(obj, "_id"):  # MongoDB ObjectId
        return str(obj._id)
    else:
        return obj


def mongo_to_json_serializable(obj):
    """
    Convert MongoDB document to JSON serializable format by:
    - Converting ObjectId to string
    - Converting datetime to ISO format string
    - Handling nested documents and arrays
    """
    if isinstance(obj, dict):
        # Handle dictionaries
        return {k: mongo_to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        # Handle lists
        return [mongo_to_json_serializable(item) for item in obj]
    elif isinstance(obj, ObjectId):
        # Convert ObjectId to string
        return str(obj)
    elif isinstance(obj, datetime):
        # Convert datetime to ISO format
        return obj.isoformat()
    else:
        # Return everything else as is
        return obj
