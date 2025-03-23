from flask import jsonify
from app.auth.models import User
from app.models.base import (
    collaboration_requests,
    projects_collection,
    users_collection,
)
from bson import ObjectId
from datetime import datetime, timezone
import logging

from app.utils.helpers import mongo_to_json_serializable

logger = logging.getLogger(__name__)


class Collaboration:
    @staticmethod
    def explore_projects(user_id, dept=None, tech=None):
        """
        Get projects available for collaboration.
        """
        try:
            logger.info(
                f"Explore projects called with user_id: {user_id}, dept: {dept}, tech: {tech}"
            )

            # Convert user_id to ObjectId if it's a string
            if isinstance(user_id, str) and len(user_id) == 24:
                try:
                    user_id_obj = ObjectId(user_id)
                    logger.info(f"Converted user_id to ObjectId: {user_id_obj}")
                except:
                    user_id_obj = user_id
                    logger.info(
                        f"Failed to convert user_id to ObjectId, using as is: {user_id}"
                    )
            else:
                user_id_obj = user_id
                logger.info(f"User ID not converted: {user_id_obj}")

            # Simple query that should return results - find all projects
            all_projects = list(projects_collection.find())
            logger.info(f"Total projects in database: {len(all_projects)}")

            # Now filter out user's own projects
            filtered_projects = []
            for project in all_projects:
                project_creator_id = project.get("created_by")

                # Skip projects created by the current user
                should_skip = False

                # Convert both IDs to strings for comparison
                if isinstance(project_creator_id, ObjectId):
                    project_creator_str = str(project_creator_id)
                else:
                    project_creator_str = str(project_creator_id)

                user_id_str = str(user_id)

                logger.info(
                    f"Comparing project creator {project_creator_str} with user {user_id_str}"
                )

                if project_creator_str == user_id_str:
                    should_skip = True
                    logger.info(
                        f"Skipping project {project.get('_id')} - created by current user"
                    )

                if not should_skip:
                    # Full serialization for the project
                    serialized_project = {}

                    for key, value in project.items():
                        if isinstance(value, ObjectId):
                            serialized_project[key] = str(value)
                        elif isinstance(value, datetime):
                            serialized_project[key] = value.isoformat()
                        elif isinstance(value, list):
                            serialized_project[key] = [
                                str(item) if isinstance(item, ObjectId) else item
                                for item in value
                            ]
                        else:
                            serialized_project[key] = value

                    # Get creator details
                    if "created_by" in project:
                        creator = users_collection.find_one(
                            {"_id": project["created_by"]}
                        )
                        if creator:
                            serialized_project["creator"] = {
                                "name": creator.get("name", "Unknown"),
                                "dept": creator.get("dept", "Unknown"),
                                "_id": str(creator["_id"]),
                            }

                    filtered_projects.append(serialized_project)

            logger.info(f"Returning {len(filtered_projects)} projects after filtering")
            return filtered_projects

        except Exception as e:
            logger.error(f"Error exploring projects: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return []

    @staticmethod
    def create_request(student_id, project_id, message):
        """
        Create a collaboration request.

        Args:
            student_id: Student ID (requester)
            project_id: Project ID
            message: Request message

        Returns:
            dict: Result with success status and other info
        """
        try:
            # Get project details to get owner_id
            project = projects_collection.find_one({"_id": ObjectId(project_id)})

            if not project:
                return {
                    "success": False,
                    "message": "Project not found",
                    "status_code": 404,
                }

            # Check if request already exists
            existing_request = collaboration_requests.find_one(
                {
                    "project_id": ObjectId(project_id),
                    "student_id": ObjectId(student_id),
                    "status": "pending",
                }
            )

            if existing_request:
                return {
                    "success": False,
                    "message": "Request already exists",
                    "status_code": 400,
                }

            # Create collaboration request
            request_data = {
                "project_id": ObjectId(project_id),
                "student_id": ObjectId(student_id),
                "project_owner_id": project["created_by"],
                "message": message,
                "status": "pending",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "messages": [],
            }

            result = collaboration_requests.insert_one(request_data)

            return {"success": True, "request_id": str(result.inserted_id)}

        except Exception as e:
            logger.error(f"Error creating collaboration request: {e}")
            return {"success": False, "message": str(e), "status_code": 500}

    @staticmethod
    def get_incoming_requests(user_id):
        """
        Get incoming collaboration requests.
        """
        try:
            logger.info(f"Getting incoming requests for user_id: {user_id}")

            # Convert user_id to string for consistent comparison
            user_id_str = str(user_id)

            # Get all collaboration requests
            all_requests = list(collaboration_requests.find())
            logger.info(
                f"Total collaboration requests in database: {len(all_requests)}"
            )

            # Get all projects
            all_projects = list(projects_collection.find())
            logger.info(f"Total projects in database: {len(all_projects)}")

            # Get all users for later reference
            all_users = list(users_collection.find())
            logger.info(f"Total users in database: {len(all_users)}")

            # Filter requests where user is project owner
            incoming_requests = []

            for req in all_requests:
                # Get project owner ID
                project_owner_id = req.get("project_owner_id")

                # Convert to string if ObjectId
                if isinstance(project_owner_id, ObjectId):
                    project_owner_str = str(project_owner_id)
                else:
                    project_owner_str = str(project_owner_id)

                # Compare with user ID
                if project_owner_str == user_id_str:
                    logger.info(
                        f"Found incoming request {req.get('_id')} for project {req.get('project_id')}"
                    )
                    incoming_requests.append(req)

            # Format requests with project and student details
            formatted_requests = []

            for req in incoming_requests:
                # Get project ID
                project_id = req.get("project_id")

                # Find matching project
                matching_project = None
                for p in all_projects:
                    if str(p.get("_id")) == str(project_id):
                        matching_project = p
                        break

                # Get student ID
                student_id = req.get("student_id")

                # Find matching student
                matching_student = None
                for u in all_users:
                    if str(u.get("_id")) == str(student_id):
                        matching_student = u
                        break

                if matching_project and matching_student:
                    # Create formatted request
                    formatted_req = {
                        "_id": str(req.get("_id")),
                        "status": req.get("status", "pending"),
                        "message": req.get("message", ""),
                        "created_at": (
                            req.get("created_at").isoformat()
                            if hasattr(req.get("created_at"), "isoformat")
                            else str(req.get("created_at"))
                        ),
                        "updated_at": (
                            req.get("updated_at").isoformat()
                            if hasattr(req.get("updated_at"), "isoformat")
                            else str(req.get("updated_at"))
                        ),
                        "project": {
                            "_id": str(matching_project.get("_id")),
                            "title": matching_project.get("title", "Untitled"),
                            "abstract": matching_project.get("abstract", ""),
                            "tech_stack": matching_project.get("tech_stack", []),
                        },
                        "student": {
                            "_id": str(matching_student.get("_id")),
                            "name": matching_student.get("name", "Unknown"),
                            "dept": matching_student.get("dept", ""),
                        },
                    }

                    # Add messages if any
                    if "messages" in req and req["messages"]:
                        formatted_req["messages"] = []

                        for msg in req["messages"]:
                            sender_id = msg.get("sender_id")
                            sender = None

                            for u in all_users:
                                if str(u.get("_id")) == str(sender_id):
                                    sender = u
                                    break

                            formatted_req["messages"].append(
                                {
                                    "sender_id": str(sender_id),
                                    "sender_name": (
                                        sender.get("name", "Unknown")
                                        if sender
                                        else "Unknown"
                                    ),
                                    "content": msg.get("content", ""),
                                    "sent_at": (
                                        msg.get("sent_at").isoformat()
                                        if hasattr(msg.get("sent_at"), "isoformat")
                                        else str(msg.get("sent_at"))
                                    ),
                                }
                            )

                    formatted_requests.append(formatted_req)

            logger.info(
                f"Returning {len(formatted_requests)} formatted incoming requests"
            )
            return formatted_requests

        except Exception as e:
            logger.error(f"Error getting incoming requests: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return []

    @staticmethod
    def update_request(request_id, user_id, status):
        """
        Update a collaboration request.

        Args:
            request_id: Request ID
            user_id: User ID (project owner)
            status: New status

        Returns:
            dict: Result with success status
        """
        try:
            # Get the request
            collab_request = collaboration_requests.find_one(
                {"_id": ObjectId(request_id)}
            )

            if not collab_request:
                return {
                    "success": False,
                    "message": "Request not found",
                    "status_code": 404,
                }

            # Get project
            project = projects_collection.find_one(
                {"_id": collab_request["project_id"]}
            )

            if not project:
                return {
                    "success": False,
                    "message": "Project not found",
                    "status_code": 404,
                }

            # Verify user owns the project
            if str(project["created_by"]) != user_id:
                return {
                    "success": False,
                    "message": "Not authorized",
                    "status_code": 403,
                }

            # Update request status
            collaboration_requests.update_one(
                {"_id": ObjectId(request_id)},
                {
                    "$set": {
                        "status": status,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )

            # If accepted, add collaborator to project
            if status == "accepted":
                # Get student details
                student = users_collection.find_one(
                    {"_id": collab_request["student_id"]}
                )

                if student:
                    # Add collaborator to project
                    projects_collection.update_one(
                        {"_id": collab_request["project_id"]},
                        {
                            "$addToSet": {
                                "collaborators": {
                                    "id": str(student["_id"]),
                                    "name": student["name"],
                                    "dept": student["dept"],
                                    "joined_at": datetime.now(timezone.utc),
                                }
                            }
                        },
                    )

            return {"success": True}

        except Exception as e:
            logger.error(f"Error updating collaboration request: {e}")
            return {"success": False, "message": str(e), "status_code": 500}

    @staticmethod
    def add_message(request_id, sender_id, message):
        """
        Add a message to a collaboration request.

        Args:
            request_id: Request ID
            sender_id: User ID of the sender
            message: Message content

        Returns:
            bool: Success status
        """
        try:
            # Prepare message data
            message_data = {
                "sender_id": sender_id,
                "content": message,
                "sent_at": datetime.now(timezone.utc),
            }

            # Add message to request
            result = collaboration_requests.update_one(
                {"_id": ObjectId(request_id)},
                {
                    "$push": {"messages": message_data},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error adding message: {e}")
            return False

    @staticmethod
    def get_collaborated_projects(user_id):
        """
        Get projects where the user is a collaborator.
        """
        try:
            logger.info(f"Getting collaborated projects for user_id: {user_id}")

            # Convert user_id to ObjectId if possible for query
            if isinstance(user_id, str) and len(user_id) == 24:
                try:
                    user_id_obj = ObjectId(user_id)
                    logger.info(f"Converted user_id to ObjectId: {user_id_obj}")
                except:
                    user_id_obj = user_id
                    logger.info(
                        f"Failed to convert user_id to ObjectId, using as is: {user_id}"
                    )
            else:
                user_id_obj = user_id

            user_id_str = str(user_id)
            logger.info(f"User ID string: {user_id_str}")

            # Get all projects first
            all_projects = list(projects_collection.find())
            logger.info(f"Total projects in database: {len(all_projects)}")

            # Get all collaboration requests
            all_requests = list(collaboration_requests.find())
            logger.info(
                f"Total collaboration requests in database: {len(all_requests)}"
            )

            # Find accepted collaboration requests for this user
            accepted_requests = []
            for req in all_requests:
                student_id = req.get("student_id")

                # Convert student_id to string if it's an ObjectId
                if isinstance(student_id, ObjectId):
                    student_id_str = str(student_id)
                else:
                    student_id_str = str(student_id)

                if req.get("status") == "accepted" and student_id_str == user_id_str:
                    accepted_requests.append(req)

            logger.info(
                f"Found {len(accepted_requests)} accepted requests for user {user_id_str}"
            )

            # Build list of projects
            collaborated_projects = []

            for req in accepted_requests:
                project_id = req.get("project_id")

                # Convert to ObjectId if string
                if isinstance(project_id, str) and len(project_id) == 24:
                    try:
                        project_id = ObjectId(project_id)
                    except:
                        pass

                # Find the project
                project = None
                for p in all_projects:
                    if str(p.get("_id")) == str(project_id):
                        project = p
                        break

                if project:
                    # Create serializable project object
                    serialized_project = {}

                    for key, value in project.items():
                        if isinstance(value, ObjectId):
                            serialized_project[key] = str(value)
                        elif isinstance(value, datetime):
                            serialized_project[key] = value.isoformat()
                        elif isinstance(value, list):
                            serialized_project[key] = [
                                (
                                    str(item)
                                    if isinstance(item, ObjectId)
                                    else (
                                        item.isoformat()
                                        if isinstance(item, datetime)
                                        else item
                                    )
                                )
                                for item in value
                            ]
                        else:
                            serialized_project[key] = value

                    # Add project owner details
                    owner_id = project.get("created_by")
                    if owner_id:
                        # Find owner in users collection
                        if isinstance(owner_id, str) and len(owner_id) == 24:
                            try:
                                owner_id = ObjectId(owner_id)
                            except:
                                pass

                        owner = users_collection.find_one({"_id": owner_id})
                        if owner:
                            serialized_project["owner"] = {
                                "id": str(owner.get("_id")),
                                "name": owner.get("name", "Unknown"),
                                "dept": owner.get("dept", ""),
                            }

                    # Add collaborator info
                    serialized_project["collaborators"] = [
                        {
                            "id": user_id_str,
                            "name": "You",
                            "joined_at": (
                                req.get("updated_at", datetime.now()).isoformat()
                                if hasattr(
                                    req.get("updated_at", datetime.now()), "isoformat"
                                )
                                else str(req.get("updated_at", ""))
                            ),
                        }
                    ]

                    collaborated_projects.append(serialized_project)

            logger.info(f"Returning {len(collaborated_projects)} collaborated projects")
            return collaborated_projects

        except Exception as e:
            logger.error(f"Error getting collaborated projects: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return []

    @staticmethod
    def get_outgoing_requests(user_id):
        """
        Get outgoing collaboration requests.
        """
        try:
            logger.info(f"Getting outgoing requests for user_id: {user_id}")

            # Convert user_id to string for consistent comparison
            user_id_str = str(user_id)

            # Get all collaboration requests
            all_requests = list(collaboration_requests.find())
            logger.info(
                f"Total collaboration requests in database: {len(all_requests)}"
            )

            # Get all projects
            all_projects = list(projects_collection.find())
            logger.info(f"Total projects in database: {len(all_projects)}")

            # Get all users for later reference
            all_users = list(users_collection.find())
            logger.info(f"Total users in database: {len(all_users)}")

            # Filter requests where user is student (requester)
            outgoing_requests = []

            for req in all_requests:
                # Get student ID
                student_id = req.get("student_id")

                # Convert to string if ObjectId
                if isinstance(student_id, ObjectId):
                    student_id_str = str(student_id)
                else:
                    student_id_str = str(student_id)

                # Compare with user ID
                if student_id_str == user_id_str:
                    logger.info(
                        f"Found outgoing request {req.get('_id')} for project {req.get('project_id')}"
                    )
                    outgoing_requests.append(req)

            # Format requests with project and owner details
            formatted_requests = []

            for req in outgoing_requests:
                # Get project ID
                project_id = req.get("project_id")

                # Find matching project
                matching_project = None
                for p in all_projects:
                    if str(p.get("_id")) == str(project_id):
                        matching_project = p
                        break

                if matching_project:
                    # Get project owner
                    owner_id = matching_project.get("created_by")
                    matching_owner = None

                    for u in all_users:
                        if str(u.get("_id")) == str(owner_id):
                            matching_owner = u
                            break

                    # Create formatted request
                    formatted_req = {
                        "_id": str(req.get("_id")),
                        "status": req.get("status", "pending"),
                        "message": req.get("message", ""),
                        "created_at": (
                            req.get("created_at").isoformat()
                            if hasattr(req.get("created_at"), "isoformat")
                            else str(req.get("created_at"))
                        ),
                        "updated_at": (
                            req.get("updated_at").isoformat()
                            if hasattr(req.get("updated_at"), "isoformat")
                            else str(req.get("updated_at"))
                        ),
                        "project": {
                            "_id": str(matching_project.get("_id")),
                            "title": matching_project.get("title", "Untitled"),
                            "abstract": matching_project.get("abstract", ""),
                            "tech_stack": matching_project.get("tech_stack", []),
                        },
                    }

                    # Add owner details if found
                    if matching_owner:
                        formatted_req["project"]["owner_name"] = matching_owner.get(
                            "name", "Unknown"
                        )
                        formatted_req["project"]["owner_dept"] = matching_owner.get(
                            "dept", ""
                        )

                    # Add messages if any
                    if "messages" in req and req["messages"]:
                        formatted_req["messages"] = []

                        for msg in req["messages"]:
                            sender_id = msg.get("sender_id")
                            sender = None

                            for u in all_users:
                                if str(u.get("_id")) == str(sender_id):
                                    sender = u
                                    break

                            formatted_req["messages"].append(
                                {
                                    "sender_id": str(sender_id),
                                    "sender_name": (
                                        sender.get("name", "Unknown")
                                        if sender
                                        else "Unknown"
                                    ),
                                    "content": msg.get("content", ""),
                                    "sent_at": (
                                        msg.get("sent_at").isoformat()
                                        if hasattr(msg.get("sent_at"), "isoformat")
                                        else str(msg.get("sent_at"))
                                    ),
                                }
                            )

                    formatted_requests.append(formatted_req)

            logger.info(
                f"Returning {len(formatted_requests)} formatted outgoing requests"
            )
            return formatted_requests

        except Exception as e:
            logger.error(f"Error getting outgoing requests: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return []
