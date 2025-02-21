from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import logging
import os
import bcrypt


# Configure the MongoDB connection
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["imperious"]
    users_collection = db["users"]
    feeds_collection = db["feeds"]
    news_events_collection = db["news_events"]  # Add news_events collection
    projects_collection = db["projects"]  # Renamed from repositories
    student_records_collection = db[
        "student_records"
    ]  # Added student_records collection
    mentorship_requests = db["mentorship_requests"]
    pending_staff_collection = db["pending_staff_registrations"]
    collaboration_requests = db["collaboration_requests"]
    jobs_collection = db["jobs"]
    client.admin.command("ping")
    print("Connected successfully to MongoDB")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")


class User:
    def __init__(
        self,
        name,
        dept,
        email,
        password,
        role="student",
        regno=None,
        batch=None,
        staff_id=None,
    ):
        self.email = email
        # Don't hash password in __init__, store the plain password temporarily
        self.password = password
        self.role = role
        self.dept = dept
        self.name = name
        self.regno = regno
        self.batch = batch
        self.staff_id = staff_id

    def save(self):
        try:
            # Hash the password before saving to database
            hashed_password = bcrypt.hashpw(
                self.password.encode("utf-8"), bcrypt.gensalt()
            )

            # Create user data with hashed password
            user_data = {
                "email": self.email,
                "password": hashed_password,  # Store the hashed password
                "role": self.role,
                "dept": self.dept,
                "name": self.name,
                "created_at": datetime.utcnow(),
            }

            # Add role-specific fields
            if self.role.lower() == "staff":
                user_data["staff_id"] = self.staff_id
            else:
                user_data["regno"] = self.regno
                user_data["batch"] = self.batch

            # Insert the user
            users_collection.insert_one(user_data)

        except Exception as e:
            print(f"Error in save method: {str(e)}")
            raise ValueError(str(e))

    @staticmethod
    def verify_password(password, hashed):
        try:
            # Make sure hashed is bytes
            if isinstance(hashed, str):
                hashed = hashed.encode("utf-8")
            return bcrypt.checkpw(password.encode("utf-8"), hashed)
        except Exception as e:
            print(f"Password verification error: {str(e)}")
            return False

    @staticmethod
    def find_by_email(email):
        try:
            user = users_collection.find_one({"email": email})
            return user
        except Exception as e:
            print(f"User find error: {str(e)}")
            return None

    @staticmethod
    def find_by_regno(regno):
        return users_collection.find_one({"regno": regno})

    @staticmethod
    def update_by_email(email, data):
        # Don't allow updating sensitive fields
        safe_data = {k: v for k, v in data.items() if k not in ["email", "password"]}
        if safe_data:
            users_collection.update_one({"email": email}, {"$set": safe_data})
        return True

    @staticmethod
    def create_feed(email, content):
        feed = {"content": content, "author": email, "timestamp": datetime.utcnow()}
        result = feeds_collection.insert_one(feed)
        return str(result.inserted_id)

    @staticmethod
    def get_connections(user_id):
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None

        role = user.get("role", "").lower()
        dept = user.get("dept")

        if role == "student":
            student_connections = users_collection.count_documents(
                {"role": "student", "dept": dept, "_id": {"$ne": ObjectId(user_id)}}
            )
            alumni_connections = users_collection.count_documents(
                {"role": "alumni", "dept": dept}
            )
            return {"students": student_connections, "alumni": alumni_connections}

        elif role == "alumni":
            total_connections = users_collection.count_documents(
                {"dept": dept, "_id": {"$ne": ObjectId(user_id)}}
            )
            student_connections = users_collection.count_documents(
                {"role": "student", "dept": dept}
            )
            return {"total": total_connections, "students": student_connections}

        elif role == "staff":
            # Only count students and alumni from staff's department
            dept_students = users_collection.count_documents(
                {"role": "student", "dept": dept}
            )
            dept_alumni = users_collection.count_documents(
                {"role": "alumni", "dept": dept}
            )
            return {
                "departmentStudents": dept_students,
                "departmentAlumni": dept_alumni,
            }

    @staticmethod
    def verify_student_record(regno, dept, name=None, batch=None, is_alumni=False):
        """
        Verify if a student/alumni exists in the records
        """
        query = {"regno": regno, "dept": dept, "is_alumni": is_alumni}
        if name:
            query["name"] = name
        if batch:
            query["batch"] = int(batch)
        return student_records_collection.find_one(query) is not None

    def validate(self):
        try:
            if self.role.lower() == "staff":
                if not self.staff_id:
                    raise ValueError("Staff ID is required for staff registration")

                # Verify staff ID format (e.g., CSE01)
                if not (
                    len(self.staff_id) >= 4
                    and self.staff_id.startswith(self.dept)
                    and self.staff_id[3:].isdigit()
                ):
                    raise ValueError("Invalid Staff ID format. Should be like 'CSE01'")

                # Check if this staff ID is already registered
                existing_staff = users_collection.find_one(
                    {"staff_id": self.staff_id, "role": "staff"}
                )
                if existing_staff:
                    raise ValueError("This Staff ID is already registered")

                # Check if department already has a staff member
                existing_dept_staff = users_collection.find_one(
                    {"dept": self.dept, "role": "staff"}
                )
                if existing_dept_staff:
                    raise ValueError(
                        "A staff member already exists for this department"
                    )

            # Rest of the validation...

        except Exception as e:
            print(f"Error in validate method: {str(e)}")
            raise ValueError(str(e))


class Feed:
    def __init__(self, content, author):
        self.content = content
        self.author = author  # Email of the user
        self.timestamp = datetime.utcnow()

    def save(self):
        feed_data = {
            "content": self.content,
            "author": self.author,
            "timestamp": self.timestamp,
        }
        result = feeds_collection.insert_one(feed_data)
        feed_data["_id"] = str(result.inserted_id)
        return feed_data

    @staticmethod
    def get_all():
        feeds = feeds_collection.find().sort("timestamp", -1)  # Latest first
        feed_list = []
        for feed in feeds:
            # Get author details from users collection
            author = users_collection.find_one({"email": feed["author"]})

            if author:
                author_data = {
                    "email": author["email"],
                    "name": author["name"],
                }
            else:
                # If author is not found, provide default values.  IMPORTANT!
                author_data = {
                    "email": "unknown@example.com",  # Or some other placeholder
                    "name": "Unknown User",  # Or "Deleted User", etc.
                }

            feed_data = {
                "_id": str(feed["_id"]),
                "content": feed["content"],
                "author": {
                    "email": author["email"],
                    "name": author["name"],
                },
                "timestamp": feed["timestamp"].isoformat(),
            }
            feed_list.append(feed_data)
        return feed_list

    @staticmethod
    def delete(id):
        try:
            result = feeds_collection.delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except:
            return False

    @staticmethod
    def get_by_id(id):
        try:
            return feeds_collection.find_one({"_id": ObjectId(id)})
        except:
            return None


class NewsEvent:
    def __init__(
        self,
        title,
        description,
        type,
        author_id,
        image_path=None,
        event_date=None,
        location=None,
    ):
        self.title = title
        self.description = description
        self.type = type
        self.author_id = author_id
        self.image_path = image_path
        self.event_date = event_date
        self.location = location
        self.created_at = datetime.utcnow()

    @staticmethod
    def create(data, author_id):
        try:
            data["author_id"] = author_id  # Add author_id to data
            result = news_events_collection.insert_one(data)
            return result.inserted_id
        except Exception as e:
            raise Exception(f"Failed to create news/event: {str(e)}")

    @staticmethod
    def get_all(page=1, limit=10, type="all", sort_by="created_at", order=-1):
        skip = (page - 1) * limit
        query = {}
        if type.lower() != "all":
            query["type"] = type.lower()  # Ensure case-insensitive comparison

        # Add debug logging
        logging.info(f"MongoDB query: {query}")
        print(f"Querying database with type: {type}, page: {page}, limit: {limit}")

        total = news_events_collection.count_documents(query)
        items = list(
            news_events_collection.find(query)
            .sort(sort_by, DESCENDING if order == -1 else 1)
            .skip(skip)
            .limit(limit)
        )

        # Convert ObjectId to string for JSON serialization
        for item in items:
            item["_id"] = str(item["_id"])
            # Get the author (User) from the users_collection
            author = users_collection.find_one({"_id": ObjectId(item["author_id"])})
            if author:
                item["author"] = {
                    "name": author["name"],
                    "email": author["email"],
                    "role": author["role"],
                    "dept": author.get("dept"),  # Could be None
                    "batch": author.get("batch"),  # Could be None
                    "staff_id": author.get("staff_id"),  # Could be None
                }
            else:
                item["author"] = {
                    "name": "Unknown",
                    "email": "Unknown",
                }  # Handle case where author is not found.

            if "event_date" in item and item["event_date"]:
                # If event_date is already a string, don't try to process it
                if isinstance(item["event_date"], str):
                    pass  # NOOP - its allready string
                elif isinstance(item["event_date"], datetime):
                    item["event_date"] = item[
                        "event_date"
                    ].isoformat()  # it will convert the datetime obj into iso format
            if "created_at" in item:
                item["created_at"] = item["created_at"].isoformat()

        return {"items": items, "total": total, "pages": (total + limit - 1) // limit}

    @staticmethod
    def get_by_id(id):
        try:
            item = news_events_collection.find_one({"_id": ObjectId(id)})
            if item:
                item["_id"] = str(item["_id"])
                author = users_collection.find_one({"_id": ObjectId(item["author_id"])})
                if author:
                    item["author"] = {
                        "name": author["name"],
                        "email": author["email"],
                        "role": author["role"],
                        "dept": author.get("dept"),
                        "batch": author.get("batch"),
                        "staff_id": author.get("staff_id"),
                    }
                else:
                    item["author"] = {"name": "Unknown", "email": "Unknown"}
                # --- Date Formatting (Backend - consistently to ISO format) ---
                if "event_date" in item and item["event_date"]:
                    # If event_date is already a string, don't try to process it
                    if isinstance(item["event_date"], str):
                        pass  # NOOP - its allready string
                    elif isinstance(item["event_date"], datetime):
                        item["event_date"] = item["event_date"].isoformat()
                if "created_at" in item:
                    item["created_at"] = item["created_at"].isoformat()
                return item
        except Exception as e:
            print(f"An error in models.py {e}")
            return None

    @staticmethod
    def update(id, data):
        try:
            result = news_events_collection.update_one(
                {"_id": ObjectId(id)}, {"$set": data}
            )
            return result.modified_count > 0
        except:
            return False

    @staticmethod
    def delete(id):
        try:
            result = news_events_collection.delete_one({"_id": ObjectId(id)})
            return result.deleted_count > 0
        except Exception as e:  # Always catch specific exceptions if possible.
            print(f"Error in NewsEvent.delete: {e}")  # Better logging
            return False


class Project:
    def __init__(self, **kwargs):
        self.title = kwargs.get("title")
        self.abstract = kwargs.get("abstract")
        self.tech_stack = kwargs.get("techStack", [])
        self.github_link = kwargs.get("githubLink", "")
        self.modules = kwargs.get("modules", [])
        self.progress = kwargs.get("progress", 0)
        self.created_by = kwargs.get("created_by")
        self.created_at = datetime.utcnow()
        self.updated_at = self.created_at

    def save(self):
        project_data = {
            "title": self.title,
            "abstract": self.abstract,
            "tech_stack": self.tech_stack,
            "github_link": self.github_link,
            "modules": self.modules,
            "progress": self.progress,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

        result = projects_collection.insert_one(project_data)
        return str(result.inserted_id)

    @staticmethod
    def get_all(filter_query=None):
        try:
            query = filter_query or {}
            # Convert string ID to ObjectId for comparison
            if "created_by" in query:
                query["created_by"] = str(query["created_by"])

            projects = list(projects_collection.find(query))

            # Convert ObjectIds to strings for JSON serialization
            for project in projects:
                project["_id"] = str(project["_id"])
                project["created_by"] = str(project["created_by"])

                # Ensure dates are in ISO format
                if "created_at" in project:
                    project["created_at"] = project["created_at"].isoformat()

            # app.logger.debug(f"Found projects: {projects}")
            return projects

        except Exception as e:
            # app.logger.error(f"Error getting projects: {str(e)}")
            return []

    @staticmethod
    def get_by_id(project_id):
        try:
            project = projects_collection.find_one({"_id": ObjectId(project_id)})
            if project:
                project["_id"] = str(project["_id"])
                project["created_by"] = str(project["created_by"])
                if "created_at" in project:
                    project["created_at"] = project["created_at"].isoformat()
                if "updated_at" in project:
                    project["updated_at"] = project["updated_at"].isoformat()
            return project
        except Exception as e:
            print(f"Error getting project: {str(e)}")
            return None

    @staticmethod
    def update_module_files(project_id, module_index, files):
        # Update module status and project progress
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if project:
            modules = project.get("modules", [])
            if 0 <= module_index < len(modules):
                modules[module_index]["files"] = files
                modules[module_index]["status"] = "completed"

                # Calculate new progress
                completed_modules = sum(
                    1 for m in modules if m.get("status") == "completed"
                )
                progress = (completed_modules / len(modules)) * 100

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

    @staticmethod
    def add_file(project_id, file_data):
        """
        Add a file to the project
        file_data should contain: name, path, type, description
        """
        file_info = {
            "name": file_data["name"],
            "path": file_data["path"],
            "type": file_data["type"],
            "description": file_data.get("description", ""),
            "uploaded_at": datetime.utcnow(),
            "uploaded_by": file_data["owner_id"],
        }

        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)}, {"$push": {"files": file_info}}
        )
        return result.modified_count > 0

    @staticmethod
    def add_collaborator(project_id, user_id, role="viewer"):
        collaborator = {"user_id": user_id, "role": role, "added_at": datetime.utcnow()}

        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)}, {"$push": {"collaborators": collaborator}}
        )
        return result.modified_count > 0

    @staticmethod
    def get_files(project_id, path=None):
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            return []

        files = project.get("files", [])
        if path:
            files = [f for f in files if f["path"] == path]
        return files

    @staticmethod
    def get_collaborators(project_id):
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project:
            return []

        return project.get("collaborators", [])

    @staticmethod
    def create(data, user_id):
        try:
            project = {
                "title": data["title"],
                "abstract": data["abstract"],
                "techStack": data.get("techStack", []),
                "githubLink": data.get("githubLink", ""),
                "modules": data.get("modules", []),
                "progress": data.get("progress", 0),
                "created_by": str(user_id),  # Store as string
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }

            result = projects_collection.insert_one(project)
            return str(result.inserted_id)

        except Exception as e:
            # app.logger.error(f"Error creating project: {str(e)}")
            raise


class StaffRegistration:
    @staticmethod
    def generate_staff_id(dept):
        """
        Generate a unique staff ID for a department
        This should be used by administrators only
        """
        # Get the latest staff number for this department
        latest_staff = users_collection.find_one(
            {"role": "staff", "dept": dept}, sort=[("staff_id", -1)]
        )

        if latest_staff:
            # Extract number from existing ID (e.g., "CSE01" -> 1)
            current_num = int(latest_staff["staff_id"][3:])
            new_num = current_num + 1
        else:
            new_num = 1

        return f"{dept}{new_num:02d}"  # Formats as CSE01, CSE02, etc.

    @staticmethod
    def register_new_staff_id(dept):
        """
        Pre-register a staff ID that can be used for registration
        Returns the generated ID that should be shared securely with the staff member
        """
        staff_id = StaffRegistration.generate_staff_id(dept)

        # Store in pending_staff_registrations collection
        pending_staff_collection.insert_one(
            {
                "staff_id": staff_id,
                "dept": dept,
                "created_at": datetime.utcnow(),
                "is_used": False,
            }
        )

        return staff_id


class MentorshipRequest:
    def __init__(self, student_id, project_id, message, status="pending"):
        self.student_id = student_id
        self.project_id = project_id
        self.message = message
        self.status = status
        self.mentor_id = None  # You don't use this on creation.
        self.created_at = datetime.utcnow()

    @staticmethod
    def create(data):
        try:
            print("Creating request with data:", data)  # Debug log
            request = {
                "student_id": ObjectId(data["student_id"]),
                "project_id": ObjectId(data["project_id"]),
                "message": data["message"],
                "status": "pending",
                "created_at": datetime.utcnow(),
                "mentor_id": None,  # Initialize as None
                "ignored_by": [],
            }
            result = mentorship_requests.insert_one(request)
            print("Insert result:", result.inserted_id)  # Debug log
            return str(result.inserted_id)
        except Exception as e:
            print("Error during creation:", str(e))  # Debug log
            raise Exception(f"Error creating mentorship request: {str(e)}")

    @staticmethod
    def get_student_requests(student_id):
        try:
            print(f"Fetching requests for student: {student_id}")
            requests = list(
                mentorship_requests.find({"student_id": ObjectId(student_id)})
            )
            print(f"Found {len(requests)} requests in database")

            # Enrich requests with project details
            for request in requests:
                # Get project details
                project = projects_collection.find_one(
                    {"_id": ObjectId(request["project_id"])}
                )
                if project:
                    request["project"] = {
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "_id": str(project["_id"]),
                        "created_by": str(project["created_by"]),  # Add this!
                    }
                    owner = users_collection.find_one(
                        {"_id": Project.to_object_id(project["created_by"])}
                    )
                    if owner:
                        request["project"]["owner_name"] = owner.get("name")
                        request["project"]["owner_dept"] = owner.get("dept")

                # Convert ObjectIds to strings
                request["_id"] = str(request["_id"])
                request["student_id"] = str(request["student_id"])
                request["project_id"] = str(request["project_id"])
                if (
                    "mentor_id" in request and request["mentor_id"]
                ):  # Check for existence
                    request["mentor_id"] = str(request["mentor_id"])

                if "created_at" in request:  # Convert date here
                    request["created_at"] = request["created_at"].isoformat()

            print("Enriched requests:", requests)  # Debug log
            return requests
        except Exception as e:
            print(f"Error in get_student_requests: {str(e)}")
            raise Exception(f"Error getting student requests: {str(e)}")

    @staticmethod
    def get_mentor_requests(mentor_id):
        try:
            # Fetch ALL pending mentorship requests.  NO filtering by mentor_id or project owner.
            requests = list(mentorship_requests.find())

            # Enrich request data with project and student details
            for request in requests:
                request["_id"] = str(request["_id"])
                request["student_id"] = str(request["student_id"])
                request["project_id"] = str(request["project_id"])

                if "mentor_id" in request and request["mentor_id"]:
                    request["mentor_id"] = str(request["mentor_id"])  # handle exception

                project = projects_collection.find_one(
                    {"_id": ObjectId(request["project_id"])}
                )
                if project:
                    request["project"] = {
                        "_id": str(project["_id"]),  # Convert to string
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "created_by": str(
                            project["created_by"]
                        ),  # Include creator, and convert to string!
                    }
                    # find the owner of the project using user id.
                    owner = users_collection.find_one(
                        {"_id": ObjectId(project["created_by"])}
                    )
                    if owner:
                        request["project"]["owner_name"] = owner.get("name")
                        request["project"]["owner_dept"] = owner.get("dept")

                student = users_collection.find_one(
                    {"_id": ObjectId(request["student_id"])}
                )
                if student:
                    request["student"] = {
                        "_id": str(student["_id"]),  # Convert to string
                        "name": student["name"],
                        "dept": student["dept"],
                    }
                if "created_at" in request:
                    request["created_at"] = request["created_at"].isoformat()

            return requests

        except Exception as e:
            print(f"Error in get_mentor_requests: {str(e)}")
            return []

    @staticmethod
    def update_request(request_id, status, mentor_id=None):
        """Updates the status (and optionally, mentor_id) of a request."""
        try:
            update_data = {"status": status}
            if mentor_id:
                update_data["mentor_id"] = str(mentor_id)  # Store as string

            result = mentorship_requests.update_one(
                {"_id": ObjectId(request_id)},  # Use helper function
                {"$set": update_data},
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating mentorship request: {e}")
            return False

    @staticmethod
    def ignore_request(request_id, user_email):
        """Adds the user's email to the ignored_by array."""
        try:
            result = mentorship_requests.update_one(
                {"_id": ObjectId(request_id)},  # Use helper function
                {"$addToSet": {"ignored_by": user_email}},  # Use $addToSet
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error ignoring mentorship request: {e}")
            return False

    @staticmethod
    def get_mentees_by_mentor(mentor_email):
        """
        Fetches all accepted mentorship requests for a given mentor,
        along with project and student details.
        """
        try:
            # Find accepted requests where mentor_id matches the mentor's email.
            accepted_requests = list(
                mentorship_requests.find(
                    {
                        "status": "accepted",
                        "mentor_id": mentor_email,  # Use email for now (temporary)
                    }
                )
            )

            projects_data = []
            for request in accepted_requests:
                project = projects_collection.find_one(
                    {"_id": Project.to_object_id(request["project_id"])}
                )
                if project:
                    project_data = {
                        "_id": str(project["_id"]),  # String ID
                        "title": project["title"],
                        "students": [],  # List of students
                    }

                    # Get the project creator (Lead)
                    creator = users_collection.find_one(
                        {"_id": User.to_object_id(project["created_by"])}
                    )
                    if creator:
                        project_data["students"].append(
                            {
                                "id": str(creator["_id"]),  # String ID
                                "name": creator["name"],
                                "dept": creator["dept"],
                                "batch": creator.get("batch"),  # Include batch
                                "email": creator.get("email"),  # Include email
                                "role": "Lead",  # Indicate this is the project lead
                            }
                        )

                    # Get collaborators (if any)
                    if "collaborators" in project:
                        for collaborator in project["collaborators"]:
                            if "id" in collaborator:  # Check if 'id' key exists
                                try:
                                    collab_user = users_collection.find_one(
                                        {"_id": User.to_object_id(collaborator["id"])}
                                    )
                                    if collab_user:
                                        project_data["students"].append(
                                            {
                                                "id": str(
                                                    collab_user["_id"]
                                                ),  # String ID
                                                "name": collab_user["name"],
                                                "dept": collab_user["dept"],
                                                "batch": collab_user.get(
                                                    "batch"
                                                ),  # Include batch
                                                "email": collab_user.get(
                                                    "email"
                                                ),  # include email
                                                "role": "Collaborator",
                                            }
                                        )
                                except (
                                    Exception
                                ) as e:  # added to prevent app crash if user not exist
                                    print(f"invalid user {e}")
                                    continue  # if object id is invalid

                    projects_data.append(project_data)

            return projects_data

        except Exception as e:
            print(f"Error in get_mentees_by_mentor: {str(e)}")
            return []

    # models.py file inside models
    @staticmethod
    def get_mentors():
        try:
            # Find users with the role "alumni"
            mentors = list(users_collection.find({"role": "alumni"}))
            # Convert ObjectId to string for JSON serialization
            for mentor in mentors:
                mentor["_id"] = str(mentor["_id"])
            return mentors
        except Exception as e:
            print(f"Error getting mentors: {e}")
            return []


class Collaboration:
    def __init__(self, student_id, project_id, message, status="pending"):
        self.student_id = student_id
        self.project_id = project_id
        self.message = message
        self.status = status
        self.created_at = datetime.utcnow()

    @staticmethod
    def create(data):
        try:
            request = {
                "student_id": ObjectId(data["student_id"]),
                "project_id": ObjectId(data["project_id"]),
                "message": data["message"],
                "status": "pending",
                "created_at": datetime.utcnow(),
            }
            result = collaboration_requests.insert_one(request)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating collaboration request: {str(e)}")

    @staticmethod
    def get_student_requests(student_id):
        try:
            requests = list(
                collaboration_requests.find(
                    {
                        "$or": [
                            {"student_id": ObjectId(student_id)},
                            {"project_owner_id": ObjectId(student_id)},
                        ]
                    }
                )
            )

            for request in requests:
                # Get project details
                project = projects_collection.find_one(
                    {"_id": ObjectId(request["project_id"])}
                )
                if project:
                    request["project"] = {
                        "title": project["title"],
                        "abstract": project["abstract"],
                        "_id": str(project["_id"]),
                        "owner_id": str(project["created_by"]),
                    }

                # Get student details
                student = users_collection.find_one(
                    {"_id": ObjectId(request["student_id"])}
                )
                if student:
                    request["student"] = {
                        "name": student["name"],
                        "dept": student["dept"],
                        "_id": str(student["_id"]),
                    }

                # Convert ObjectIds to strings
                request["_id"] = str(request["_id"])
                request["student_id"] = str(request["student_id"])
                request["project_id"] = str(request["project_id"])

            return requests
        except Exception as e:
            raise Exception(f"Error getting collaboration requests: {str(e)}")

    @staticmethod
    def update_status(request_id, status):
        try:
            collaboration_requests.update_one(
                {"_id": ObjectId(request_id)}, {"$set": {"status": status}}
            )
            return True
        except Exception as e:
            raise Exception(f"Error updating collaboration status: {str(e)}")


# In models.py
# models.py - ONLY the Job class
class job:
    def __init__(
        self,
        title,
        company,
        location,
        description,
        posted_by,  # This links to the User model (alumni or staff)
        salary_min=None,  # Make optional
        salary_max=None,  # Make optional
        job_type=[],  # e.g., "Full-time", "Part-time", "Internship"  Make this a list
        requirements="",  # List of requirements  -->>CHANGED TO STRING
        how_to_apply="",  # Store application instructions (text)
        apply_link=None,  # Optional link
        created_at=None,
        deadline=None,  # added deadline for jobpost
    ):
        self.title = title
        self.company = company
        self.location = location
        self.description = description
        self.posted_by = posted_by
        self.salary_min = salary_min
        self.salary_max = salary_max
        self.job_type = job_type  # Store as a list
        self.requirements = requirements  # Store as a String now
        self.how_to_apply = how_to_apply  # HTML content is OK, but *sanitize* on input
        self.apply_link = apply_link
        self.created_at = created_at or datetime.utcnow()
        self.deadline = deadline  # deadline

    @staticmethod
    def create(data):
        job_data = {
            "title": data["title"],
            "company": data["company"],
            "location": data["location"],
            "description": data["description"],
            "posted_by": data["posted_by"],
            "salary_min": data.get("salary_min"),  # Handle optional fields
            "salary_max": data.get("salary_max"),
            "job_type": data.get(
                "job_type", []
            ),  # Default to empty list if not provided
            "requirements": data.get("requirements", ""),  # now string
            "how_to_apply": data.get("how_to_apply", ""),  # can be null
            "apply_link": data.get("apply_link", None),
            "created_at": datetime.utcnow(),
            "deadline": data.get("deadline"),
        }
        result = jobs_collection.insert_one(job_data)
        return str(result.inserted_id)

    @staticmethod
    def get_all(
        page=1,
        limit=10,
        search_term=None,
        location=None,
        job_type=None,
        sort_by="created_at",
        sort_order=-1,
    ):
        skip = (page - 1) * limit
        query = {}

        # Add search term filter (if provided)
        if search_term:
            query["$or"] = [
                {
                    "title": {"$regex": search_term, "$options": "i"}
                },  # Case-insensitive search
                {"company": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}},
                {
                    "requirements": {"$regex": search_term, "$options": "i"}
                },  # search in requirements
                {
                    "location": {"$regex": search_term, "$options": "i"}
                },  # search in location
            ]
        if location:
            query["location"] = {
                "$regex": location,
                "$options": "i",
            }  # Case-insensitive

        if job_type:
            query["job_type"] = job_type  # job_type filter

        sort_field = (
            sort_by
            if sort_by
            in [
                "title",
                "company",
                "location",
                "salary_min",
                "salary_max",
                "created_at",
            ]
            else "created_at"
        )

        # Convert sort_order to integer, defaulting to -1 (descending)
        sort_order = int(sort_order) if sort_order in ["1", "-1"] else -1

        total = jobs_collection.count_documents(query)
        jobs = list(
            jobs_collection.find(query)
            .sort(sort_field, sort_order)
            .skip(skip)
            .limit(limit)
        )

        for job in jobs:
            job["_id"] = str(job["_id"])
            job["posted_by"] = str(job["posted_by"])
            job["created_at"] = job["created_at"].isoformat()
            # Convert deadline to ISO format if it exists, and handle None
            if job.get("deadline"):
                if isinstance(job.get("deadline"), datetime):
                    job["deadline"] = job["deadline"].isoformat()

        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit,
        }

    @staticmethod
    def get_by_id(job_id):
        try:
            job = jobs_collection.find_one({"_id": ObjectId(job_id)})
            if job:
                job["_id"] = str(job["_id"])
                # Fetch and embed author details
                author = users_collection.find_one({"_id": ObjectId(job["posted_by"])})
                if author:
                    job["author"] = {
                        "name": author["name"],
                        "email": author["email"],
                        "role": author["role"],
                        "dept": author.get("dept"),
                        "batch": author.get("batch"),
                        "staff_id": author.get("staff_id"),
                    }
                else:
                    job["author"] = {"name": "Unknown", "email": "Unknown"}

                job["posted_by"] = str(job["posted_by"])  # Keep consistent
                if job.get("created_at"):
                    job["created_at"] = job.get("created_at").isoformat()
                if job.get("deadline"):  # Check for the deadline
                    job["deadline"] = job.get("deadline")
                return job
            else:
                return None  # Job not found
        except Exception as e:
            print(f"Somthing went wrong in models.py: {e}")
            return None

    @staticmethod
    def update(job_id, data):
        # Prevent modification of certain fields
        if "posted_by" in data:
            del data["posted_by"]
        if "created_at" in data:
            del data["created_at"]
        result = jobs_collection.update_one({"_id": ObjectId(job_id)}, {"$set": data})
        return result.modified_count > 0

    @staticmethod
    def delete(job_id):
        result = jobs_collection.delete_one({"_id": ObjectId(job_id)})
        return result.deleted_count > 0


# analytics part


class Analytics:  # New class

    @staticmethod
    def get_user_counts_by_role():
        counts = {}
        for role in ["student", "alumni", "staff"]:
            counts[role] = users_collection.count_documents({"role": role})
        return counts

    @staticmethod
    def get_new_user_registrations(days=30):
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        return list(users_collection.aggregate(pipeline))

    @staticmethod
    def get_active_users(days=30):
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return users_collection.count_documents({"created_at": {"$gte": cutoff_date}})

    @staticmethod
    def get_department_distribution(role):
        pipeline = [
            {"$match": {"role": role}},
            {"$group": {"_id": "$dept", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        return list(users_collection.aggregate(pipeline))

    @staticmethod
    def get_batch_year_distribution(role):
        pipeline = [
            {"$match": {"role": role}},
            {"$group": {"_id": "$batch", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}},
        ]
        return list(users_collection.aggregate(pipeline))

    @staticmethod
    def get_mentorship_request_status_breakdown():
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$project": {"status": "$_id", "count": 1, "_id": 0}},
        ]
        return list(mentorship_requests.aggregate(pipeline))

    @staticmethod
    def get_total_mentorship_requests(days=None):
        query = {}
        if days:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = {"created_at": {"$gte": cutoff_date}}
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "count": {"$sum": 1}}},
            {"$project": {"_id": 0, "count": 1}},
        ]
        result = list(mentorship_requests.aggregate(pipeline))
        return result[0]["count"] if result else 0

    @staticmethod
    def get_total_projects_created(days=None):
        query = {}
        if days:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = {"created_at": {"$gte": cutoff_date}}
        return projects_collection.count_documents(query)

    @staticmethod
    def get_project_status_breakdown():
        pipeline = [
            {
                "$project": {
                    "status": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": ["$progress", 0]},
                                    "then": "Not Started",
                                },
                                {
                                    "case": {"$lt": ["$progress", 100]},
                                    "then": "In Progress",
                                },
                                {
                                    "case": {"$eq": ["$progress", 100]},
                                    "then": "Completed",
                                },
                            ],
                            "default": "Unknown",
                        }
                    }
                }
            },
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$project": {"status": "$_id", "count": 1, "_id": 0}},
        ]
        return list(projects_collection.aggregate(pipeline))

    @staticmethod
    def get_top_technologies(limit=10):
        pipeline = [
            {"$unwind": "$tech_stack"},  # Deconstruct the tech_stack array
            {
                "$group": {"_id": "$tech_stack", "count": {"$sum": 1}}
            },  # Group by technology and count
            {"$sort": {"count": -1}},  # Sort by count (descending)
            {"$limit": limit},  # Limit to top N technologies
            {
                "$project": {"tech": "$_id", "count": 1, "_id": 0}
            },  # Optional: Rename fields
        ]
        return list(projects_collection.aggregate(pipeline))
