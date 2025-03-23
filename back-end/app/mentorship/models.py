from app.models.base import mentorship_requests, users_collection, projects_collection
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MentorshipRequest:
    @staticmethod
    def create(data):
        """
        Create a new mentorship request.

        Args:
            data: Dictionary containing request data

        Returns:
            str: ID of the created request or None if failed
        """
        try:
            # Convert IDs to ObjectId
            student_id = ObjectId(data["student_id"])
            project_id = ObjectId(data["project_id"])

            # Create request
            request_data = {
                "student_id": student_id,
                "project_id": project_id,
                "message": data["message"],
                "status": "pending",
                "created_at": datetime.utcnow(),
                "mentor_id": None,
                "ignored_by": [],
            }

            # Insert request
            result = mentorship_requests.insert_one(request_data)
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error creating mentorship request: {e}")
            return None

    @staticmethod
    def get_student_requests(student_id):
        """
        Get mentorship requests for a student.

        Args:
            student_id: Student ID

        Returns:
            list: List of requests with project details
        """
        try:
            # Convert ID to ObjectId
            if not isinstance(student_id, ObjectId):
                student_id = ObjectId(student_id)

            # Get requests
            requests = list(mentorship_requests.find({"student_id": student_id}))

            # Process requests
            for request in requests:
                # Get project details
                project = projects_collection.find_one({"_id": request["project_id"]})

                if project:
                    request["project"] = {
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "_id": str(project["_id"]),
                        "created_by": str(project["created_by"]),
                    }

                    # Get project owner details
                    owner = users_collection.find_one({"_id": project["created_by"]})
                    if owner:
                        request["project"]["owner_name"] = owner.get("name")
                        request["project"]["owner_dept"] = owner.get("dept")

                # Convert ObjectIds to strings
                request["_id"] = str(request["_id"])
                request["student_id"] = str(request["student_id"])
                request["project_id"] = str(request["project_id"])

                if "mentor_id" in request and request["mentor_id"]:
                    mentor_id = request["mentor_id"]
                    if isinstance(mentor_id, str):
                        try:
                            mentor_id = ObjectId(mentor_id)
                        except:
                            pass

                    mentor = users_collection.find_one({"_id": mentor_id})
                    if mentor:
                        request["mentor"] = {
                            "_id": str(mentor["_id"]),
                            "name": mentor.get("name", "Unknown"),
                            "email": mentor.get("email", ""),
                            "dept": mentor.get("dept", ""),
                        }
                    else:
                        request["mentor"] = {"name": "Unknown", "email": "", "dept": ""}

                # Format dates
                if "created_at" in request:
                    request["created_at"] = request["created_at"].isoformat()

            return requests

        except Exception as e:
            logger.error(f"Error getting student requests: {e}")
            return []

    @staticmethod
    def get_mentor_requests(mentor_id):
        """
        Get mentorship requests for potential mentors.

        Args:
            mentor_id: Mentor ID (unused, gets all pending requests)

        Returns:
            list: List of requests with project and student details
        """
        try:
            # Get all pending requests
            requests = list(mentorship_requests.find())

            # Process requests
            for request in requests:
                # Get project details
                project = projects_collection.find_one({"_id": request["project_id"]})

                if project:
                    request["project"] = {
                        "_id": str(project["_id"]),
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "created_by": str(project["created_by"]),
                    }

                    # Get project owner details
                    owner = users_collection.find_one({"_id": project["created_by"]})
                    if owner:
                        request["project"]["owner_name"] = owner.get("name")
                        request["project"]["owner_dept"] = owner.get("dept")

                # Get student details
                student = users_collection.find_one({"_id": request["student_id"]})
                if student:
                    request["student"] = {
                        "_id": str(student["_id"]),
                        "name": student["name"],
                        "dept": student["dept"],
                    }

                # Convert ObjectIds to strings
                request["_id"] = str(request["_id"])
                request["student_id"] = str(request["student_id"])
                request["project_id"] = str(request["project_id"])

                if "mentor_id" in request and request["mentor_id"]:
                    request["mentor_id"] = str(request["mentor_id"])

                # Format dates
                if "created_at" in request:
                    request["created_at"] = request["created_at"].isoformat()

            return requests

        except Exception as e:
            logger.error(f"Error getting mentor requests: {e}")
            return []

    @staticmethod
    def update_request(request_id, status, mentor_id=None):
        """
        Update the status of a mentorship request and add mentor to project.

        Args:
            request_id: Request ID
            status: New status
            mentor_id: Mentor ID (if accepting request)

        Returns:
            bool: Success status
        """
        try:
            # Prepare update data
            update_data = {"status": status}

            if mentor_id:
                # Convert to ObjectId if it's a string
                if isinstance(mentor_id, str):
                    try:
                        mentor_id_obj = ObjectId(mentor_id)
                    except:
                        mentor_id_obj = mentor_id
                else:
                    mentor_id_obj = mentor_id

                update_data["mentor_id"] = mentor_id_obj

            # Update request
            result = mentorship_requests.update_one(
                {"_id": ObjectId(request_id)}, {"$set": update_data}
            )

            if result.modified_count > 0 and status == "accepted" and mentor_id:
                # Find the request to get project_id
                request = mentorship_requests.find_one({"_id": ObjectId(request_id)})
                if request and "project_id" in request:
                    # Update the project to include the mentor_id
                    # Convert mentor_id to ObjectId if it's not already
                    if isinstance(mentor_id, str):
                        try:
                            mentor_id_for_project = ObjectId(mentor_id)
                        except:
                            mentor_id_for_project = mentor_id
                    else:
                        mentor_id_for_project = mentor_id

                    project_update_result = projects_collection.update_one(
                        {"_id": request["project_id"]},
                        {"$set": {"mentor_id": mentor_id_for_project}},
                    )
                    print(
                        f"Project update result: {project_update_result.modified_count}"
                    )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating mentorship request: {e}")
            return False

    @staticmethod
    def ignore_request(request_id, user_email):
        """
        Add a user to the ignored_by list of a request.

        Args:
            request_id: Request ID
            user_email: User email to add to ignored_by

        Returns:
            bool: Success status
        """
        try:
            # Update request
            result = mentorship_requests.update_one(
                {"_id": ObjectId(request_id)}, {"$addToSet": {"ignored_by": user_email}}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error ignoring mentorship request: {e}")
            return False

    @staticmethod
    def get_mentees_by_mentor(mentor_email):
        """
        Get mentees for a mentor, including project creators and collaborators
        where the mentor is assigned.

        Args:
            mentor_email: Mentor email

        Returns:
            dict: Data structured for frontend with both raw and formatted data
        """
        try:
            # Find mentor by email
            mentor = users_collection.find_one({"email": mentor_email})
            if not mentor:
                print(f"No mentor found with email: {mentor_email}")
                return []

            mentor_id = mentor["_id"]
            mentor_name = mentor.get("name", "Unknown")
            mentor_dept = mentor.get("dept", "")

            # Find projects where this mentor is assigned
            projects = list(projects_collection.find({"mentor_id": mentor_id}))

            # If no projects found, check accepted mentorship requests
            if not projects:
                mentorship_reqs = list(
                    mentorship_requests.find(
                        {"status": "accepted", "mentor_id": mentor_id}
                    )
                )

                project_ids = [
                    req["project_id"] for req in mentorship_reqs if "project_id" in req
                ]
                if project_ids:
                    projects = list(
                        projects_collection.find({"_id": {"$in": project_ids}})
                    )

            # Store all extracted mentees for visualization
            all_mentees = []

            # Prepare project groups result
            project_groups = []

            for project in projects:
                project_id = str(project["_id"])
                project_data = {
                    "_id": project_id,
                    "title": project.get("title", "Untitled Project"),
                    "abstract": project.get("abstract", ""),
                    "progress": project.get("progress", 0),
                    "students": [],
                }

                # Add project creator as student
                if "created_by" in project:
                    creator = users_collection.find_one({"_id": project["created_by"]})
                    if creator:
                        student_data = {
                            "id": str(creator["_id"]),
                            "name": creator.get("name", "Unknown"),
                            "email": creator.get("email", ""),
                            "dept": creator.get("dept", ""),
                            "batch": creator.get("batch", ""),
                            "role": "Lead",
                        }
                        project_data["students"].append(student_data)

                        # Create mentee object for visualization
                        mentee_obj = {
                            "_id": str(creator["_id"]),
                            "student_id": str(creator["_id"]),
                            "name": creator.get("name", "Unknown"),
                            "email": creator.get("email", ""),
                            "dept": creator.get("dept", ""),
                            "batch": creator.get("batch", ""),
                            "project": {
                                "_id": project_id,
                                "title": project.get("title", "Untitled Project"),
                                "progress": project.get("progress", 0),
                            },
                        }
                        all_mentees.append(mentee_obj)

                # Add collaborators as students
                if "collaborators" in project and isinstance(
                    project["collaborators"], list
                ):
                    for collaborator in project["collaborators"]:
                        # Handle different collaborator data structures
                        collab_id = None
                        collab_name = None

                        if isinstance(collaborator, dict):
                            if "id" in collaborator:
                                collab_id = collaborator["id"]
                            elif "_id" in collaborator:
                                collab_id = collaborator["_id"]

                            collab_name = collaborator.get("name")
                        elif isinstance(collaborator, str):
                            collab_id = collaborator

                        if collab_id:
                            # Try to convert string ID to ObjectId if needed
                            try:
                                if isinstance(collab_id, str):
                                    collab_obj_id = ObjectId(collab_id)
                                else:
                                    collab_obj_id = collab_id
                            except:
                                continue

                            collab_user = users_collection.find_one(
                                {"_id": collab_obj_id}
                            )
                            if collab_user:
                                student_data = {
                                    "id": str(collab_user["_id"]),
                                    "name": collab_user.get(
                                        "name", collab_name or "Unknown"
                                    ),
                                    "email": collab_user.get("email", ""),
                                    "dept": collab_user.get("dept", ""),
                                    "batch": collab_user.get("batch", ""),
                                    "role": "Collaborator",
                                }
                                project_data["students"].append(student_data)

                                # Create mentee object for visualization
                                mentee_obj = {
                                    "_id": str(collab_user["_id"]),
                                    "student_id": str(collab_user["_id"]),
                                    "name": collab_user.get(
                                        "name", collab_name or "Unknown"
                                    ),
                                    "email": collab_user.get("email", ""),
                                    "dept": collab_user.get("dept", ""),
                                    "batch": collab_user.get("batch", ""),
                                    "project": {
                                        "_id": project_id,
                                        "title": project.get(
                                            "title", "Untitled Project"
                                        ),
                                        "progress": project.get("progress", 0),
                                    },
                                }
                                all_mentees.append(mentee_obj)

                # Only add projects with students
                if project_data["students"]:
                    project_groups.append(project_data)

            # Structure the response in the format expected by frontend components
            return {
                # Format for the mentees list table
                "project_groups": project_groups,
                # Format for the D3 visualization
                "mentees": all_mentees,
                # Mentor info for components that need it
                "mentor": {
                    "_id": str(mentor_id),
                    "name": mentor_name,
                    "email": mentor_email,
                    "dept": mentor_dept,
                },
                # For backward compatibility
                "mentees_count": len(all_mentees),
            }

        except Exception as e:
            logger.error(f"Error getting mentees by mentor: {e}")
            print(f"Error in get_mentees_by_mentor: {e}")
            traceback.print_exc()  # Print stack trace for debugging
            return {
                "project_groups": [],
                "mentees": [],
                "mentor": {
                    "_id": "",
                    "name": "Unknown",
                    "email": mentor_email,
                    "dept": "",
                },
                "mentees_count": 0,
            }

    @staticmethod
    def get_mentors():
        """
        Get all users with role "alumni" (potential mentors).

        Returns:
            list: List of alumni users
        """
        try:
            # Find alumni users
            mentors = list(users_collection.find({"role": "alumni"}))

            # Process mentors
            for mentor in mentors:
                mentor["_id"] = str(mentor["_id"])

                # Remove sensitive information
                if "password" in mentor:
                    del mentor["password"]

            return mentors

        except Exception as e:
            logger.error(f"Error getting mentors: {e}")
            return []

    @staticmethod
    def get_mentors_by_willingness(willingness_type):
        """
        Get mentors filtered by willingness type.

        Args:
            willingness_type: Type of willingness to filter by

        Returns:
            list: List of mentors
        """
        try:
            # Find alumni users willing to mentor
            mentors = list(
                users_collection.find(
                    {"role": "alumni", "willingness": willingness_type}
                )
            )

            # Process mentors
            for mentor in mentors:
                mentor["_id"] = str(mentor["_id"])

                # Remove sensitive information
                if "password" in mentor:
                    del mentor["password"]

            return mentors

        except Exception as e:
            logger.error(f"Error getting mentors by willingness: {e}")
            return []
