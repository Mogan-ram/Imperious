from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.profile.models import Profile
from app.auth.models import User
from app.utils.validators import validate_user_input, validate_file_type
from app.utils.helpers import save_uploaded_file
from bson import ObjectId
import os
import uuid

profile_bp = Blueprint("profile", __name__)
users_collection = User


@profile_bp.route("/", methods=["GET", "PUT"])
@jwt_required()
def handle_profile():
    current_user = get_jwt_identity()

    if request.method == "GET":
        try:
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
                "photo_url": user.get("photo_url"),
                "bio": user.get("bio", ""),
                "linkedin": user.get("linkedin", ""),
                "github": user.get("github", ""),
                "skills": user.get("skills", []),
                "willingness": user.get("willingness", []),
                "_id": str(user["_id"]),
            }

            return jsonify(user_data), 200

        except Exception as e:
            current_app.logger.error(f"Error in profile route: {str(e)}")
            return jsonify({"message": "Internal server error"}), 500

    elif request.method == "PUT":
        try:
            data = request.get_json()

            # Validate input
            valid_fields = ["name", "bio", "linkedin", "github", "skills"]
            update_data = {k: v for k, v in data.items() if k in valid_fields}

            # Update profile
            success = Profile.update_profile(current_user, update_data)
            if not success:
                return jsonify({"message": "Failed to update profile"}), 400

            return jsonify({"message": "Profile updated successfully"}), 200

        except Exception as e:
            current_app.logger.error(f"Error updating profile: {str(e)}")
            return jsonify({"message": "Internal server error"}), 500


@profile_bp.route("/photo", methods=["POST"])
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

        if file and validate_file_type(file.filename):
            # Create a unique filename
            filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]

            # Save file with optimization
            filepath = os.path.join(
                current_app.config["PROFILE_PHOTOS_FOLDER"], filename
            )

            try:
                # Process the file using the helper function
                save_uploaded_file(
                    file=file,
                    folder_path=current_app.config["PROFILE_PHOTOS_FOLDER"],
                    filename=filename,
                    optimize=True,
                    max_size=(500, 500),
                )

                # Update user profile with photo URL
                photo_url = f"/profile/photos/{filename}"

                # Update user document in database
                success = Profile.update_photo(current_user, photo_url)
                if not success:
                    return jsonify({"message": "Failed to update profile photo"}), 500

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
                current_app.logger.error(f"Error processing image: {str(e)}")
                return jsonify({"message": "Error processing image"}), 500

        else:
            return jsonify({"message": "File type not allowed"}), 400

    except Exception as e:
        current_app.logger.error(f"Error uploading profile photo: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@profile_bp.route("/photos/<filename>")
def serve_profile_photo(filename):
    return send_from_directory(current_app.config["PROFILE_PHOTOS_FOLDER"], filename)


@profile_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_user_profile(user_id):
    try:
        current_user = get_jwt_identity()

        # Find the target user
        if user_id == "me" or not user_id:
            # Get current user's profile
            user = User.find_by_email(current_user)
        else:
            # Find user by ID
            user = User.find_by_id(user_id)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Prepare user data - remove sensitive information
        user_data = {
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "dept": user.get("dept"),
            "regno": user.get("regno"),
            "batch": user.get("batch"),
            "photo_url": user.get("photo_url"),
            "bio": user.get("bio", ""),
            "linkedin": user.get("linkedin", ""),
            "github": user.get("github", ""),
            "skills": user.get("skills", []),
            "willingness": user.get("willingness", []),
            "_id": str(user["_id"]),
        }

        return jsonify(user_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in get user profile route: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500


@profile_bp.route("/job", methods=["GET", "POST", "PUT"])
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
            job_profile = Profile.get_job_profile(str(user["_id"]))

            if not job_profile:
                return jsonify({"message": "Job profile not found"}), 404

            return jsonify(job_profile), 200

        elif request.method in ["POST", "PUT"]:
            data = request.get_json()

            # Validate required fields
            required_fields = ["company", "job_title"]
            valid, error_msg = validate_user_input(
                data, required_fields=required_fields
            )
            if not valid:
                return jsonify({"message": error_msg}), 400

            # Create or update job profile
            result = Profile.update_job_profile(
                str(user["_id"]), data, create_if_missing=(request.method == "POST")
            )

            if result["success"]:
                return jsonify(
                    {"message": result["message"], "id": result.get("id")}
                ), result.get("status_code", 200)
            else:
                return jsonify({"message": result["message"]}), result.get(
                    "status_code", 400
                )

    except Exception as e:
        current_app.logger.error(f"Error handling job profile: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@profile_bp.route("/job/experience", methods=["POST"])
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
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Add job experience
        result = Profile.add_job_experience(str(user["_id"]), data)

        if result["success"]:
            return (
                jsonify(
                    {
                        "message": "Job experience added",
                        "experience_id": result.get("experience_id"),
                    }
                ),
                201,
            )
        else:
            return jsonify({"message": result["message"]}), result.get(
                "status_code", 400
            )

    except Exception as e:
        current_app.logger.error(f"Error adding job experience: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@profile_bp.route("/job/experience/<experience_id>", methods=["PUT", "DELETE"])
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

        # Verify the experience exists and belongs to the user
        job_profile = Profile.get_job_profile(str(user["_id"]))

        if not job_profile:
            return jsonify({"message": "Job profile not found"}), 404

        # Check if experience exists
        experience = next(
            (
                exp
                for exp in job_profile.get("experiences", [])
                if exp["_id"] == experience_id
            ),
            None,
        )

        if not experience:
            return jsonify({"message": "Experience not found"}), 404

        if request.method == "PUT":
            data = request.get_json()

            # Validate required fields
            required_fields = ["company", "job_title", "start_date"]
            valid, error_msg = validate_user_input(
                data, required_fields=required_fields
            )
            if not valid:
                return jsonify({"message": error_msg}), 400

            # Update experience
            success = Profile.update_job_experience(
                str(user["_id"]), experience_id, data
            )

            if success:
                return jsonify({"message": "Job experience updated"}), 200
            else:
                return jsonify({"message": "Failed to update job experience"}), 400

        elif request.method == "DELETE":
            # Delete experience
            success = Profile.delete_job_experience(str(user["_id"]), experience_id)

            if success:
                return jsonify({"message": "Job experience deleted"}), 200
            else:
                return jsonify({"message": "Failed to delete job experience"}), 400

    except Exception as e:
        current_app.logger.error(f"Error updating job experience: {str(e)}")
        return jsonify({"message": "An error occurred"}), 500


@profile_bp.route("/willingness", methods=["PUT"])
@jwt_required()
def update_willingness():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Only alumni can update willingness
        if user.get("role", "").lower() != "alumni":
            return (
                jsonify({"message": "Only alumni can update willingness preferences"}),
                403,
            )

        data = request.get_json()

        if "willingness" not in data or not isinstance(data["willingness"], list):
            return jsonify({"message": "Willingness must be provided as a list"}), 400

        # Update willingness
        result = users_collection.update_one(
            {"email": current_user}, {"$set": {"willingness": data["willingness"]}}
        )

        if result.modified_count > 0:
            return (
                jsonify({"message": "Willingness preferences updated successfully"}),
                200,
            )
        else:
            return jsonify({"message": "No changes made"}), 200

    except Exception as e:
        current_app.logger.error(f"Error updating willingness: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500
