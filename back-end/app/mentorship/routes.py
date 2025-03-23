from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.mentorship.models import MentorshipRequest
from app.auth.models import User
from app.utils.validators import validate_user_input
from bson import ObjectId

mentorship_bp = Blueprint("mentorship", __name__)


@mentorship_bp.route("/request", methods=["POST"])
@jwt_required()
def create_mentorship_request():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get data
        data = request.get_json()

        # Validate required fields
        required_fields = ["project_id", "message"]
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Add student ID to data
        data["student_id"] = str(user["_id"])

        # Create mentorship request
        request_id = MentorshipRequest.create(data)

        if not request_id:
            return jsonify({"message": "Failed to create request"}), 500

        return (
            jsonify({"message": "Request created successfully", "id": request_id}),
            201,
        )

    except Exception as e:
        current_app.logger.error(f"Error creating mentorship request: {str(e)}")
        return jsonify({"message": str(e)}), 500


@mentorship_bp.route("/requests", methods=["GET"])
@jwt_required()
def get_mentorship_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get requests based on role
        if user["role"] == "student":
            requests = MentorshipRequest.get_student_requests(str(user["_id"]))
        else:
            requests = MentorshipRequest.get_mentor_requests(str(user["_id"]))

        return jsonify(requests), 200

    except Exception as e:
        current_app.logger.error(f"Error getting mentorship requests: {str(e)}")
        return jsonify({"message": str(e)}), 500


@mentorship_bp.route("/mentors", methods=["GET"])
@jwt_required()
def get_mentors():
    try:
        # Get all mentors (alumni users)
        mentors = MentorshipRequest.get_mentors()
        return jsonify(mentors), 200

    except Exception as e:
        current_app.logger.error(f"Error getting mentors: {str(e)}")
        return jsonify({"message": str(e)}), 500


@mentorship_bp.route("/request/<request_id>", methods=["PUT"])
@jwt_required()
def update_mentorship_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Only alumni can update requests
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        # Get data
        data = request.get_json()
        status = data.get("status")

        if not status or status not in ["accepted", "rejected"]:
            return jsonify({"message": "Invalid status"}), 400

        # Update request
        if status == "accepted":
            success = MentorshipRequest.update_request(
                request_id, status, mentor_id=str(user["_id"])
            )
        else:
            success = MentorshipRequest.update_request(request_id, status)

        if success:
            return jsonify({"message": f"Request {status} successfully"}), 200
        else:
            return jsonify({"message": "Request not found or not modified"}), 404

    except Exception as e:
        current_app.logger.error(f"Error updating mentorship request: {str(e)}")
        return jsonify({"message": "An error occurred while updating the request"}), 500


@mentorship_bp.route("/request/<request_id>/ignore", methods=["PUT"])
@jwt_required()
def ignore_mentorship_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Only alumni can ignore requests
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        # Ignore request
        success = MentorshipRequest.ignore_request(request_id, user["email"])

        if success:
            return jsonify({"message": "Request ignored"}), 200
        else:
            return jsonify({"message": "Request not found or already ignored"}), 404

    except Exception as e:
        current_app.logger.error(f"Error ignoring mentorship request: {str(e)}")
        return jsonify({"message": "An error occurred while ignoring the request"}), 500


@mentorship_bp.route("/my_mentees", methods=["GET"])
@jwt_required()
def get_mentees():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Only alumni can access mentees
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Unauthorized"}), 403

        # Get mentees
        mentees_data = MentorshipRequest.get_mentees_by_mentor(user["email"])

        return jsonify(mentees_data), 200

    except Exception as e:
        current_app.logger.error(f"Error getting mentees: {str(e)}")
        return jsonify({"message": "An error occurred while fetching mentees"}), 500


@mentorship_bp.route("/mentors/willingness/<willingness_type>", methods=["GET"])
@jwt_required()
def get_mentors_by_willingness(willingness_type):
    try:
        current_user = get_jwt_identity()

        # Get mentors willing to mentor
        mentors = MentorshipRequest.get_mentors_by_willingness(willingness_type)

        return jsonify(mentors), 200

    except Exception as e:
        current_app.logger.error(f"Error getting mentors by willingness: {str(e)}")
        return jsonify({"message": str(e)}), 500
