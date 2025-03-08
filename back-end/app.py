from dataclasses import field
from tkinter import Image
from flask import Flask, request, jsonify, send_from_directory, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room
from auth import init_auth_routes, SECRET_KEY
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
from cache import get_cached_news_events
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
from PIL import Image
import os
import logging
import bcrypt
import atexit
import signal
import uuid
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    get_jwt_identity,
    create_access_token,
    create_refresh_token,
)
from models import (
    Feed,
    User,
    NewsEvent,
    Project,
    MentorshipRequest,
    Collaboration,
    job,
    User,
    Analytics,
    Conversation,
    Message,
)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Configure CORS properly
CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    },
)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)


NEWS_EVENTS_UPLOAD_FOLDER = "uploads/news_events"
app.config["NEWS_EVENTS_UPLOAD_FOLDER"] = NEWS_EVENTS_UPLOAD_FOLDER

# File upload configuration
UPLOAD_FOLDER = "uploads/projects"
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
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size

PROFILE_PHOTOS_FOLDER = "uploads/profile_photos"
app.config["PROFILE_PHOTOS_FOLDER"] = PROFILE_PHOTOS_FOLDER
os.makedirs(PROFILE_PHOTOS_FOLDER, exist_ok=True)

# Initialize MongoDB client and database
client = MongoClient("mongodb://localhost:27017/")
db = client["imperious"]
projects_collection = db["projects"]
users_collection = db["users"]
collaboration_requests = db["collaboration_requests"]
job_profiles_collection = db["job_profiles"]

# Initialize auth routes
auth_functions = init_auth_routes(app)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": "Invalid token"}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    app.logger.error(f"Token expired: {jwt_data}")
    return jsonify(message="Token has expired"), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    app.logger.error(f"Missing token error: {error}")
    return jsonify(message="Missing authorization token"), 401


# Auth routes
@app.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()

        # Common fields for all roles
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        dept = data.get("dept")
        role = data.get("role", "student")

        # Initialize optional fields
        regno = None
        batch = None
        staff_id = None
        willingness = []  # Initialize willingness

        # Set role-specific fields
        if role.lower() == "staff":
            staff_id = data.get("staff_id")
        else:
            regno = data.get("regno")
            # Ensure 'batch' is an integer, and handle potential errors
            try:
                batch = int(data.get("batch"))  # Try converting to int
            except (ValueError, TypeError):  # Catch potential errors
                return jsonify({"message": "Invalid batch.  Must be a number."}), 400
            if role.lower() == "alumni":
                willingness = data.get(
                    "willingness", []
                )  # Get willingness, default to []

        # --- Input Validation ---
        if not all([name, email, password, dept]):
            return jsonify({"message": "Missing required fields"}), 400
        if role.lower() == "student" or role.lower() == "alumni":
            if not regno or not batch:
                return jsonify({"message": f"{field} is required"}), 400
        elif role.lower() == "staff":
            if not staff_id:
                return jsonify({"message": "Staff ID is required for staff"}), 400

        # Create and save user
        user = User(
            name=name,
            email=email,
            password=password,
            dept=dept,
            role=role,
            regno=regno,
            batch=batch,
            staff_id=staff_id,
            willingness=willingness,  # Pass willingness
        )
        # Validate the user before saving
        user.validate()  # added validation
        user.save()
        return jsonify({"message": "User created successfully"}), 201

    except ValueError as e:  # Catch validation errors from user.validate()
        return jsonify({"message": str(e)}), 400  # Return specific error
    except Exception as e:
        print(f"Signup error: {str(e)}")  # More detailed logging
        return jsonify({"message": "An error occurred during signup"}), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.find_by_email(data["email"])

        if user and User.verify_password(data["password"], user["password"]):
            access_token = create_access_token(identity=data["email"])
            refresh_token = create_refresh_token(identity=data["email"])

            return (
                jsonify(
                    {
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "user": {
                            "email": user["email"],
                            "name": user["name"],
                            "role": user["role"],
                            "dept": user["dept"],
                        },
                    }
                ),
                200,
            )
        else:
            return jsonify({"message": "Invalid email or password"}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({"message": str(e)}), 500


# Profile routes
@app.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def handle_profile():
    if request.method == "GET":
        return auth_functions["get_profile_handler"]()
    else:
        return auth_functions["update_user_profile"](
            get_jwt_identity(), request.get_json()
        )


@app.route("/profile/photo", methods=["POST"])
@jwt_required()
def upload_profile_photo():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        if "photo" not in request.files:
            return jsonify({"message": "No photo part in the request"}), 400

        file = request.files["photo"]

        if file.filename == "":
            return jsonify({"message": "No selected file"}), 400

        if file and allowed_file(file.filename):
            # Create a unique filename
            filename = secure_filename(file.filename)
            name, ext = os.path.splitext(filename)
            unique_filename = f"{str(uuid.uuid4())}{ext}"

            filepath = os.path.join(
                app.config["PROFILE_PHOTOS_FOLDER"], unique_filename
            )

            try:
                # Process the image (resize, optimize)
                img = Image.open(file)

                # Resize to a standard profile size
                img.thumbnail((500, 500))

                # Convert to RGB if needed
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                # Save with optimization
                img.save(filepath, optimize=True, quality=85)

                # Update user profile with photo URL
                photo_url = f"/uploads/profile_photos/{unique_filename}"

                # Update user document in database
                users_collection.update_one(
                    {"_id": user["_id"]}, {"$set": {"photo_url": photo_url}}
                )

                return (
                    jsonify(
                        {
                            "message": "Profile photo uploaded successfully",
                            "photo_url": photo_url,
                        }
                    ),
                    200,
                )

            except Exception as e:
                print(f"Error processing image: {str(e)}")
                return jsonify({"message": "Error processing image"}), 500

        else:
            return jsonify({"message": "File type not allowed"}), 400

    except Exception as e:
        print(f"Error uploading profile photo: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/uploads/profile_photos/<filename>")
def serve_profile_photo(filename):
    return send_from_directory(app.config["PROFILE_PHOTOS_FOLDER"], filename)


# Update the Profile endpoint to include photo_url in the response
@app.route("/profile", methods=["GET"])
@jwt_required()
def get_updated_profile():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Add photo_url to user data
        user_data = {
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "dept": user.get("dept"),
            "regno": user.get("regno"),
            "batch": user.get("batch"),
            "photo_url": user.get("photo_url"),  # Include photo URL
            "_id": str(user["_id"]),
        }

        return jsonify(user_data), 200

    except Exception as e:
        print(f"Error in profile route: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500


@app.route("/profile/job", methods=["GET", "POST", "PUT"])
@jwt_required()
def handle_job_profile():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Verify user is an alumni
        if user.get("role", "").lower() != "alumni":
            return jsonify({"message": "Only alumni can access job profiles"}), 403

        if request.method == "GET":
            # Fetch user's job profile
            job_profile = job_profiles_collection.find_one(
                {"user_id": str(user["_id"])}
            )

            if not job_profile:
                return jsonify({"message": "Job profile not found"}), 404

            # Convert ObjectId to string
            job_profile["_id"] = str(job_profile["_id"])

            return jsonify(job_profile), 200

        elif request.method in ["POST", "PUT"]:
            data = request.get_json()

            # Validate required fields
            if not data.get("company"):
                return jsonify({"message": "Company name is required"}), 400

            if not data.get("job_title"):
                return jsonify({"message": "Job title is required"}), 400

            # Prepare job profile data
            job_profile_data = {
                "user_id": str(user["_id"]),
                "company": data["company"],
                "job_title": data["job_title"],
                "location": data.get("location", ""),
                "start_date": data.get("start_date"),
                "end_date": data.get("end_date"),
                "current": data.get("current", False),
                "description": data.get("description", ""),
                "skills": data.get("skills", []),
                "industry": data.get("industry", ""),
                "updated_at": datetime.now(timezone.utc),
            }

            if request.method == "POST":
                # Check if job profile already exists
                existing_profile = job_profiles_collection.find_one(
                    {"user_id": str(user["_id"])}
                )

                if existing_profile:
                    return (
                        jsonify(
                            {"message": "Job profile already exists, use PUT to update"}
                        ),
                        400,
                    )

                # Add created_at timestamp for new profiles
                job_profile_data["created_at"] = datetime.now(timezone.utc)

                # Insert new job profile
                result = job_profiles_collection.insert_one(job_profile_data)
                return (
                    jsonify(
                        {
                            "message": "Job profile created",
                            "id": str(result.inserted_id),
                        }
                    ),
                    201,
                )

            else:  # PUT - Update existing profile
                # Update existing job profile
                result = job_profiles_collection.update_one(
                    {"user_id": str(user["_id"])},
                    {"$set": job_profile_data},
                    upsert=True,  # Create if doesn't exist
                )

                if result.matched_count > 0:
                    return jsonify({"message": "Job profile updated"}), 200
                else:
                    return (
                        jsonify(
                            {
                                "message": "Job profile created",
                                "id": str(result.upserted_id),
                            }
                        ),
                        201,
                    )

    except Exception as e:
        print(f"Error handling job profile: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/profile/job/experience", methods=["POST"])
@jwt_required()
def add_job_experience():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Verify user is an alumni
        if user.get("role", "").lower() != "alumni":
            return jsonify({"message": "Only alumni can add job experiences"}), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ["company", "job_title", "start_date"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"{field} is required"}), 400

        # Create experience entry
        experience = {
            "_id": str(ObjectId()),  # Generate a unique ID for this experience
            "company": data["company"],
            "job_title": data["job_title"],
            "location": data.get("location", ""),
            "start_date": data["start_date"],
            "end_date": data.get("end_date"),
            "current": data.get("current", False),
            "description": data.get("description", ""),
            "skills": data.get("skills", []),
            "created_at": datetime.now(timezone.utc),
        }

        # Get user's job profile or create one
        job_profile = job_profiles_collection.find_one({"user_id": str(user["_id"])})

        if job_profile:
            # Add to existing experiences array
            job_profiles_collection.update_one(
                {"user_id": str(user["_id"])},
                {
                    "$push": {"experiences": experience},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
            )
        else:
            # Create new job profile with experiences array
            job_profile_data = {
                "user_id": str(user["_id"]),
                "experiences": [experience],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            job_profiles_collection.insert_one(job_profile_data)

        return (
            jsonify(
                {"message": "Job experience added", "experience_id": experience["_id"]}
            ),
            201,
        )

    except Exception as e:
        print(f"Error adding job experience: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/profile/job/experience/<experience_id>", methods=["PUT", "DELETE"])
@jwt_required()
def update_job_experience(experience_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Verify user is an alumni
        if user.get("role", "").lower() != "alumni":
            return jsonify({"message": "Only alumni can modify job experiences"}), 403

        # Find job profile with the specified experience
        job_profile = job_profiles_collection.find_one(
            {"user_id": str(user["_id"]), "experiences._id": experience_id}
        )

        if not job_profile:
            return jsonify({"message": "Experience not found"}), 404

        if request.method == "PUT":
            data = request.get_json()

            # Validate required fields
            required_fields = ["company", "job_title", "start_date"]
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"message": f"{field} is required"}), 400

            # Update the experience
            update_data = {
                "experiences.$.company": data["company"],
                "experiences.$.job_title": data["job_title"],
                "experiences.$.location": data.get("location", ""),
                "experiences.$.start_date": data["start_date"],
                "experiences.$.end_date": data.get("end_date"),
                "experiences.$.current": data.get("current", False),
                "experiences.$.description": data.get("description", ""),
                "experiences.$.skills": data.get("skills", []),
                "updated_at": datetime.now(timezone.utc),
            }

            job_profiles_collection.update_one(
                {"user_id": str(user["_id"]), "experiences._id": experience_id},
                {"$set": update_data},
            )

            return jsonify({"message": "Job experience updated"}), 200

        elif request.method == "DELETE":
            # Remove the experience
            job_profiles_collection.update_one(
                {"user_id": str(user["_id"])},
                {
                    "$pull": {"experiences": {"_id": experience_id}},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
            )

            return jsonify({"message": "Job experience deleted"}), 200

    except Exception as e:
        print(f"Error updating job experience: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


# Feed routes
@app.route("/feeds", methods=["GET", "POST"])
@jwt_required()
def handle_feeds():
    current_user = get_jwt_identity()

    if request.method == "GET":
        feeds = Feed.get_all()
        return jsonify(feeds), 200

    elif request.method == "POST":
        content = request.json.get("content")
        feed_id = User.create_feed(current_user, content)
        return jsonify({"id": feed_id}), 201


@app.route("/feeds/<id>", methods=["DELETE"])
@jwt_required()
def delete_feed(id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        feed = Feed.get_by_id(id)

        if not feed:
            return jsonify({"message": "Feed not found"}), 404

        # Check if user is the author or staff
        if feed["author"] != current_user and user["role"] != "staff":
            return jsonify({"message": "Permission denied"}), 403

        Feed.delete(id)
        return jsonify({"message": "Feed deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400


# News and Events Routes
@app.route("/news-events", methods=["GET", "POST", "OPTIONS"])
@jwt_required(optional=True)
def handle_news_events():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if request.method == "GET":
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        type = request.args.get("type")
        return jsonify(get_cached_news_events(page, limit, type)), 200

    elif request.method == "POST":
        print("Form data received:", request.form)
        print("Form keys:", list(request.form.keys()))
        print("Files received:", request.files)
        print("Content-Type:", request.headers.get("Content-Type"))
        try:
            current_user = get_jwt_identity()
            user = User.find_by_email(current_user)

            if not user or user.get("role", "").lower() not in ["staff", "alumni"]:
                return jsonify({"message": "Permission denied"}), 403

            if request.is_json:
                # Handle JSON data
                json_data = request.get_json()
                data = {
                    "title": json_data.get("title"),
                    "description": json_data.get("description"),
                    "type": json_data.get("type"),
                    "created_at": datetime.now(timezone.utc),
                }

                # Add event-specific fields for JSON
                if json_data.get("type") == "event":
                    data["event_date"] = json_data.get("event_date")
                    data["location"] = json_data.get("location")
            else:
                # Handle form data (original code)
                data = {
                    "title": request.form.get("title"),
                    "description": request.form.get("description"),
                    "type": request.form.get("type"),
                    "created_at": datetime.now(timezone.utc),
                }

                # Add event-specific fields
                if data["type"] == "event":
                    data["event_date"] = request.form.get("event_date")
                    data["location"] = request.form.get("location")

            # Validate required fields
            required_fields = ["title", "description", "type"]
            if data.get("type") == "event":
                required_fields.extend(["event_date", "location"])

            for field in required_fields:
                if not data.get(field):
                    return jsonify({"message": f"{field} is required"}), 400

            # Handle image upload
            if "image" in request.files:
                file = request.files["image"]
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Generate unique filename: UUID + original extension
                    name, ext = os.path.splitext(filename)
                    unique_filename = str(uuid.uuid4()) + ext

                    filepath = os.path.join(
                        app.config["NEWS_EVENTS_UPLOAD_FOLDER"], unique_filename
                    )
                    # Ensure directory exists:
                    os.makedirs(os.path.dirname(filepath), exist_ok=True)
                    data["image_url"] = f"/uploads/news_events/{unique_filename}"
                else:
                    return jsonify({"message": "Invalid file type"}), 400

                try:
                    # --- Image Processing (using Pillow) ---
                    img = Image.open(file)

                    # Resize (example - adjust as needed)
                    img.thumbnail(
                        (800, 800)
                    )  # Resize to max 800x800, preserving aspect ratio

                    # Convert to JPEG (optional, but good for consistency)
                    if img.mode in ("RGBA", "P"):  # Handle transparency
                        img = img.convert("RGB")
                    img.save(
                        filepath, "JPEG", optimize=True, quality=85
                    )  # Save as JPEG, with optimization

                    data["image_url"] = f"/uploads/news_events/{unique_filename}"

                except IOError:
                    # Handle image processing errors
                    app.logger.exception("Error processing image:")
                    return (
                        jsonify({"message": "Could not process the uploaded image."}),
                        400,
                    )
                except Exception as e:
                    app.logger.exception("Error saving image:")
                    return jsonify({"message": "Error saving image"}), 500

            # Create news/event with author_id
            result = NewsEvent.create(data, author_id=str(user["_id"]))
            get_cached_news_events.cache_clear()
            return jsonify({"id": str(result)}), 201

        except Exception as e:
            app.logger.error(f"Error creating news/event: {str(e)}")
            return jsonify({"message": str(e)}), 500


@app.route("/news-events/<id>", methods=["GET", "PUT", "DELETE", "OPTIONS"])
@jwt_required(optional=True)
def handle_single_news_event(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    if request.method == "GET":
        news_event = NewsEvent.get_by_id(id)
        if news_event:
            return jsonify(news_event), 200
        else:
            return jsonify({"message": "News event not found"}), 404
    elif request.method == "PUT":
        try:
            current_user = get_jwt_identity()
            if not current_user:
                return jsonify({"message": "Unauthorized"}), 401
            user = User.find_by_email(current_user)

            # Only staff and alumni can update news/events
            if user["role"].lower() not in ["staff", "alumni"]:
                return jsonify({"message": "Permission denied"}), 403

            data = request.get_json()

            if "author_id" in data:
                del data["author_id"]
            if NewsEvent.update(id, data):

                get_cached_news_events.cache_clear()  # Clear the cache after updating
                return jsonify({"message": "News event updated successfully"}), 200
            else:
                return (
                    jsonify({"message": "News event not found or not modified."}),
                    404,
                )
        except Exception as e:
            app.logger.exception(f"Error updating news/event with id {id}:")
            return (
                jsonify(
                    {"message": "An error occurred while updating the news/event."}
                ),
                500,
            )
    elif request.method == "DELETE":
        try:
            current_user = get_jwt_identity()
            if not current_user:
                return jsonify({"message": "Unauthorized"}), 401
            user = User.find_by_email(current_user)

            # Only staff and alumni can delete news/events
            if user["role"].lower() not in ["staff", "alumni"]:
                return jsonify({"message": "Permission denied"}), 403

            news_event = NewsEvent.get_by_id(
                id
            )  # Get the news event *before* authorization checks

            if not news_event:
                return jsonify({"message": "News/event not found"}), 404
            # Authorization checks.
            if user["role"].lower() == "staff" and news_event["author_id"] != str(
                user["_id"]
            ):
                return (
                    jsonify({"message": "Unauthorized"}),
                    403,
                )  # staff can delete news/event created by them
            if user["role"].lower() == "alumni" and news_event["author_id"] != str(
                user["_id"]
            ):
                return (
                    jsonify({"message": "Unauthorized"}),
                    403,
                )  # Alumni can delete news/event created by them.

            # Delete associated image file (if it exists)
            if news_event.get("image_url"):
                image_path = os.path.join(
                    app.root_path, news_event["image_url"][1:]
                )  # Remove leading /
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except OSError as e:
                        app.logger.error(
                            f"Error deleting image file: {e}"
                        )  # log if an error occur

            if NewsEvent.delete(id):
                get_cached_news_events.cache_clear()  # Clear the cache after deleting
                return jsonify({"message": "News event deleted successfully"}), 200
            else:
                return jsonify({"message": "new event not found or not modified."}), 404

        except Exception as e:
            app.logger.exception(f"Error deleting news/event with id {id}:")
            return (
                jsonify(
                    {"message": "An error occurred while deleting the news/event."}
                ),
                500,
            )


# Project routes
@app.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        # Validate required fields
        required_fields = ["title", "abstract", "modules"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"{field} is required"}), 400

        # Create project
        project = Project(
            title=data["title"],
            abstract=data["abstract"],
            techStack=data.get("techStack", []),
            githubLink=data.get("githubLink", ""),
            modules=data.get("modules", []),
            created_by=user["_id"],
        )

        project_id = project.save()
        return (
            jsonify({"message": "Project created successfully", "id": project_id}),
            201,
        )

    except Exception as e:
        return jsonify({"message": "Failed to create project"}), 500


@app.route("/projects/<id>/files", methods=["POST"])
@jwt_required()
def upload_project_files(id):
    try:
        current_user = get_jwt_identity()

        # Verify project exists and user has access
        project = Project.get_by_id(id)
        if not project:
            return jsonify({"message": "Project not found"}), 404

        if project["created_by"] != current_user:
            return jsonify({"message": "Unauthorized"}), 403

        if "file" not in request.files:
            return jsonify({"message": "No file part"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"message": "No selected file"}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], id)
            os.makedirs(file_path, exist_ok=True)
            file.save(os.path.join(file_path, filename))

            return jsonify({"message": "File uploaded successfully"}), 200

        return jsonify({"message": "File type not allowed"}), 400

    except Exception as e:
        return jsonify({"message": "Failed to upload file"}), 500


@app.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user or "_id" not in user:
            return jsonify({"message": "User not found"}), 404

        projects = list(projects_collection.find({"created_by": ObjectId(user["_id"])}))

        # Convert ObjectId to string for JSON serialization
        for project in projects:
            project["_id"] = str(project["_id"])
            project["created_by"] = str(project["_id"])
            # Rename tech_stack to techStack for frontend compatibility
            if "tech_stack" in project:
                project["techStack"] = project.pop("tech_stack")

        return jsonify(projects), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch projects"}), 500


@app.route("/projects/<project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    try:
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            return jsonify({"message": "Project not found"}), 404

        # Convert ObjectId to string for JSON serialization
        project["_id"] = str(project["_id"])
        project["created_by"] = str(project["created_by"])

        return jsonify(project), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch project"}), 500


@app.route("/uploads/projects/<path:filename>")
@jwt_required()
def serve_project_file(filename):
    try:
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    except Exception as e:
        return jsonify({"message": "File not found"}), 404


@app.route("/uploads/news_events/<path:filename>")
def serve_news_event_file(filename):
    try:
        return send_from_directory(app.config["NEWS_EVENTS_UPLOAD_FOLDER"], filename)
    except Exception as e:
        return jsonify({"message": "File not found"}), 404


@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user)
        return (
            jsonify(
                access_token=new_access_token, message="Token refreshed successfully"
            ),
            200,
        )
    except Exception as e:
        app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify(message="Token refresh failed"), 401


@app.route("/debug/projects", methods=["GET"])
@jwt_required()
def debug_projects():
    try:
        # Get all projects without filtering
        all_projects = list(projects_collection.find())

        # Convert ObjectIds to strings for JSON serialization
        for project in all_projects:
            project["_id"] = str(project["_id"])
            project["created_by"] = str(project["created_by"])

            if "created_at" in project:
                project["created_at"] = project["created_at"].isoformat()
            if "updated_at" in project:
                project["updated_at"] = project["updated_at"].isoformat()

        return (
            jsonify({"total_count": len(all_projects), "projects": all_projects}),
            200,
        )

    except Exception as e:
        return jsonify({"message": "Debug endpoint error"}), 500


@app.route("/projects/<project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Verify project exists and user has access
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            return jsonify({"message": "Project not found"}), 404

        if project["created_by"] != user["_id"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Delete the project
        projects_collection.delete_one({"_id": ObjectId(project_id)})
        return jsonify({"message": "Project deleted successfully"}), 200

    except Exception as e:
        return jsonify({"message": "Failed to delete project"}), 500


@app.route("/projects/<project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            return jsonify({"message": "Project not found"}), 404

        if str(project["created_by"]) != str(user["_id"]):
            return (
                jsonify(
                    {"message": "Unauthorized: Only the owner can edit this project."}
                ),
                403,
            )

        data = request.get_json()
        # Optionally: sanitize or restrict certain fields
        allowed_fields = [
            "title",
            "abstract",
            "tech_stack",
            "github_link",
            "modules",
            "progress",
        ]
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if not update_data:
            return jsonify({"message": "No valid fields provided for update."}), 400

        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)}, {"$set": update_data}
        )
        if result.modified_count > 0:
            return jsonify({"message": "Project updated successfully"}), 200
        else:
            return jsonify({"message": "Project not updated."}), 400

    except Exception as e:
        return jsonify({"message": "Failed to update project"}), 500


def shutdown_server():
    func = request.environ.get("werkzeug.server.shutdown")
    if func is None:
        raise RuntimeError("Not running with the Werkzeug Server")
    func()


@app.route("/shutdown", methods=["POST"])
def shutdown():
    shutdown_server()
    return "Server shutting down..."


def handle_exit(*args):
    shutdown_server()


atexit.register(handle_exit)
signal.signal(signal.SIGTERM, handle_exit)
signal.signal(signal.SIGINT, handle_exit)


# Mentorship routes
@app.route("/mentorship/request", methods=["POST"])
@jwt_required()
def create_mentorship_request():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        print(f"Creating request for user: {user['_id']}")  # Debug log
        print(f"Request data: {data}")  # Debug log

        data["student_id"] = str(user["_id"])
        request_id = MentorshipRequest.create(data)

        print(f"Request created with ID: {request_id}")  # Debug log

        return (
            jsonify({"message": "Request created successfully", "id": request_id}),
            201,
        )
    except Exception as e:
        print(f"Error creating request: {str(e)}")  # Debug log
        return jsonify({"message": str(e)}), 500


@app.route("/mentorship/requests", methods=["GET"])
@jwt_required()
def get_mentorship_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # print(f"Fetching requests for user: {user['_id']}")  # Debug log

        if user["role"] == "student":
            requests = MentorshipRequest.get_student_requests(str(user["_id"]))
        else:
            requests = MentorshipRequest.get_mentor_requests(str(user["_id"]))

        # print(f"Found {len(requests)} requests")  # Debug log
        return jsonify(requests), 200
    except Exception as e:
        print(f"Error getting requests: {str(e)}")  # Debug log
        return jsonify({"message": str(e)}), 500


@app.route("/mentorship/request/<request_id>", methods=["PUT"])
@jwt_required()
def update_mentorship_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Basic authorization: Only alumni can update requests
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        data = request.get_json()
        status = data.get("status")

        if not status or status not in ["accepted", "rejected"]:
            return jsonify({"message": "Invalid status"}), 400

        # Update the request, setting mentor_id if accepted
        if status == "accepted":
            success = MentorshipRequest.update_request(
                request_id, status, mentor_id=str(user["_id"])
            )  # Pass user ID and convert to string
        else:
            success = MentorshipRequest.update_request(
                request_id, status
            )  # only status update

        if success:
            return jsonify({"message": f"Request {status} successfully"}), 200
        else:
            return (
                jsonify({"message": "Request not found or not modified"}),
                404,
            )  # Or 500, depending on your preference

    except Exception as e:
        print(f"Error updating mentorship request: {str(e)}")
        return jsonify({"message": "An error occurred while updating the request"}), 500


# New Route: Ignore a request
@app.route("/mentorship/request/<request_id>/ignore", methods=["PUT"])
@jwt_required()
def ignore_mentorship_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization: Only alumni can ignore
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        success = MentorshipRequest.ignore_request(
            request_id, user["email"]
        )  # Pass user's email

        if success:
            return jsonify({"message": "Request ignored"}), 200
        else:
            return (
                jsonify({"message": "Request not found or already ignored"}),
                404,
            )  # or 500

    except Exception as e:
        print(f"Error ignoring mentorship request: {str(e)}")
        return jsonify({"message": "An error occurred while ignoring the request"}), 500


@app.route("/mentorship/my_mentees", methods=["GET"])
@jwt_required()
def get_mentees():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization: Only alumni can access this
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        mentees_data = MentorshipRequest.get_mentees_by_mentor(
            user["email"]
        )  # Pass email
        return jsonify(mentees_data), 200

    except Exception as e:
        print(f"Error getting mentees: {str(e)}")
        return jsonify({"message": "An error occurred while fetching mentees"}), 500


# Collaboration routes
@app.route("/collaborations/explore", methods=["GET"])
@jwt_required()
def explore_projects():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Get query parameters for filtering
        dept = request.args.get("dept")
        tech = request.args.get("tech")

        # Build query to exclude user's own projects
        query = {
            "created_by": {
                "$ne": str(user["_id"])  # Convert ObjectId to string for comparison
            }
        }

        # Add additional filters if provided
        if dept:
            query["dept"] = dept
        if tech:
            query["tech_stack"] = tech

        print(f"Query: {query}")  # Debug log
        print(f"Current user ID: {user['_id']}")  # Debug log

        # Get projects from database
        projects = list(projects_collection.find(query))
        print(f"Found {len(projects)} projects")  # Debug log

        # Format projects for response
        formatted_projects = []
        for project in projects:
            # Skip if project belongs to current user (double-check)
            if str(project["created_by"]) == str(user["_id"]):
                continue

            # Convert ObjectId to string
            project["_id"] = str(project["_id"])
            project["created_by"] = str(project["created_by"])

            # Get creator details
            creator = users_collection.find_one(
                {"_id": ObjectId(project["created_by"])}
            )
            if creator:
                project["creator"] = {
                    "name": creator["name"],
                    "dept": creator["dept"],
                    "_id": str(creator["_id"]),
                }

            formatted_projects.append(project)

        print(f"Returning {len(formatted_projects)} formatted projects")  # Debug log
        return jsonify(formatted_projects), 200

    except Exception as e:
        print(f"Error in explore_projects: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/request", methods=["POST"])
@jwt_required()
def create_collaboration_request():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        # Get project details to get owner_id
        project = projects_collection.find_one({"_id": ObjectId(data["project_id"])})
        if not project:
            return jsonify({"message": "Project not found"}), 404

        # Create collaboration request
        request_data = {
            "project_id": data["project_id"],
            "student_id": str(user["_id"]),
            "project_owner_id": project["created_by"],
            "message": data["message"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        collaboration_requests.insert_one(request_data)
        return jsonify({"message": "Request sent successfully"}), 201

    except Exception as e:
        print(f"Error creating collaboration request: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/requests", methods=["GET"])
@jwt_required()
def get_collaboration_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Get only requests where user is project owner (incoming requests)
        # Use $or to match both string and ObjectId formats
        requests = list(
            collaboration_requests.find(
                {
                    "project_owner_id": {
                        "$in": [
                            str(user["_id"]),  # Match string format
                            ObjectId(str(user["_id"])),  # Match ObjectId format
                        ]
                    }
                }
            )
        )

        print(f"User ID: {user['_id']}")  # Debug log
        print(f"Found requests: {requests}")  # Debug log

        formatted_requests = []
        for req in requests:
            # Get project details
            project = projects_collection.find_one({"_id": ObjectId(req["project_id"])})
            if project:
                # Get student details (requester)
                student = users_collection.find_one(
                    {"_id": ObjectId(req["student_id"])}
                    if not isinstance(req["student_id"], ObjectId)
                    else {"_id": req["student_id"]}
                )

                if student:
                    formatted_request = {
                        "_id": str(req["_id"]),
                        "status": req["status"],
                        "message": req["message"],
                        "created_at": req["created_at"],
                        "updated_at": req.get("updated_at"),
                        "project": {
                            "_id": str(project["_id"]),
                            "title": project["title"],
                            "abstract": project["abstract"],
                            "tech_stack": project.get("tech_stack", []),
                        },
                        "student": {
                            "_id": str(student["_id"]),
                            "name": student["name"],
                            "dept": student["dept"],
                        },
                    }
                    formatted_requests.append(formatted_request)

        print(f"Returning {len(formatted_requests)} incoming requests")  # Debug log
        return jsonify(formatted_requests), 200

    except Exception as e:
        print(f"Error getting collaboration requests: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/request/<request_id>", methods=["PUT"])
@jwt_required()
def update_collaboration_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        print(
            f"Updating request {request_id} with status {data['status']}"
        )  # Debug log

        # Verify the request exists
        collab_request = collaboration_requests.find_one({"_id": ObjectId(request_id)})

        if not collab_request:
            print(f"Request {request_id} not found")  # Debug log
            return jsonify({"message": "Request not found"}), 404

        # Get project and print debug info
        project = projects_collection.find_one(
            {"_id": ObjectId(collab_request["project_id"])}
        )

        print(f"Project created_by: {project['created_by']}")  # Debug log
        print(f"Current user ID: {user['_id']}")  # Debug log
        print(f"Current user ID (str): {str(user['_id'])}")  # Debug log

        # Verify user owns the project
        if str(project["created_by"]) != str(user["_id"]):
            print("User is not the project owner")  # Debug log
            return jsonify({"message": "Not authorized"}), 403

        # Update request status
        collaboration_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": data["status"],
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        # If accepted, add collaborator to project
        if data["status"] == "accepted":
            # Get student details for the collaborator
            student = users_collection.find_one(
                {"_id": ObjectId(collab_request["student_id"])}
            )

            if student:
                projects_collection.update_one(
                    {"_id": ObjectId(collab_request["project_id"])},
                    {
                        "$addToSet": {
                            "collaborators": {
                                "id": str(student["_id"]),
                                "name": student["name"],
                                "dept": student["dept"],
                                "joined_at": datetime.now(timezone.utc),
                            }
                        }
                    },
                )
                print(f"Added collaborator {student['name']} to project")  # Debug log

        return (
            jsonify({"message": f"Request {data['status']}", "status": data["status"]}),
            200,
        )

    except Exception as e:
        print(f"Error updating collaboration request: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/request/<request_id>/message", methods=["POST"])
@jwt_required()
def send_collaboration_message(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        collab_request = collaboration_requests.find_one({"_id": ObjectId(request_id)})
        if not collab_request:
            return jsonify({"message": "Request not found"}), 404

        # Add message to request
        collaboration_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$push": {
                    "messages": {
                        "sender_id": str(user["_id"]),
                        "content": data["message"],
                        "sent_at": datetime.now(timezone.utc),
                    }
                }
            },
        )

        return jsonify({"message": "Message sent"}), 200

    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/collaborated", methods=["GET"])
@jwt_required()
def get_collaborated_projects():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        user_id = str(user["_id"])

        print(f"Looking for collaborations for user: {user_id}")  # Debug log

        # Find all accepted collaboration requests where user is the student (not the owner)
        collab_requests = list(
            collaboration_requests.find(
                {
                    "$and": [
                        {"status": "accepted"},
                        # Only get requests where user is the student
                        {
                            "$or": [
                                {"student_id": user_id},  # String format
                                {"student_id": ObjectId(user_id)},  # ObjectId format
                            ]
                        },
                        # Explicitly exclude where user is the project owner
                        {
                            "project_owner_id": {
                                "$ne": user_id  # Compare with string format
                            }
                        },
                    ]
                }
            )
        )

        print(f"Found {len(collab_requests)} accepted requests")  # Debug log
        for req in collab_requests:
            print(f"Request details:")
            print(
                f"- Student ID: {req.get('student_id')} ({type(req.get('student_id'))})"
            )
            print(
                f"- Project Owner ID: {req.get('project_owner_id')} ({type(req.get('project_owner_id'))})"
            )
            print(f"- Project ID: {req.get('project_id')}")
            print(f"- Status: {req.get('status')}")

        if not collab_requests:
            print("No collaboration requests found")
            return jsonify([]), 200

        # Get all project IDs from the requests
        project_ids = [ObjectId(req["project_id"]) for req in collab_requests]

        # Get all projects in one query
        projects = list(projects_collection.find({"_id": {"$in": project_ids}}))
        print(f"Found {len(projects)} projects")  # Debug log

        # Get all owner IDs from the projects
        owner_ids = [
            (
                ObjectId(project["created_by"])
                if not isinstance(project["created_by"], ObjectId)
                else project["created_by"]
            )
            for project in projects
        ]

        # Get all owners in one query
        owners = {
            str(owner["_id"]): owner
            for owner in users_collection.find({"_id": {"$in": owner_ids}})
        }

        # Format the response
        collaborated_projects = []
        for project in projects:
            owner = owners.get(str(project["created_by"]))
            if owner:
                # Find the corresponding request for this project
                request = next(
                    (
                        req
                        for req in collab_requests
                        if req["project_id"] == str(project["_id"])
                    ),
                    None,
                )

                if request:
                    print(f"Processing project: {project['title']}")  # Debug log
                    formatted_project = {
                        "_id": str(project["_id"]),
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "tech_stack": project.get("tech_stack", []),
                        "owner": {
                            "id": str(owner["_id"]),
                            "name": owner["name"],
                            "dept": owner["dept"],
                        },
                        "collaborators": [
                            {
                                "id": user_id,
                                "name": user["name"],
                                "dept": user["dept"],
                                "joined_at": request["updated_at"],
                            }
                        ],
                    }
                    collaborated_projects.append(formatted_project)
                    print(f"Added project: {project['title']}")  # Debug log

        print(
            f"Returning {len(collaborated_projects)} collaborated projects"
        )  # Debug log
        return jsonify(collaborated_projects), 200

    except Exception as e:
        print(f"Error getting collaborated projects: {str(e)}")
        return jsonify({"message": str(e)}), 500


@app.route("/collaborations/outgoing", methods=["GET"])
@jwt_required()
def get_outgoing_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Get requests where user is the requester
        requests = list(
            collaboration_requests.find(
                {"student_id": str(user["_id"])}  # Get my requests to other projects
            )
        )

        formatted_requests = []
        for req in requests:
            # Get project details
            project = projects_collection.find_one({"_id": ObjectId(req["project_id"])})
            if project:
                # Get project owner details
                owner = users_collection.find_one(
                    {"_id": ObjectId(project["created_by"])}
                )

                if owner:
                    formatted_request = {
                        "_id": str(req["_id"]),
                        "status": req["status"],
                        "message": req["message"],
                        "created_at": req["created_at"],
                        "updated_at": req.get("updated_at"),
                        "project": {
                            "_id": str(project["_id"]),
                            "title": project["title"],
                            "abstract": project["abstract"],
                            "tech_stack": project.get("tech_stack", []),
                            "owner_name": owner["name"],
                            "owner_dept": owner["dept"],
                        },
                    }
                    formatted_requests.append(formatted_request)

        print(f"Returning {len(formatted_requests)} outgoing requests")  # Debug log
        return jsonify(formatted_requests), 200

    except Exception as e:
        print(f"Error getting outgoing requests: {str(e)}")
        return jsonify({"message": str(e)}), 500


# app.py (Updated Job Routes)
@app.route("/jobs", methods=["GET", "POST"])
@jwt_required(optional=True)
def handle_jobs():
    if request.method == "GET":
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        search_term = request.args.get("search", None)  # Get search term
        location = request.args.get("location", None)  # Get location
        job_type = request.args.get("job_type", None)  # Get job type
        sort_by = request.args.get("sort_by", "created_at")  # Get sorting value
        sort_order = request.args.get("sort_order", "-1")  # Get sorting order

        jobs_data = job.get_all(
            page, limit, search_term, location, job_type, sort_by, sort_order
        )
        return jsonify(jobs_data), 200

    elif request.method == "POST":
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({"message": "Unauthorized"}), 401

        user = User.find_by_email(current_user)
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Only alumni can post jobs"}), 403

        data = request.json
        # Basic validation (add more as needed)
        required_fields = [
            "title",
            "company",
            "location",
            "description",
            "job_type",
            "requirements",
        ]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"{field} is required"}), 400
        if not isinstance(data["job_type"], list):
            return jsonify({"message": "job_type must be a list"}), 400

        data["posted_by"] = str(user["_id"])  # Store the user's ID

        job_id = job.create(data)
        return jsonify({"id": job_id}), 201


@app.route("/jobs/<id>", methods=["GET", "PUT", "DELETE"])
@jwt_required(optional=True)
def handle_single_job(id):
    current_user = get_jwt_identity()  # Get user even for GET (for authorization later)
    user = User.find_by_email(current_user) if current_user else None

    retrieved_job = job.get_by_id(id)  # using get_by_id to fetch all post details
    if not retrieved_job:
        return jsonify({"message": "Job not found"}), 404

    if request.method == "GET":
        return jsonify(retrieved_job), 200

    elif request.method == "PUT":
        if (
            not user
            or user["role"].lower() != "alumni"
            or str(user["_id"]) != retrieved_job["posted_by"]
        ):
            return jsonify({"message": "Unauthorized"}), 403

        data = request.json
        if job.update(id, data):  # call the method from models
            return jsonify({"message": "Job updated successfully"}), 200
        else:
            return jsonify({"message": "Job not found or not modified."}), 400

    elif request.method == "DELETE":
        if (
            not user
            or (user["role"].lower() != "alumni" and user["role"].lower() != "staff")
            or (
                user["role"].lower() == "alumni"
                and str(user["_id"]) != retrieved_job["posted_by"]
            )
        ):
            return jsonify({"message": "Unauthorized"}), 403

        if job.delete(id):  # call the method from models
            return jsonify({"message": "Job deleted successfully"}), 200
        else:
            return jsonify({"message": "Job not found."}), 404


# Add this to your app.py


@app.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization: Only staff/admin can access analytics
        if user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # --- Aggregate Data ---  Use the class methods!
        analytics_data = {
            "user_counts": Analytics.get_user_counts_by_role(),
            "new_registrations": Analytics.get_new_user_registrations(),
            "active_users": Analytics.get_active_users(),
            "student_departments": Analytics.get_department_distribution("student"),
            "alumni_departments": Analytics.get_department_distribution("alumni"),
            "student_batches": Analytics.get_batch_year_distribution("student"),
            "alumni_batches": Analytics.get_batch_year_distribution("alumni"),
            "request_status_breakdown": Analytics.get_mentorship_request_status_breakdown(),
            "total_requests": Analytics.get_total_mentorship_requests(),
            "total_projects": Analytics.get_total_projects_created(),
            "project_status_breakdown": Analytics.get_project_status_breakdown(),
            "top_technologies": Analytics.get_top_technologies(),
        }

        return jsonify(analytics_data), 200

    except Exception as e:
        print(f"Error in analytics route: {str(e)}")
        return jsonify({"message": "An error occurred while fetching analytics"}), 500


# app.py
@app.route("/analytics/users", methods=["GET"])
@jwt_required()
def get_users_list():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Get query parameters for filtering
        role = request.args.get("role")
        dept = request.args.get("dept")
        batch = request.args.get("batch")
        regno = request.args.get("regno")
        created_at = request.args.get("created_at")  # Get created_at filter
        page = int(request.args.get("page", 1))  # Default to page 1
        per_page = int(request.args.get("per_page", 10))  # Default 10 per page

        users_data = Analytics.get_all_users(
            role, dept, batch, regno, created_at, page, per_page
        )

        return jsonify(users_data), 200

    except Exception as e:
        print(f"Error in get_users_list route: {str(e)}")
        return jsonify({"message": "An error occurred while fetching user list"}), 500


@app.route("/alumni/willingness", methods=["GET"])
@jwt_required()
def get_alumni_willingness():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization check: only staff or admin can access.
        if user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Get filter parameter
        willingness_filter = request.args.get("willingness", default="", type=str)

        alumni_data = Analytics.get_alumni_by_willingness(willingness_filter)
        return jsonify(alumni_data), 200

    except Exception as e:
        print(f"Error in /alumni/willingness: {str(e)}")
        return (
            jsonify({"message": "An error occurred while fetching alumni data."}),
            500,
        )


@app.route("/alumni/<string:alumnus_id>/mentees", methods=["GET"])
@jwt_required()
def get_alumni_mentees(alumnus_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)  # Use email consistently
        # Basic authorization check:
        if user["role"].lower() not in [
            "staff",
            "admin",
            "alumni",
        ]:  # alumni can also see
            return jsonify({"message": "Unauthorized"}), 403

        # check weather the alumni is accessing other alumni details.
        if user["role"] == "alumni" and user["email"] != alumnus_id:
            return jsonify({"message": "Unauthorized"}), 403

        mentees_data = MentorshipRequest.get_mentees_by_mentor(
            alumnus_id
        )  # Pass email (alumnus_id)

        return jsonify(mentees_data), 200
    except Exception as e:
        print(f"Error in /alumni/<alumnus_id>/mentees: {str(e)}")
        return jsonify({"message": "An error occurred while fetching mentees."}), 500


@app.route("/alumni/<string:alumnus_id>/posts", methods=["GET"])
@jwt_required()
def get_alumni_posts(alumnus_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Basic authorization
        if user["role"].lower() not in [
            "staff",
            "admin",
            "alumni",
        ]:  # alumni can also view it
            return jsonify({"message": "Unauthorized"}), 403
        # added condition to check weather the alumni user requesting for details is same.
        if user["role"].lower() == "alumni" and user["email"] != alumnus_id:
            return jsonify({"message": "Unauthorized"}), 403

        posts = NewsEvent.get_by_author(alumnus_id)  # Pass author's email

        return jsonify(posts), 200

    except Exception as e:
        print(f"Error in /alumni/<alumnus_id>/posts: {str(e)}")
        return jsonify({"message": "An error occurred while fetching posts."}), 500


# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

# Create a dictionary to track online users
online_users = {}


# Socket.IO event handlers
@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    # Remove user from online users and notify others
    for user_email, sid in list(online_users.items()):
        if sid == request.sid:
            del online_users[user_email]
            emit(
                "user_status",
                {"email": user_email, "status": "offline"},
                broadcast=True,
            )
            print(f"User {user_email} disconnected")
            break


@socketio.on("login")
def handle_login(data):
    user_email = data.get("email")
    if user_email:
        # Store user's socket ID
        online_users[user_email] = request.sid
        # Notify others that user is online
        emit("user_status", {"email": user_email, "status": "online"}, broadcast=True)
        print(f"User {user_email} logged in")


@socketio.on("join_conversation")
def handle_join_conversation(data):
    conversation_id = data.get("conversation_id")
    user_email = data.get("email")

    if not conversation_id or not user_email:
        print(f"Missing data in join_conversation: {data}")
        return

    # Create a room name (using conversation ID)
    room = f"conversation_{conversation_id}"

    # Verify user is part of the conversation
    user = User.find_by_email(user_email)
    if not user:
        print(f"User not found: {user_email}")
        return

    conversation = Conversation.get_by_id(conversation_id)
    if not conversation:
        return

    # Check if user is a participant
    if str(user["_id"]) not in conversation["participants"]:
        print(f"Conversation not found: {conversation_id}")
        return

    if str(user["_id"]) not in conversation["participants"]:
        print(
            f"User {user_email} is not a participant in conversation {conversation_id}"
        )
        print(f"Participants: {conversation['participants']}")
        print(f"User ID: {str(user['_id'])}")
        return

    # Join the room
    join_room(room)
    print(f"User {user_email} joined conversation {conversation_id}")

    # Mark conversation as read
    Conversation.mark_as_read(conversation_id, user_email)

    # Notify others that messages were read
    emit(
        "messages_read",
        {
            "conversation_id": conversation_id,
            "user_id": str(user["_id"]),
            "user_email": user_email,
        },
        room=room,
    )


@socketio.on("leave_conversation")
def handle_leave_conversation(data):
    conversation_id = data.get("conversation_id")

    if conversation_id:
        room = f"conversation_{conversation_id}"
        leave_room(room)
        print(f"User left conversation {conversation_id}")


@socketio.on("send_message")
def handle_send_message(data):
    user_email = data.get("email")
    conversation_id = data.get("conversation_id")
    text = data.get("text")
    attachments = data.get("attachments")

    if not user_email or not conversation_id or not text:
        return

    try:
        # Create the message
        message = Message.create(user_email, conversation_id, text, attachments)

        # Send to all clients in the conversation room
        room = f"conversation_{conversation_id}"
        emit("new_message", message, room=room)

        print(
            f"Message from {user_email} in conversation {conversation_id}: {text[:20]}..."
        )
    except Exception as e:
        print(f"Error sending message: {e}")


# REST API routes for messaging
@app.route("/api/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    current_user = get_jwt_identity()

    try:
        conversations = Conversation.get_for_user(current_user)
        return jsonify(conversations), 200
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return jsonify({"error": "Failed to get conversations"}), 500


@app.route("/api/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    current_user = get_jwt_identity()
    data = request.get_json()

    participants = data.get("participants", [])

    # Add the current user if not already in the list
    if current_user not in participants:
        participants.append(current_user)

    try:
        conversation_id = Conversation.create(participants)
        conversation = Conversation.get_by_id(conversation_id)
        return jsonify(conversation), 201
    except Exception as e:
        print(f"Error creating conversation: {e}")
        return jsonify({"error": str(e)}), 400


@app.route("/api/conversations/<conversation_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(conversation_id):
    current_user = get_jwt_identity()

    # Get pagination parameters
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))

    # Verify user is part of the conversation
    user = User.find_by_email(current_user)
    if not user:
        return jsonify({"error": "User not found"}), 404

    conversation = Conversation.get_by_id(conversation_id)
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    # Check if user is a participant
    if str(user["_id"]) not in conversation["participants"]:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        messages = Message.get_by_conversation(conversation_id, page, per_page)
        return jsonify(messages), 200
    except Exception as e:
        print(f"Error getting messages: {e}")
        return jsonify({"error": "Failed to get messages"}), 500


@app.route("/api/users/search", methods=["GET"])
@jwt_required()
def search_users():
    current_user = get_jwt_identity()

    # Get search parameters
    query = request.args.get("q", "")
    role = request.args.get("role", "")
    dept = request.args.get("dept", "")

    # Build MongoDB query
    mongo_query = {}

    # Add search term if provided
    if query:
        mongo_query["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
        ]

    # Add role filter if provided
    if role:
        mongo_query["role"] = role

    # Add department filter if provided
    if dept:
        mongo_query["dept"] = dept

    # Exclude current user
    mongo_query["email"] = {"$ne": current_user}

    try:
        # Find users
        users = list(users_collection.find(mongo_query).limit(10))

        # Format results
        result = []
        for user in users:
            user["_id"] = str(user["_id"])
            user.pop("password", None)  # Remove password
            result.append(user)

        return jsonify(result), 200
    except Exception as e:
        print(f"Error searching users: {e}")
        return jsonify({"error": "Failed to search users"}), 500


# Create a new collection for connection requests
connection_requests = db["connection_requests"]


@app.route("/connections/request", methods=["POST"])
@jwt_required()
def create_connection_request():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        # Validate required fields
        if not data.get("to_user_id"):
            return jsonify({"message": "Recipient user ID is required"}), 400

        # Check if users exist
        to_user = users_collection.find_one({"_id": ObjectId(data["to_user_id"])})
        if not to_user:
            return jsonify({"message": "Recipient user not found"}), 404

        # Ensure users aren't the same
        if str(user["_id"]) == data["to_user_id"]:
            return (
                jsonify({"message": "Cannot send connection request to yourself"}),
                400,
            )

        # Check if a connection request already exists
        existing_request = connection_requests.find_one(
            {
                "$or": [
                    {
                        "from_user_id": str(user["_id"]),
                        "to_user_id": data["to_user_id"],
                        "status": {"$in": ["pending", "accepted"]},
                    },
                    {
                        "from_user_id": data["to_user_id"],
                        "to_user_id": str(user["_id"]),
                        "status": {"$in": ["pending", "accepted"]},
                    },
                ]
            }
        )

        if existing_request:
            if existing_request["status"] == "accepted":
                return jsonify({"message": "Users are already connected"}), 400
            else:
                return jsonify({"message": "Connection request already exists"}), 400

        # Create connection request
        connection_request = {
            "from_user_id": str(user["_id"]),
            "to_user_id": data["to_user_id"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
        }

        result = connection_requests.insert_one(connection_request)
        return (
            jsonify(
                {"message": "Connection request sent", "id": str(result.inserted_id)}
            ),
            201,
        )

    except Exception as e:
        print(f"Error creating connection request: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/connections/requests", methods=["GET"])
@jwt_required()
def get_connection_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        user_id = str(user["_id"])

        # Get requests sent to the current user
        received_requests = list(
            connection_requests.find({"to_user_id": user_id, "status": "pending"})
        )

        # Format the response
        formatted_requests = []
        for req in received_requests:
            # Get sender details
            sender = users_collection.find_one({"_id": ObjectId(req["from_user_id"])})
            if sender:
                formatted_request = {
                    "_id": str(req["_id"]),
                    "from_user": {
                        "_id": str(sender["_id"]),
                        "name": sender.get("name", "Unknown"),
                        "email": sender.get("email", ""),
                        "role": sender.get("role", ""),
                        "dept": sender.get("dept", ""),
                        "batch": sender.get("batch", ""),
                    },
                    "status": req["status"],
                    "created_at": req["created_at"].isoformat(),
                }
                formatted_requests.append(formatted_request)

        return jsonify(formatted_requests), 200

    except Exception as e:
        print(f"Error getting connection requests: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/connections/request/<request_id>", methods=["PUT"])
@jwt_required()
def update_connection_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        data = request.get_json()

        # Validate input
        if not data.get("status") or data["status"] not in ["accepted", "rejected"]:
            return (
                jsonify({"message": "Valid status (accepted/rejected) is required"}),
                400,
            )

        # Verify the request exists and is directed to the current user
        connection_request = connection_requests.find_one(
            {
                "_id": ObjectId(request_id),
                "to_user_id": str(user["_id"]),
                "status": "pending",
            }
        )

        if not connection_request:
            return (
                jsonify(
                    {"message": "Connection request not found or already processed"}
                ),
                404,
            )

        # Update the request status
        connection_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": data["status"],
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return jsonify({"message": f"Connection request {data['status']}"}), 200

    except Exception as e:
        print(f"Error updating connection request: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/connections", methods=["GET"])
@jwt_required()
def get_connections():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        user_id = str(user["_id"])

        # Get accepted connection requests where the current user is involved
        connections = list(
            connection_requests.find(
                {
                    "$or": [
                        {"from_user_id": user_id, "status": "accepted"},
                        {"to_user_id": user_id, "status": "accepted"},
                    ]
                }
            )
        )

        # Format the response
        formatted_connections = []
        for conn in connections:
            # Determine the other user in the connection
            other_user_id = (
                conn["to_user_id"]
                if conn["from_user_id"] == user_id
                else conn["from_user_id"]
            )
            other_user = users_collection.find_one({"_id": ObjectId(other_user_id)})

            if other_user:
                formatted_connection = {
                    "_id": str(conn["_id"]),
                    "user": {
                        "_id": str(other_user["_id"]),
                        "name": other_user.get("name", "Unknown"),
                        "email": other_user.get("email", ""),
                        "role": other_user.get("role", ""),
                        "dept": other_user.get("dept", ""),
                        "batch": other_user.get("batch", ""),
                    },
                    "connected_at": conn.get(
                        "updated_at", conn["created_at"]
                    ).isoformat(),
                }
                formatted_connections.append(formatted_connection)

        return jsonify(formatted_connections), 200

    except Exception as e:
        print(f"Error getting connections: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@app.route("/connections/stats", methods=["GET"])
@jwt_required()
def get_connection_stats():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        user_id = str(user["_id"])
        user_role = user.get("role", "").lower()
        user_dept = user.get("dept", "")

        # Get count of pending requests
        pending_requests = connection_requests.count_documents(
            {"to_user_id": user_id, "status": "pending"}
        )

        # Get count of accepted connections
        all_connections = connection_requests.count_documents(
            {
                "$or": [
                    {"from_user_id": user_id, "status": "accepted"},
                    {"to_user_id": user_id, "status": "accepted"},
                ]
            }
        )

        stats = {
            "pending_requests": pending_requests,
            "total_connections": all_connections,
        }

        # Add role-specific statistics
        if user_role == "student":
            # Count alumni connections
            alumni_connections = connection_requests.count_documents(
                {
                    "$or": [
                        {"from_user_id": user_id, "status": "accepted"},
                        {"to_user_id": user_id, "status": "accepted"},
                    ],
                    "$expr": {
                        "$or": [
                            {
                                "$eq": [
                                    {"$literal": "alumni"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "from_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                            {
                                "$eq": [
                                    {"$literal": "alumni"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "to_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                        ]
                    },
                }
            )

            # Count student connections
            student_connections = connection_requests.count_documents(
                {
                    "$or": [
                        {"from_user_id": user_id, "status": "accepted"},
                        {"to_user_id": user_id, "status": "accepted"},
                    ],
                    "$expr": {
                        "$or": [
                            {
                                "$eq": [
                                    {"$literal": "student"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "from_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                            {
                                "$eq": [
                                    {"$literal": "student"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "to_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                        ]
                    },
                }
            )

            stats["student_connections"] = student_connections
            stats["alumni_connections"] = alumni_connections

        elif user_role == "alumni":
            # Count student connections
            student_connections = connection_requests.count_documents(
                {
                    "$or": [
                        {"from_user_id": user_id, "status": "accepted"},
                        {"to_user_id": user_id, "status": "accepted"},
                    ],
                    "$expr": {
                        "$or": [
                            {
                                "$eq": [
                                    {"$literal": "student"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "from_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                            {
                                "$eq": [
                                    {"$literal": "student"},
                                    {
                                        "$getField": {
                                            "field": "role",
                                            "input": {
                                                "$ifNull": [
                                                    {
                                                        "$getField": {
                                                            "field": "to_user",
                                                            "input": "$$ROOT",
                                                        }
                                                    },
                                                    {"$literal": {}},
                                                ]
                                            },
                                        }
                                    },
                                ]
                            },
                        ]
                    },
                }
            )

            stats["student_connections"] = student_connections

        elif user_role == "staff":
            # Count department students
            dept_students = users_collection.count_documents(
                {"role": "student", "dept": user_dept}
            )
            # Count department alumni
            dept_alumni = users_collection.count_documents(
                {"role": "alumni", "dept": user_dept}
            )

            stats["department_students"] = dept_students
            stats["department_alumni"] = dept_alumni

        return jsonify(stats), 200

    except Exception as e:
        print(f"Error getting connection stats: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


# Add this route for a simplified version of the connection stats
@app.route("/profile/connections/<user_id>", methods=["GET"])
@jwt_required()
def get_profile_connections(user_id):
    try:
        current_user = get_jwt_identity()
        requesting_user = User.find_by_email(current_user)

        # Get user whose connections we're checking
        target_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            return jsonify({"message": "User not found"}), 404

        user_role = target_user.get("role", "").lower()
        user_dept = target_user.get("dept", "")

        # Build response based on role
        response = {}

        if user_role == "student":
            # Student connections
            student_connections = users_collection.count_documents(
                {
                    "role": "student",
                    "dept": user_dept,
                    "_id": {"$ne": ObjectId(user_id)},
                }
            )
            # Alumni connections
            alumni_connections = users_collection.count_documents(
                {"role": "alumni", "dept": user_dept}
            )

            response = {"students": student_connections, "alumni": alumni_connections}

        elif user_role == "alumni":
            # Total connections (all users in their department)
            total_connections = users_collection.count_documents(
                {"dept": user_dept, "_id": {"$ne": ObjectId(user_id)}}
            )
            # Student connections
            student_connections = users_collection.count_documents(
                {"role": "student", "dept": user_dept}
            )

            response = {"total": total_connections, "students": student_connections}

        elif user_role == "staff":
            # Department students
            dept_students = users_collection.count_documents(
                {"role": "student", "dept": user_dept}
            )
            # Department alumni
            dept_alumni = users_collection.count_documents(
                {"role": "alumni", "dept": user_dept}
            )

            response = {
                "departmentStudents": dept_students,
                "departmentAlumni": dept_alumni,
            }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error getting profile connections: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


if __name__ == "__main__":
    socketio.run(app, debug=True)
