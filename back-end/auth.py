import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from models import User

SECRET_KEY = os.urandom(24).hex()


def init_auth_routes(app):
    def get_profile_handler():
        try:
            current_user = get_jwt_identity()
            user = User.find_by_email(current_user)

            if not user:
                return jsonify({"message": "User not found"}), 404

            # Remove sensitive information and convert ObjectId to string
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
            print(f"Error in profile route: {str(e)}")
            return jsonify({"message": "Internal server error"}), 500

    def login_user(data):
        try:
            email = data.get("email")
            password = data.get("password")

            user = User.find_by_email(email)
            if not user:
                return jsonify({"message": "User not found"}), 404

            # Create access token
            access_token = create_access_token(identity=email)

            # Make sure role is included and properly cased
            return (
                jsonify(
                    {
                        "token": access_token,
                        "user": {
                            "email": user["email"],
                            "name": user["name"],
                            "role": user["role"].lower(),  # Ensure role is lowercase
                        },
                    }
                ),
                200,
            )

        except Exception as e:
            return jsonify({"message": str(e)}), 400

    # Return the functions
    return {
        "create_user": create_user,
        "login_user": login_user,
        "get_profile_handler": get_profile_handler,
        "update_user_profile": update_user_profile,
    }


def create_user(data):
    # Hash password before saving
    password = data["password"].encode("utf-8")
    hashed_pwd = bcrypt.hashpw(password, bcrypt.gensalt())

    user = User(
        name=data["name"],
        dept=data["dept"],
        role=data.get("role", "student").lower(),  # Normalize role
        regno=data["regno"],
        batch=data["batch"],
        email=data["email"],
        password=hashed_pwd,
    )
    user.save()
    return jsonify({"message": "User created successfully"}), 201


def get_user_profile(token):
    if not token:
        return jsonify({"message": "Token is missing"}), 400
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.find_by_email(payload["email"])
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Remove sensitive information
        user.pop("password", None)
        return jsonify(user), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        print(f"Profile error: {str(e)}")  # Add server-side logging
        return jsonify({"message": "Error processing request"}), 400


def update_user_profile(token, data):
    if not token or not token.startswith("Bearer "):
        return jsonify({"message": "Token is missing or invalid"}), 400
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        User.update_by_email(payload["email"], data)
        return jsonify({"message": "Profile updated successfully"}), 200
    except jwt.DecodeError:
        return jsonify({"message": "Invalid token"}), 401
