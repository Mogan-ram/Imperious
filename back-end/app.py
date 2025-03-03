from flask import Flask, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    get_jwt_identity,
    create_access_token,
    create_refresh_token,
)
from auth import init_auth_routes, SECRET_KEY
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
)
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
from cache import get_cached_news_events
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson import ObjectId
import os
import logging
import bcrypt
import atexit
import signal
import uuid
from PIL import Image

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

# Initialize MongoDB client and database
client = MongoClient("mongodb://localhost:27017/")
db = client["imperious"]
projects_collection = db["projects"]
users_collection = db["users"]
collaboration_requests = db["collaboration_requests"]

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
        try:
            current_user = get_jwt_identity()
            user = User.find_by_email(current_user)

            if not user or user.get("role", "").lower() not in ["staff", "alumni"]:
                return jsonify({"message": "Permission denied"}), 403

            # Get form data
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
            if data["type"] == "event":
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
            else:
                return (
                    jsonify({"message": "Invalid file type"}),
                    400,
                )  # if invalid file type

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


if __name__ == "__main__":
    app.run(debug=True)
