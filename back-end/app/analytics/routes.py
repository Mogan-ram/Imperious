from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.analytics.models import Analytics
from app.auth.models import User
from app.mentorship.models import MentorshipRequest

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization: Only staff/admin can access analytics
        if not user or user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Aggregate analytics data
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
        current_app.logger.error(f"Error in analytics route: {str(e)}")
        return jsonify({"message": "An error occurred while fetching analytics"}), 500


@analytics_bp.route("/analytics/users", methods=["GET"])
@jwt_required()
def get_users_list():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization check
        if not user or user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Get query parameters for filtering
        role = request.args.get("role")
        dept = request.args.get("dept")
        batch = request.args.get("batch")
        regno = request.args.get("regno")
        created_at = request.args.get("created_at")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))

        # Get users
        users_data = Analytics.get_all_users(
            role, dept, batch, regno, created_at, page, per_page
        )

        return jsonify(users_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_users_list route: {str(e)}")
        return jsonify({"message": "An error occurred while fetching user list"}), 500


@analytics_bp.route("/alumni/willingness", methods=["GET", "OPTIONS"])
@jwt_required()
def get_alumni_willingness():
    if request.method == "OPTIONS":
        return "", 200
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization check
        if not user or user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Get filter parameter
        willingness_filter = request.args.get("willingness", "")

        # Get alumni data
        alumni_data = Analytics.get_alumni_by_willingness(willingness_filter)

        return jsonify(alumni_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in /alumni/willingness: {str(e)}")
        return (
            jsonify({"message": "An error occurred while fetching alumni data."}),
            500,
        )


@analytics_bp.route("/alumni/<alumnus_id>/mentees", methods=["GET", "OPTIONS"])
@jwt_required()
def get_alumni_mentees(alumnus_id):

    if request.method == "OPTIONS":
        return "", 200
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization check
        if not user or user["role"].lower() not in ["staff", "admin", "alumni"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Check if alumni is accessing other alumni details
        if user["role"].lower() == "alumni" and user["email"] != alumnus_id:
            return jsonify({"message": "Unauthorized"}), 403

        # Get mentees data
        mentees_data = MentorshipRequest.get_mentees_by_mentor(alumnus_id)

        return jsonify(mentees_data), 200

    except Exception as e:
        current_app.logger.error(f"Error in /alumni/<alumnus_id>/mentees: {str(e)}")
        return jsonify({"message": "An error occurred while fetching mentees."}), 500


@analytics_bp.route("/alumni/<alumnus_id>/posts", methods=["GET", "OPTIONS"])
@jwt_required()
def get_alumni_posts(alumnus_id):
    if request.method == "OPTIONS":
        return "", 200
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization check
        if not user or user["role"].lower() not in ["staff", "admin", "alumni"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Check if alumni is accessing other alumni details
        if user["role"].lower() == "alumni" and user["email"] != alumnus_id:
            return jsonify({"message": "Unauthorized"}), 403

        # Get posts
        posts = Analytics.get_posts_by_author(alumnus_id)

        return jsonify(posts), 200

    except Exception as e:
        current_app.logger.error(f"Error in /alumni/<alumnus_id>/posts: {str(e)}")
        return jsonify({"message": "An error occurred while fetching posts."}), 500
