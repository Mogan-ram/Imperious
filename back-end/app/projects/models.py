from app.models.base import projects_collection, users_collection
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Project:
    @staticmethod
    def create(data):
        """
        Create a new project.

        Args:
            data: Dictionary containing project data

        Returns:
            ObjectId: ID of the created project or None if failed
        """
        try:
            # Ensure created_by is ObjectId if it's not
            if "created_by" in data and not isinstance(data["created_by"], ObjectId):
                data["created_by"] = ObjectId(data["created_by"])

            # Add timestamps
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = data["created_at"]

            # Insert project
            result = projects_collection.insert_one(data)
            return result.inserted_id

        except Exception as e:
            logger.error(f"Error creating project: {str(e)}")
            return None

    @staticmethod
    def get_all(filter_query=None):
        """
        Get all projects, optionally filtered.

        Args:
            filter_query: Dictionary containing filter criteria

        Returns:
            list: List of projects
        """
        try:
            query = filter_query or {}

            if "created_by" in query:
                # Ensure it's an ObjectId
                if not isinstance(query["created_by"], ObjectId):
                    try:
                        query["created_by"] = ObjectId(query["created_by"])
                    except Exception as e:
                        print(f"Error converting created_by to ObjectId: {e}")
                        # Fallback to string comparison if conversion fails
                        query["created_by"] = str(query["created_by"])

            # Get projects
            projects = list(projects_collection.find(query))

            # Process projects
            for project in projects:
                # Convert ObjectId to string
                project["_id"] = str(project["_id"])
                project["created_by"] = str(project["created_by"])

                # Format dates
                if "created_at" in project:
                    project["created_at"] = project["created_at"].isoformat()
                if "updated_at" in project:
                    project["updated_at"] = project["updated_at"].isoformat()

                    # Enrich collaborators data
                if "collaborators" in project and project["collaborators"]:
                    enriched_collaborators = []

                    for collab in project["collaborators"]:
                        collab_id = None
                        collab_info = {}

                        # Handle different collaborator formats
                        if isinstance(collab, dict):
                            if "id" in collab:
                                collab_id = collab["id"]
                                collab_info = collab
                            elif "user_id" in collab:
                                collab_id = collab["user_id"]
                                collab_info = collab
                        elif isinstance(collab, (ObjectId, str)):
                            collab_id = collab

                        # Get collaborator details
                        if collab_id:
                            # Convert string to ObjectId if needed
                            if isinstance(collab_id, str):
                                try:
                                    collab_id = ObjectId(collab_id)
                                except:
                                    pass

                            # Look up user details
                            user = users_collection.find_one({"_id": collab_id})
                            if user:
                                collab_info.update(
                                    {
                                        "id": str(user["_id"]),
                                        "name": user.get("name", "Unknown"),
                                        "dept": user.get("dept", "Unknown"),
                                        "email": user.get("email", ""),
                                    }
                                )

                                # Keep any additional fields from the original collaborator object
                                if isinstance(collab, dict):
                                    for key, value in collab.items():
                                        if (
                                            key not in collab_info
                                            and key != "id"
                                            and key != "user_id"
                                        ):
                                            collab_info[key] = value

                                enriched_collaborators.append(collab_info)

                    # Replace original collaborators with enriched ones
                    project["collaborators"] = enriched_collaborators

            return projects

        except Exception as e:
            logger.error(f"Error getting projects: {str(e)}")
            return []

    @staticmethod
    def get_by_id(project_id):
        """
        Get a project by ID.

        Args:
            project_id: Project ID

        Returns:
            dict: Project data or None
        """
        try:
            # Convert ID to ObjectId if it's not
            if not isinstance(project_id, ObjectId):
                project_id = ObjectId(project_id)

            # Get project
            project = projects_collection.find_one({"_id": project_id})

            if project:
                # Convert ObjectId to string
                project["_id"] = str(project["_id"])
                project["created_by"] = str(project["created_by"])

                # Format dates
                if "created_at" in project:
                    project["created_at"] = project["created_at"].isoformat()
                if "updated_at" in project:
                    project["updated_at"] = project["updated_at"].isoformat()

                # Process collaborators
                if "collaborators" in project:
                    project["collaborators"] = []

            return project

        except Exception as e:
            logger.error(f"Error getting project: {str(e)}")
            return None

    @staticmethod
    def update(project_id, data):
        """
        Update a project.

        Args:
            project_id: Project ID
            data: Updated data

        Returns:
            bool: Success status
        """
        try:
            # Convert ID to ObjectId if it's not
            if not isinstance(project_id, ObjectId):
                project_id = ObjectId(project_id)

            # Add updated timestamp
            data["updated_at"] = datetime.utcnow()

            # Update project
            result = projects_collection.update_one({"_id": project_id}, {"$set": data})

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating project: {str(e)}")
            return False

    @staticmethod
    def delete(project_id):
        """
        Delete a project.

        Args:
            project_id: Project ID

        Returns:
            bool: Success status
        """
        try:
            # Convert ID to ObjectId if it's not
            if not isinstance(project_id, ObjectId):
                project_id = ObjectId(project_id)

            # Delete project
            result = projects_collection.delete_one({"_id": project_id})

            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting project: {str(e)}")
            return False

    @staticmethod
    def add_file(project_id, file_data):
        """
        Add a file to a project.

        Args:
            project_id: Project ID
            file_data: File data containing name, path, type, description, and owner_id

        Returns:
            bool: Success status
        """
        try:
            # Create file info
            file_info = {
                "name": file_data["name"],
                "path": file_data["path"],
                "type": file_data["type"],
                "description": file_data.get("description", ""),
                "uploaded_at": datetime.utcnow(),
                "uploaded_by": file_data["owner_id"],
            }

            # Update project
            result = projects_collection.update_one(
                {"_id": ObjectId(project_id)}, {"$push": {"files": file_info}}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error adding file to project: {str(e)}")
            return False

    @staticmethod
    def add_collaborator(project_id, user_id, role="viewer"):
        """
        Add a collaborator to a project.

        Args:
            project_id: Project ID
            user_id: User ID
            role: Collaborator role

        Returns:
            bool: Success status
        """
        try:
            # Create collaborator info
            collaborator = {
                "user_id": user_id,
                "role": role,
                "added_at": datetime.utcnow(),
            }

            # Update project
            result = projects_collection.update_one(
                {"_id": ObjectId(project_id)},
                {"$push": {"collaborators": collaborator}},
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error adding collaborator to project: {str(e)}")
            return False

    @staticmethod
    def update_module_files(project_id, module_index, files):
        """
        Update module files and status.

        Args:
            project_id: Project ID
            module_index: Module index
            files: List of files

        Returns:
            bool: Success status
        """
        try:
            # Get project
            project = projects_collection.find_one({"_id": ObjectId(project_id)})

            if not project:
                return False

            # Get modules
            modules = project.get("modules", [])

            # Check if module index is valid
            if 0 <= module_index < len(modules):
                # Update module
                modules[module_index]["files"] = files
                modules[module_index]["status"] = "completed"

                # Calculate new progress
                completed_modules = sum(
                    1 for m in modules if m.get("status") == "completed"
                )
                progress = (completed_modules / len(modules)) * 100

                # Update project
                projects_collection.update_one(
                    {"_id": ObjectId(project_id)},
                    {
                        "$set": {
                            "modules": modules,
                            "progress": progress,
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )

                return True

            return False

        except Exception as e:
            logger.error(f"Error updating module files: {str(e)}")
            return False
