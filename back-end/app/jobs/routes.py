from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
from app.jobs.models import Job
from app.auth.models import User
from app.utils.validators import validate_user_input

jobs_bp = Blueprint("jobs", __name__)


@jobs_bp.route("", methods=["GET", "POST"])
@jwt_required(optional=True)
def handle_jobs():
    if request.method == "GET":
        # Get query parameters
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        search_term = request.args.get("search", None)
        location = request.args.get("location", None)
        job_type = request.args.get("job_type", None)
        sort_by = request.args.get("sort_by", "created_at")
        sort_order = request.args.get("sort_order", "-1")

        # Get jobs
        jobs_data = Job.get_all(
            page, limit, search_term, location, job_type, sort_by, sort_order
        )
        return jsonify(jobs_data), 200

    elif request.method == "POST":
        # Check authentication
        current_user = get_jwt_identity()
        if not current_user:
            return jsonify({"message": "Unauthorized"}), 401

        # Get user details
        user = User.find_by_email(current_user)
        if user["role"].lower() != "alumni":
            return jsonify({"message": "Only alumni can post jobs"}), 403

        # Get data
        data = request.get_json()

        # Validate required fields
        required_fields = [
            "title",
            "company",
            "location",
            "description",
            "job_type",
            "requirements",
        ]
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Validate job_type is a list
        if not isinstance(data["job_type"], list):
            return jsonify({"message": "job_type must be a list"}), 400

        # Add user ID
        data["posted_by"] = str(user["_id"])

        # Create job
        job_id = Job.create(data)

        return jsonify({"id": job_id}), 201


@jobs_bp.route("/<id>", methods=["GET", "PUT", "DELETE"])
@jwt_required(optional=True)
def handle_single_job(id):
    # Get job
    job = Job.get_by_id(id)

    if not job:
        return jsonify({"message": "Job not found"}), 404

    if request.method == "GET":
        return jsonify(job), 200

    elif request.method == "PUT":
        # Check authentication
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if (
            not user
            or user["role"].lower() != "alumni"
            or str(user["_id"]) != job["posted_by"]
        ):
            return jsonify({"message": "Unauthorized"}), 403

        # Get data
        data = request.get_json()

        # Update job
        if Job.update(id, data):
            return jsonify({"message": "Job updated successfully"}), 200
        else:
            return jsonify({"message": "Job not found or not modified."}), 400

    elif request.method == "DELETE":
        # Check authentication
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "Unauthorized"}), 403

        # Check if user is authorized to delete
        is_owner = str(user["_id"]) == job["posted_by"]
        is_staff = user["role"].lower() == "staff"

        if not (is_owner or is_staff):
            return jsonify({"message": "Unauthorized"}), 403

        # Delete job
        if Job.delete(id):
            return jsonify({"message": "Job deleted successfully"}), 200
        else:
            return jsonify({"message": "Job not found."}), 404
