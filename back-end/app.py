from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    get_jwt_identity,
    create_access_token,
    get_jwt,
)
from auth import init_auth_routes, SECRET_KEY
from models import Feed, User, NewsEvent as NewsEventModel
from datetime import datetime, timedelta

app = Flask(__name__)

# Fix CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": "http://localhost:3000",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)

# Initialize auth routes
auth_functions = init_auth_routes(app)


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
    return auth_functions["get_profile_handler"]()


@app.route("/profile", methods=["PUT"])
def update_profile():
    try:
        token = request.headers.get("Authorization")
        data = request.get_json()
        result = auth_functions["update_user_profile"](token, data)
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
@app.route("/news-events", methods=["GET", "POST"])
def handle_news_events():
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"message": "Unauthorized"}), 401

    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.find_by_email(payload["email"])

        if request.method == "GET":
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
            type = request.args.get("type")

            result = NewsEventModel.get_all(page=page, limit=limit, type=type)
            return jsonify(result), 200

        elif request.method == "POST":
            # Check if user has permission to create (staff or alumni)
            if user["role"] not in ["staff", "alumni"]:
                return jsonify({"message": "Permission denied"}), 403

            data = request.get_json()
            result = NewsEventModel.create(data, str(user["_id"]))
            return jsonify({"id": result}), 201

    except jwt.DecodeError:
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/news-events/<id>", methods=["GET", "PUT", "DELETE"])
def handle_single_news_event(id):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return jsonify({"message": "Unauthorized"}), 401

    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.find_by_email(payload["email"])

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

    except jwt.DecodeError:
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"message": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
