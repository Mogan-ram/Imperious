from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    get_jwt_identity,
    create_access_token,
    get_jwt,
    verify_jwt_in_request,
)
from auth import init_auth_routes, SECRET_KEY
from models import Feed, User, NewsEvent as NewsEventModel
from datetime import datetime, timedelta
from cache import get_cached_news_events
from werkzeug.utils import secure_filename
import os
import logging

app = Flask(__name__)

# Fix CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": "http://localhost:3000",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        },
        r"/news-events/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        },
    },
)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)

# Initialize auth routes
auth_functions = init_auth_routes(app)

UPLOAD_FOLDER = "/path/to/upload"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Configure logging - change DEBUG to INFO for less verbose output
logging.basicConfig(level=logging.INFO)

# Disable MongoDB debug logs
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)


# Add this error handler
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": "Invalid token"}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({"message": "Token has expired"}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"message": "Missing token"}), 401


# routes
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    return auth_functions["create_user"](data)


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        return auth_functions["login_user"](data)
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Convert ObjectId to string and remove sensitive data
        user_data = {
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "dept": user.get("dept"),
            "regno": user.get("regno"),
            "batch": user.get("batch"),
            "_id": str(user["_id"]),  # Convert ObjectId to string
        }

        return jsonify(user_data), 200
    except Exception as e:
        logging.error(f"Profile error: {str(e)}")
        return jsonify({"message": str(e)}), 400


@app.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        data = request.get_json()
        result = auth_functions["update_user_profile"](get_jwt_identity(), data)
        return result
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/feeds", methods=["GET", "POST"])
@jwt_required()
def handle_feeds():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if request.method == "GET":
            feeds = Feed.get_all()
            return jsonify(feeds), 200

        elif request.method == "POST":
            data = request.json
            feed = Feed(content=data["content"], author=current_user)
            feed_data = feed.save()

            feed_data["author"] = {
                "email": user["email"],
                "name": user["name"],
            }
            return jsonify(feed_data), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 400


# News and Events Routes
@app.route("/api/news-events", methods=["GET", "POST"])
@jwt_required()
def handle_news_events():
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
        user = User.find_by_email(user_email)

        if request.method == "GET":
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
            type = request.args.get("type")
            sort_by = request.args.get("sort_by", "created_at")
            order = int(request.args.get("order", -1))

            # Add debug logging
            logging.info(f"Fetching {type} with params: page={page}, limit={limit}")

            result = get_cached_news_events(page, limit, type, sort_by, order)

            # Add debug logging
            logging.info(f"Found {len(result.get('items', []))} items")

            return jsonify(result), 200

        elif request.method == "POST":
            # Add more detailed role checking
            user_role = user.get("role", "").lower()
            has_permission = user_role in ["staff", "alumni"]

            logging.info(
                f"Role check: user_role={user_role}, has_permission={has_permission}"
            )

            if not has_permission:
                return (
                    jsonify(
                        {
                            "message": "Permission denied",
                            "user_role": user_role,
                            "required_roles": ["staff", "alumni"],
                        }
                    ),
                    403,
                )

            data = request.form.to_dict()
            logging.info(f"Creating news/event with data: {data}")

            image_path = None
            if "image" in request.files:
                image = request.files["image"]
                if image.filename != "":
                    filename = secure_filename(image.filename)
                    image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                    image.save(image_path)
                    logging.info(f"Saved image to: {image_path}")

            result = NewsEventModel.create(data, str(user["_id"]), image_path)
            logging.info(f"Created news/event with ID: {result}")
            return jsonify({"id": result}), 201

    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return jsonify({"message": str(e)}), 400


@app.route("/api/news-events/<id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def handle_single_news_event(id):
    try:
        verify_jwt_in_request()
        user_email = get_jwt_identity()
        user = User.find_by_email(user_email)

        if request.method == "GET":
            result = NewsEventModel.get_by_id(id)
            if not result:
                return jsonify({"message": "Not found"}), 404
            return jsonify(result), 200

        # Check if user has permission to modify (staff or alumni)
        if user["role"] not in ["staff", "alumni"]:
            return jsonify({"message": "Permission denied"}), 403

        if request.method == "PUT":
            data = request.get_json()
            result = NewsEventModel.update(id, data)
            return jsonify({"success": result}), 200

        elif request.method == "DELETE":
            result = NewsEventModel.delete(id)
            return jsonify({"success": result}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
