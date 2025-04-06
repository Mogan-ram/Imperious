from app.models.base import users_collection, job_profiles_collection
from datetime import datetime, timezone
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class Profile:
    @staticmethod
    def update_profile(email, data):
        """
        Update a user's profile.

        Args:
            email: Email of the user
            data: Dict of fields to update

        Returns:
            bool: Success status
        """
        try:
            users_collection.update_one({"email": email}, {"$set": data})
            return True
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return False

    @staticmethod
    def get_job_profile(user_id):
        """
        Get job profile for a user.

        Args:
            user_id: User ID

        Returns:
            dict: Job profile data or None
        """
        try:
            job_profile = job_profiles_collection.find_one({"user_id": user_id})

            if job_profile:
                # Convert ObjectId to string
                job_profile["_id"] = str(job_profile["_id"])

                # Format dates
                for field in ["created_at", "updated_at"]:
                    if field in job_profile and job_profile[field]:
                        job_profile[field] = job_profile[field].isoformat()

                # Format experience dates
                if "experiences" in job_profile:
                    for exp in job_profile["experiences"]:
                        exp["_id"] = str(exp["_id"])
                        for field in ["start_date", "end_date", "created_at"]:
                            if field in exp and exp[field]:
                                if isinstance(exp[field], datetime):
                                    exp[field] = exp[field].isoformat()

            return job_profile
        except Exception as e:
            logger.error(f"Error getting job profile: {e}")
            return None

    @staticmethod
    def update_job_profile(user_id, data, create_if_missing=False):
        """
        Update or create a job profile.

        Args:
            user_id: User ID
            data: Job profile data
            create_if_missing: Whether to create a new profile if none exists

        Returns:
            dict: Result with success status, message, and other info
        """
        try:
            # Prepare job profile data
            job_profile_data = {
                "company": data["company"],
                "job_title": data["job_title"],
                "location": data.get("location", ""),
                "start_date": data.get("start_date"),
                "end_date": data.get("end_date"),
                "current": data.get("current", False),
                "description": data.get("description", ""),
                "industry": data.get("industry", ""),
                "skills": data.get("skills", []),
                "updated_at": datetime.now(timezone.utc),
            }

            # Check if job profile already exists
            existing_profile = job_profiles_collection.find_one({"user_id": user_id})

            if existing_profile:
                # Update existing profile
                job_profiles_collection.update_one(
                    {"user_id": user_id}, {"$set": job_profile_data}
                )
                return {
                    "success": True,
                    "message": "Job profile updated",
                    "status_code": 200,
                }
            elif create_if_missing:
                # Add created_at timestamp for new profiles
                job_profile_data["user_id"] = user_id
                job_profile_data["created_at"] = datetime.now(timezone.utc)

                # Insert new job profile
                result = job_profiles_collection.insert_one(job_profile_data)
                return {
                    "success": True,
                    "message": "Job profile created",
                    "id": str(result.inserted_id),
                    "status_code": 201,
                }
            else:
                return {
                    "success": False,
                    "message": "Job profile not found",
                    "status_code": 404,
                }

        except Exception as e:
            logger.error(f"Error updating job profile: {e}")
            return {
                "success": False,
                "message": f"An error occurred: {str(e)}",
                "status_code": 500,
            }

    @staticmethod
    def add_job_experience(user_id, data):
        """
        Add a job experience to a user's profile.

        Args:
            user_id: User ID
            data: Experience data

        Returns:
            dict: Result with success status and other info
        """
        try:
            # Create experience entry
            experience = {
                "_id": str(ObjectId()),  # Generate a unique ID for this experience
                "company": data["company"],
                "job_title": data["job_title"],
                "location": data.get("location", ""),
                "start_date": data["start_date"],
                "end_date": data.get("end_date"),
                "current": data.get("current", False),
                "description": data.get("description", ""),
                "skills": data.get("skills", []),
                "created_at": datetime.now(timezone.utc),
            }

            # Get user's job profile or create one
            job_profile = job_profiles_collection.find_one({"user_id": user_id})

            if job_profile:
                # Add to existing experiences array
                job_profiles_collection.update_one(
                    {"user_id": user_id},
                    {
                        "$push": {"experiences": experience},
                        "$set": {"updated_at": datetime.now(timezone.utc)},
                    },
                )
            else:
                # Create new job profile with experiences array
                job_profile_data = {
                    "user_id": user_id,
                    "experiences": [experience],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
                job_profiles_collection.insert_one(job_profile_data)

            return {"success": True, "experience_id": experience["_id"]}

        except Exception as e:
            logger.error(f"Error adding job experience: {e}")
            return {"success": False, "message": f"An error occurred: {str(e)}"}

    @staticmethod
    def update_job_experience(user_id, experience_id, data):
        """
        Update a job experience.

        Args:
            user_id: User ID
            experience_id: Experience ID
            data: Updated experience data

        Returns:
            bool: Success status
        """
        try:
            # Update the experience
            update_data = {
                "experiences.$.company": data["company"],
                "experiences.$.job_title": data["job_title"],
                "experiences.$.location": data.get("location", ""),
                "experiences.$.start_date": data["start_date"],
                "experiences.$.end_date": data.get("end_date"),
                "experiences.$.current": data.get("current", False),
                "experiences.$.description": data.get("description", ""),
                "experiences.$.skills": data.get("skills", []),
                "updated_at": datetime.now(timezone.utc),
            }

            result = job_profiles_collection.update_one(
                {"user_id": user_id, "experiences._id": experience_id},
                {"$set": update_data},
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating job experience: {e}")
            return False

    @staticmethod
    def delete_job_experience(user_id, experience_id):
        """
        Delete a job experience.

        Args:
            user_id: User ID
            experience_id: Experience ID

        Returns:
            bool: Success status
        """
        try:
            # Remove the experience
            result = job_profiles_collection.update_one(
                {"user_id": user_id},
                {
                    "$pull": {"experiences": {"_id": experience_id}},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error deleting job experience: {e}")
            return False

    @staticmethod
    def update_willingness(email, willingness):
        """
        Update a user's willingness preferences.

        Args:
            email: User email
            willingness: List of willingness options

        Returns:
            bool: Success status
        """
        try:
            result = users_collection.update_one(
                {"email": email, "role": "alumni"},
                {"$set": {"willingness": willingness}},
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating willingness: {e}")
            return False
