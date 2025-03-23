from app.models.base import jobs_collection, users_collection
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Job:
    @staticmethod
    def create(data):
        """
        Create a new job.

        Args:
            data: Dictionary containing job data

        Returns:
            str: ID of the created job
        """
        try:
            job_data = {
                "title": data["title"],
                "company": data["company"],
                "location": data["location"],
                "description": data["description"],
                "posted_by": data["posted_by"],
                "salary_min": data.get("salary_min"),
                "salary_max": data.get("salary_max"),
                "job_type": data.get("job_type", []),
                "requirements": data.get("requirements", ""),
                "how_to_apply": data.get("how_to_apply", ""),
                "apply_link": data.get("apply_link"),
                "created_at": datetime.utcnow(),
                "deadline": data.get("deadline"),
            }

            result = jobs_collection.insert_one(job_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating job: {str(e)}")
            return None

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
        """
        Get all jobs with filtering and pagination.

        Args:
            page: Page number
            limit: Number of items per page
            search_term: Text to search for
            location: Location filter
            job_type: Job type filter
            sort_by: Field to sort by
            sort_order: Sort order (1 for ascending, -1 for descending)

        Returns:
            dict: Dictionary containing jobs, total count, and page info
        """
        try:
            # Calculate skip
            skip = (page - 1) * limit

            # Build query
            query = {}

            # Add search filter
            if search_term:
                query["$or"] = [
                    {"title": {"$regex": search_term, "$options": "i"}},
                    {"company": {"$regex": search_term, "$options": "i"}},
                    {"description": {"$regex": search_term, "$options": "i"}},
                    {"requirements": {"$regex": search_term, "$options": "i"}},
                    {"location": {"$regex": search_term, "$options": "i"}},
                ]

            # Add location filter
            if location:
                query["location"] = {"$regex": location, "$options": "i"}

            # Add job type filter
            if job_type:
                query["job_type"] = job_type

            # Validate sort field
            valid_sort_fields = [
                "title",
                "company",
                "location",
                "salary_min",
                "salary_max",
                "created_at",
            ]
            sort_field = sort_by if sort_by in valid_sort_fields else "created_at"

            # Convert sort_order to integer
            sort_order = int(sort_order) if sort_order in ["1", "-1"] else -1

            # Count total documents
            total = jobs_collection.count_documents(query)

            # Get jobs
            jobs = list(
                jobs_collection.find(query)
                .sort(sort_field, sort_order)
                .skip(skip)
                .limit(limit)
            )

            # Process jobs
            for job in jobs:
                job["_id"] = str(job["_id"])
                job["posted_by"] = str(job["posted_by"])

                # Format dates
                if "created_at" in job:
                    job["created_at"] = job["created_at"].isoformat()
                if "deadline" in job and job["deadline"]:
                    if isinstance(job["deadline"], datetime):
                        job["deadline"] = job["deadline"].isoformat()

            return {
                "jobs": jobs,
                "total": total,
                "page": page,
                "pages": (total + limit - 1) // limit,
            }
        except Exception as e:
            logger.error(f"Error getting jobs: {str(e)}")
            return {"jobs": [], "total": 0, "page": page, "pages": 0}

    @staticmethod
    def get_by_id(job_id):
        """
        Get a job by ID.

        Args:
            job_id: Job ID

        Returns:
            dict: Job data or None
        """
        try:
            job = jobs_collection.find_one({"_id": ObjectId(job_id)})

            if job:
                # Convert ObjectId to string
                job["_id"] = str(job["_id"])

                # Fetch author details
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

                job["posted_by"] = str(job["posted_by"])

                # Format dates
                if "created_at" in job:
                    job["created_at"] = job["created_at"].isoformat()
                if "deadline" in job and job["deadline"]:
                    if isinstance(job["deadline"], datetime):
                        job["deadline"] = job["deadline"].isoformat()

            return job
        except Exception as e:
            logger.error(f"Error getting job: {str(e)}")
            return None

    @staticmethod
    def update(job_id, data):
        """
        Update a job.

        Args:
            job_id: Job ID
            data: Updated data

        Returns:
            bool: Success status
        """
        try:
            # Remove protected fields
            protected_fields = ["posted_by", "created_at"]
            update_data = {k: v for k, v in data.items() if k not in protected_fields}

            # Update job
            result = jobs_collection.update_one(
                {"_id": ObjectId(job_id)}, {"$set": update_data}
            )

            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating job: {str(e)}")
            return False

    @staticmethod
    def delete(job_id):
        """
        Delete a job.

        Args:
            job_id: Job ID

        Returns:
            bool: Success status
        """
        try:
            result = jobs_collection.delete_one({"_id": ObjectId(job_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting job: {str(e)}")
            return False
