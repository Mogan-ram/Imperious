import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token,
    create_refresh_token,
)
from app.auth.models import User
from app.utils.validators import validate_user_input
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["name", "email", "password", "dept", "role"]
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Role-specific validation
        role = data.get("role", "student").lower()
        if role == "staff":
            if not data.get("staff_id"):
                return (
                    jsonify({"message": "Staff ID is required for staff registration"}),
                    400,
                )
            staff_id_pattern = f"^{data.get('dept')}\\d{{2}}$"
            if not re.match(staff_id_pattern, data.get("staff_id")):
                return (
                    jsonify(
                        {
                            "message": f"Staff ID should be in format: {data.get('dept')}01"
                        }
                    ),
                    400,
                )

        else:
            if not data.get("regno"):
                return (
                    jsonify(
                        {"message": "Register Number is required for students/alumni"}
                    ),
                    400,
                )
            if not data.get("batch"):
                return (
                    jsonify({"message": "Batch is required for students/alumni"}),
                    400,
                )

            # Convert batch to integer if possible
            try:
                data["batch"] = int(data["batch"])
            except (ValueError, TypeError):
                return jsonify({"message": "Batch must be a valid number"}), 400

            # Verify student record for students/alumni
            if not User.verify_student_record(
                regno=data.get("regno"),
                dept=data.get("dept"),
                name=data.get("name"),
                batch=data.get("batch"),
                is_alumni=role == "alumni",
            ):
                return jsonify({"message": "Student/Alumni record not found."}), 400

        # Check if email already exists
        if User.find_by_email(data.get("email")):
            return (
                jsonify({"message": "An account with this email already exists."}),
                400,
            )
        if role != "staff" and User.find_by_regno(data.get("regno")):
            return (
                jsonify(
                    {"message": "A user with this registration number already exists."}
                ),
                400,
            )

        # Create user
        user_id = User.register(data)
        if not user_id:
            return jsonify({"message": "Failed to create user."}), 500

        return jsonify({"message": "User created successfully", "id": user_id}), 201

    except Exception as e:
        current_app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"message": "An error occurred during signup"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        # Find user by email
        user = User.find_by_email(email)
        if not user:
            return jsonify({"message": "Invalid email or password"}), 401

        # Verify password
        if not User.verify_password(password, user["password"]):
            return jsonify({"message": "Invalid email or password"}), 401

        # Create tokens
        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)

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

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"message": "An error occurred during login"}), 500


@auth_bp.route("/refresh", methods=["POST"])
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
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify(message="Token refresh failed"), 401


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Remove sensitive information
        user_data = {
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "dept": user.get("dept"),
            "regno": user.get("regno"),
            "batch": user.get("batch"),
            "photo_url": user.get("photo_url"),
            "_id": str(user["_id"]),
        }

        return jsonify(user_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in profile route: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        success = User.update_profile(current_user, data)

        if success:
            return jsonify({"message": "Profile updated successfully"}), 200
        else:
            return jsonify({"message": "Failed to update profile"}), 400
    except Exception as e:
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500
