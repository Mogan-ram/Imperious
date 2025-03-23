from bson import ObjectId
from datetime import datetime
from app.models.base import users_collection
from app.utils.security import generate_password_hash, check_password_hash
import logging

logger = logging.getLogger(__name__)


class User:
    @staticmethod
    def find_by_email(email):
        """Find a user by email."""
        try:
            return users_collection.find_one({"email": email})
        except Exception as e:
            logger.error(f"Error finding user by email: {str(e)}")
            return None

    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID."""
        try:
            return users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            logger.error(f"Error finding user by ID: {str(e)}")
            return None

    @staticmethod
    def register(data):
        """
        Register a new user.

        Args:
            data: Dictionary containing user registration data

        Returns:
            str: ID of the new user, or None if error
        """
        try:
            # Hash password before saving
            password = data.get("password")
            if isinstance(password, str):
                password = password.encode("utf-8")
            hashed_pwd = generate_password_hash(password)

            # Prepare user data
            user_data = {
                "name": data.get("name"),
                "email": data.get("email"),
                "password": hashed_pwd,
                "role": data.get("role", "student").lower(),
                "dept": data.get("dept"),
                "created_at": datetime.utcnow(),
                "willingness": data.get("willingness", []),
            }

            # Add role-specific fields
            if user_data["role"] == "staff":
                user_data["staff_id"] = data.get("staff_id")
            else:
                user_data["regno"] = data.get("regno")
                user_data["batch"] = data.get("batch")

            # Insert the user
            result = users_collection.insert_one(user_data)
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error registering user: {str(e)}")
            return None

    @staticmethod
    def verify_password(password, hashed):
        """Verify if a password matches the hash."""
        return check_password_hash(password, hashed)

    @staticmethod
    def update_profile(email, data):
        """
        Update a user's profile.

        Args:
            email: Email of the user to update
            data: Dictionary of fields to update

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Don't allow updating sensitive fields
            safe_data = {
                k: v for k, v in data.items() if k not in ["email", "password", "role"]
            }

            if safe_data:
                users_collection.update_one({"email": email}, {"$set": safe_data})
            return True
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            return False

    @staticmethod
    def verify_student_record(regno, dept, name=None, batch=None, is_alumni=False):
        """
        Verify if a student/alumni exists in the records.

        Args:
            regno: Registration number
            dept: Department
            name: Name (optional)
            batch: Batch year (optional)
            is_alumni: Whether checking for alumni status

        Returns:
            bool: True if record exists, False otherwise
        """
        from app.models.base import student_records_collection

        # Build query
        query = {"regno": regno, "dept": dept, "is_alumni": is_alumni}
        if name:
            query["name"] = name
        if batch:
            query["batch"] = int(batch)

        # Check if record exists
        return student_records_collection.find_one(query) is not None

    @staticmethod
    def search_users(query="", role="", dept="", current_user_email=None):
        """
        Search for users.

        Args:
            query: Search term for name or email
            role: Filter by role
            dept: Filter by department
            current_user_email: Email of current user to exclude from results

        Returns:
            list: List of matching users
        """
        try:
            # Build MongoDB query
            mongo_query = {}

            # Add search term if provided
            if query:
                mongo_query["$or"] = [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"email": {"$regex": query, "$options": "i"}},
                ]

            # Add role filter if provided
            if role:
                mongo_query["role"] = role

            # Add department filter if provided
            if dept:
                mongo_query["dept"] = dept

            # Exclude current user
            if current_user_email:
                mongo_query["email"] = {"$ne": current_user_email}

            # Find users
            users = list(users_collection.find(mongo_query).limit(10))

            # Format results
            result = []
            for user in users:
                user["_id"] = str(user["_id"])

                # Remove sensitive information
                if "password" in user:
                    del user["password"]

                result.append(user)

            return result

        except Exception as e:
            logger.error(f"Error searching users: {e}")
            return []

    @staticmethod
    def find_by_regno(regno):
        """Find a user by registration number."""
        try:
            return users_collection.find_one({"regno": regno})
        except Exception as e:
            logger.error(f"Error finding user by regno: {str(e)}")
            return None
