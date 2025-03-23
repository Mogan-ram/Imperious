from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.collaborations.models import Collaboration
from app.auth.models import User
from app.projects.models import Project
from app.utils.validators import validate_user_input
from bson import ObjectId
from datetime import datetime, timezone

collaborations_bp = Blueprint("collaborations", __name__)


@collaborations_bp.route("/explore", methods=["GET"])
@jwt_required()
def explore_projects():
    try:
        current_user = get_jwt_identity()
        current_app.logger.info(f"Current user email: {current_user}")

        user = User.find_by_email(current_user)
        if not user:
            current_app.logger.error(f"User not found for email: {current_user}")
            return jsonify({"message": "User not found"}), 404

        current_app.logger.info(
            f"Found user: {user.get('name')}, ID: {user.get('_id')}"
        )

        # Get query parameters
        dept = request.args.get("dept")
        tech = request.args.get("tech")

        # Get projects for collaboration
        projects = Collaboration.explore_projects(str(user["_id"]), dept, tech)

        current_app.logger.info(f"Returning {len(projects)} projects to client")
        return jsonify(projects), 200

    except Exception as e:
        current_app.logger.error(f"Error in explore_projects: {str(e)}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        return jsonify({"message": "An error occurred while exploring projects"}), 500


@collaborations_bp.route("/request", methods=["POST"])
@jwt_required()
def create_collaboration_request():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json()

        # Validate required fields
        required_fields = ["project_id", "message"]
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Create collaboration request
        result = Collaboration.create_request(
            str(user["_id"]), data["project_id"], data["message"]
        )

        if result["success"]:
            return jsonify({"message": "Request sent successfully"}), 201
        else:
            return jsonify({"message": result["message"]}), result["status_code"]

    except Exception as e:
        current_app.logger.error(f"Error creating collaboration request: {str(e)}")
        return jsonify({"message": str(e)}), 500


@collaborations_bp.route("/requests", methods=["GET"])
@jwt_required()
def get_collaboration_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get incoming requests (as project owner)
        requests = Collaboration.get_incoming_requests(str(user["_id"]))

        return jsonify(requests), 200

    except Exception as e:
        current_app.logger.error(f"Error getting collaboration requests: {str(e)}")
        return jsonify({"message": str(e)}), 500


@collaborations_bp.route("/request/<request_id>", methods=["PUT"])
@jwt_required()
def update_collaboration_request(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json()

        if "status" not in data or data["status"] not in ["accepted", "rejected"]:
            return jsonify({"message": "Invalid status"}), 400

        # Update request
        result = Collaboration.update_request(
            request_id, str(user["_id"]), data["status"]
        )

        if result["success"]:
            return (
                jsonify(
                    {"message": f"Request {data['status']}", "status": data["status"]}
                ),
                200,
            )
        else:
            return jsonify({"message": result["message"]}), result["status_code"]

    except Exception as e:
        current_app.logger.error(f"Error updating collaboration request: {str(e)}")
        return jsonify({"message": str(e)}), 500


@collaborations_bp.route("/request/<request_id>/message", methods=["POST"])
@jwt_required()
def send_collaboration_message(request_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json()

        if "message" not in data or not data["message"].strip():
            return jsonify({"message": "Message is required"}), 400

        # Add message to request
        success = Collaboration.add_message(
            request_id, str(user["_id"]), data["message"]
        )

        if success:
            return jsonify({"message": "Message sent"}), 200
        else:
            return jsonify({"message": "Request not found"}), 404

    except Exception as e:
        current_app.logger.error(f"Error sending message: {str(e)}")
        return jsonify({"message": str(e)}), 500


@collaborations_bp.route("/collaborated", methods=["GET"])
@jwt_required()
def get_collaborated_projects():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get collaborated projects
        projects = Collaboration.get_collaborated_projects(str(user["_id"]))

        return jsonify(projects), 200

    except Exception as e:
        current_app.logger.error(f"Error getting collaborated projects: {str(e)}")
        return jsonify({"message": str(e)}), 500


@collaborations_bp.route("/outgoing", methods=["GET"])
@jwt_required()
def get_outgoing_requests():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get outgoing requests
        requests = Collaboration.get_outgoing_requests(str(user["_id"]))

        return jsonify(requests), 200

    except Exception as e:
        current_app.logger.error(f"Error getting outgoing requests: {str(e)}")
        return jsonify({"message": str(e)}), 500
