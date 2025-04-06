from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.projects.models import Project
from app.models.base import projects_collection, users_collection
from app.auth.models import User
from app.utils.validators import validate_user_input, validate_file_type
from app.utils.helpers import save_uploaded_file
from bson import ObjectId
import os
from flask.json import JSONEncoder
from datetime import datetime


projects_bp = Blueprint("projects", __name__)


@projects_bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        data = request.get_json()

        # Validate required fields
        required_fields = ["title", "abstract", "modules"]
        valid, error_msg = validate_user_input(data, required_fields=required_fields)
        if not valid:
            return jsonify({"message": error_msg}), 400

        # Create project
        project_data = {
            "title": data["title"],
            "abstract": data["abstract"],
            "techStack": data.get("techStack", []),
            "githubLink": data.get("githubLink", ""),
            "modules": data.get("modules", []),
            "progress": data.get("progress", 0),
            "created_by": user["_id"],
        }

        project_id = Project.create(project_data)

        if not project_id:
            return jsonify({"message": "Failed to create project"}), 500

        return (
            jsonify({"message": "Project created successfully", "id": str(project_id)}),
            201,
        )

    except Exception as e:
        current_app.logger.error(f"Error creating project: {str(e)}")
        return jsonify({"message": "Failed to create project"}), 500


@projects_bp.route("", methods=["GET"])
@jwt_required()
def get_projects():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get projects from the database
        projects_data = Project.get_all({"created_by": user["_id"]})

        # Use your existing serialization function
        serialized_projects = mongo_to_json_serializable(projects_data)

        return jsonify(serialized_projects), 200

    except Exception as e:
        current_app.logger.error(f"Error getting projects: {str(e)}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        return jsonify({"message": f"Failed to fetch projects: {str(e)}"}), 500


@projects_bp.route("/<project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    try:
        project = Project.get_by_id(project_id)

        if not project:
            return jsonify({"message": "Project not found"}), 404

        # Convert project to JSON-serializable format
        serialized_project = mongo_to_json_serializable(project)
        return jsonify(serialized_project), 200

    except Exception as e:
        current_app.logger.error(f"Error getting project: {str(e)}")
        return jsonify({"message": "Failed to fetch project"}), 500


@projects_bp.route("/<project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get project
        project = Project.get_by_id(project_id)

        if not project:
            return jsonify({"message": "Project not found"}), 404

        # Check ownership
        if str(project["created_by"]) != str(user["_id"]):
            return (
                jsonify(
                    {"message": "Unauthorized: Only the owner can edit this project"}
                ),
                403,
            )

        # Get update data
        data = request.get_json()

        # Whitelist allowed fields
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
            return jsonify({"message": "No valid fields provided for update"}), 400

        # Update project
        success = Project.update(project_id, update_data)

        if success:
            return jsonify({"message": "Project updated successfully"}), 200
        else:
            return jsonify({"message": "Project not updated"}), 400

    except Exception as e:
        current_app.logger.error(f"Error updating project: {str(e)}")
        return jsonify({"message": "Failed to update project"}), 500


@projects_bp.route("/<project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"message": "User not found"}), 404

        # Get project
        project = Project.get_by_id(project_id)

        if not project:
            return jsonify({"message": "Project not found"}), 404

        # Check ownership
        if str(project["created_by"]) != str(user["_id"]):
            return (
                jsonify(
                    {"message": "Unauthorized: Only the owner can delete this project"}
                ),
                403,
            )

        # Delete project
        success = Project.delete(project_id)

        if success:
            return jsonify({"message": "Project deleted successfully"}), 200
        else:
            return jsonify({"message": "Failed to delete project"}), 400

    except Exception as e:
        current_app.logger.error(f"Error deleting project: {str(e)}")
        return jsonify({"message": "Failed to delete project"}), 500


# Create a custom JSON encoder for MongoDB types
class MongoJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(MongoJSONEncoder, self).default(obj)


# This function recursively converts MongoDB objects to JSON-friendly format
def mongo_to_json_serializable(obj):
    """
    Convert MongoDB document to JSON serializable format by:
    - Converting ObjectId to string
    - Converting datetime to ISO format string
    - Handling nested documents and arrays
    """
    if isinstance(obj, dict):
        # Handle dictionaries
        return {k: mongo_to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        # Handle lists
        return [mongo_to_json_serializable(item) for item in obj]
    elif isinstance(obj, ObjectId):
        # Convert ObjectId to string
        return str(obj)
    elif isinstance(obj, datetime):
        # Convert datetime to ISO format
        return obj.isoformat()
    else:
        # Return everything else as is
        return obj


# Implement your endpoint with proper serialization
@projects_bp.route("/all", methods=["GET", "OPTIONS"])
@jwt_required()
def get_all_projects():
    """
    Get all projects across the system with enhanced creator details for analytics
    """
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        return "", 200

    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)

        # Authorization: only staff/admin can access all projects
        if not user or user["role"].lower() not in ["staff", "admin"]:
            return jsonify({"message": "Unauthorized"}), 403

        # Get all projects
        all_projects = list(projects_collection.find())

        # Enhanced projects with creator details
        enhanced_projects = []

        for project in all_projects:
            # Convert ObjectId fields to strings
            project_dict = {
                "_id": str(project["_id"]),
                "title": project.get("title", "Untitled Project"),
                "abstract": project.get("abstract", ""),
                "progress": project.get("progress", 0),
            }

            # Handle tech stack (might be under different field names)
            if "tech_stack" in project:
                project_dict["tech_stack"] = project["tech_stack"]
            elif "techStack" in project:
                project_dict["techStack"] = project["techStack"]

            # Handle dates
            if "created_at" in project:
                project_dict["created_at"] = (
                    project["created_at"].isoformat() if project["created_at"] else None
                )
            if "updated_at" in project:
                project_dict["updated_at"] = (
                    project["updated_at"].isoformat() if project["updated_at"] else None
                )

            # Handle created_by (which is a reference to a user)
            if "created_by" in project:
                creator_id = project["created_by"]
                project_dict["created_by"] = str(creator_id)

                # Find the creator user
                creator = users_collection.find_one({"_id": creator_id})
                if creator:
                    project_dict["creator"] = {
                        "_id": str(creator["_id"]),
                        "name": creator.get("name", "Unknown"),
                        "email": creator.get("email", ""),
                        "dept": creator.get("dept", "Unknown Department"),
                        "role": creator.get("role", "student"),
                    }

                    # Use creator's department if project doesn't have one
                    if not project.get("department") and creator.get("dept"):
                        project_dict["department"] = creator.get("dept")
                else:
                    project_dict["creator"] = {
                        "name": "Unknown",
                        "dept": "Unknown Department",
                    }

            # Make sure department is populated
            if "department" not in project_dict:
                project_dict["department"] = project.get(
                    "department", "Unknown Department"
                )

            # Handle collaborators
            if "collaborators" in project and project["collaborators"]:
                project_dict["collaborators"] = []

                for collab in project["collaborators"]:
                    # Handle different collaborator formats
                    collab_id = None

                    # Case 1: Collaborator is a dictionary with user_id
                    if isinstance(collab, dict) and "user_id" in collab:
                        collab_id = collab["user_id"]
                        collab_info = {
                            "id": str(collab_id),
                            "role": collab.get("role", "collaborator"),
                            "added_at": (
                                collab.get("added_at").isoformat()
                                if collab.get("added_at")
                                else None
                            ),
                        }
                    # Case 2: Collaborator is a dictionary with id
                    elif isinstance(collab, dict) and "id" in collab:
                        collab_id = collab["id"]
                        collab_info = {
                            "id": str(collab_id),
                            "name": collab.get("name", ""),
                            "dept": collab.get("dept", ""),
                        }
                    # Case 3: Collaborator is just an ID
                    elif isinstance(collab, (ObjectId, str)):
                        collab_id = collab
                        collab_info = {"id": str(collab_id)}

                    # Look up collaborator details if we have an ID
                    if collab_id:
                        if isinstance(collab_id, str) and len(collab_id) == 24:
                            # Convert string to ObjectId if it's a valid ObjectId string
                            try:
                                collab_id = ObjectId(collab_id)
                            except:
                                pass

                        if isinstance(collab_id, ObjectId):
                            collab_user = users_collection.find_one({"_id": collab_id})
                            if collab_user:
                                collab_info.update(
                                    {
                                        "name": collab_user.get("name", "Unknown"),
                                        "email": collab_user.get("email", ""),
                                        "dept": collab_user.get(
                                            "dept", "Unknown Department"
                                        ),
                                    }
                                )

                        project_dict["collaborators"].append(collab_info)
            else:
                project_dict["collaborators"] = []

            # Add enhanced project to the result list
            enhanced_projects.append(project_dict)

        return jsonify(enhanced_projects), 200

    except Exception as e:
        current_app.logger.error(f"Error getting all projects: {str(e)}")
        import traceback

        current_app.logger.error(traceback.format_exc())
        return jsonify({"message": f"Failed to fetch all projects: {str(e)}"}), 500
