from app.models.base import (
    users_collection,
    mentorship_requests,
    projects_collection,
    news_events_collection,
)
from bson import ObjectId
from datetime import datetime, timedelta
from pymongo import DESCENDING
import logging

logger = logging.getLogger(__name__)


class Analytics:
    @staticmethod
    def get_user_counts_by_role():
        """
        Get count of users by role.

        Returns:
            dict: Count of users by role
        """
        try:
            counts = {}

            for role in ["student", "alumni", "staff"]:
                counts[role] = users_collection.count_documents({"role": role})

            return counts

        except Exception as e:
            logger.error(f"Error getting user counts: {e}")
            return {"student": 0, "alumni": 0, "staff": 0}

    @staticmethod
    def get_new_user_registrations(days=30):
        """
        Get new user registrations for the past days.

        Args:
            days: Number of days to look back

        Returns:
            list: List of registrations by date
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            pipeline = [
                {"$match": {"created_at": {"$gte": cutoff_date}}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at",
                            }
                        },
                        "count": {"$sum": 1},
                    }
                },
                {"$sort": {"_id": 1}},
            ]

            return list(users_collection.aggregate(pipeline))

        except Exception as e:
            logger.error(f"Error getting new user registrations: {e}")
            return []

    @staticmethod
    def get_active_users(days=30):
        """
        Get count of active users.

        Args:
            days: Number of days to look back

        Returns:
            int: Count of active users
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            return users_collection.count_documents(
                {"created_at": {"$gte": cutoff_date}}
            )

        except Exception as e:
            logger.error(f"Error getting active users: {e}")
            return 0

    @staticmethod
    def get_department_distribution(role):
        """
        Get distribution of users by department for a specific role.

        Args:
            role: User role

        Returns:
            list: List of departments with counts
        """
        try:
            pipeline = [
                {"$match": {"role": role}},
                {"$group": {"_id": "$dept", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]

            return list(users_collection.aggregate(pipeline))

        except Exception as e:
            logger.error(f"Error getting department distribution: {e}")
            return []

    @staticmethod
    def get_batch_year_distribution(role):
        """
        Get distribution of users by batch year for a specific role.

        Args:
            role: User role

        Returns:
            list: List of batch years with counts
        """
        try:
            pipeline = [
                {"$match": {"role": role}},
                {"$group": {"_id": "$batch", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
            ]

            return list(users_collection.aggregate(pipeline))

        except Exception as e:
            logger.error(f"Error getting batch year distribution: {e}")
            return []

    @staticmethod
    def get_mentorship_request_status_breakdown():
        """
        Get breakdown of mentorship requests by status.

        Returns:
            list: List of statuses with counts
        """
        try:
            pipeline = [
                {"$group": {"_id": "$status", "count": {"$sum": 1}}},
                {"$project": {"status": "$_id", "count": 1, "_id": 0}},
            ]

            return list(mentorship_requests.aggregate(pipeline))

        except Exception as e:
            logger.error(f"Error getting mentorship request status breakdown: {e}")
            return []

    @staticmethod
    def get_total_mentorship_requests(days=None):
        """
        Get total count of mentorship requests.

        Args:
            days: Number of days to look back (optional)

        Returns:
            int: Count of mentorship requests
        """
        try:
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

        except Exception as e:
            logger.error(f"Error getting total mentorship requests: {e}")
            return 0

    @staticmethod
    def get_total_projects_created(days=None):
        """
        Get total count of projects created.

        Args:
            days: Number of days to look back (optional)

        Returns:
            int: Count of projects
        """
        try:
            query = {}

            if days:
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                query = {"created_at": {"$gte": cutoff_date}}

            return projects_collection.count_documents(query)

        except Exception as e:
            logger.error(f"Error getting total projects created: {e}")
            return 0

    @staticmethod
    def get_project_status_breakdown():
        """
        Get breakdown of projects by status.

        Returns:
            list: List of statuses with counts
        """
        try:
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

        except Exception as e:
            logger.error(f"Error getting project status breakdown: {e}")
            return []

    @staticmethod
    def get_top_technologies(limit=10):
        """
        Get top technologies used in projects.

        Args:
            limit: Maximum number of technologies to return

        Returns:
            list: List of technologies with counts
        """
        try:
            pipeline = [
                {"$unwind": "$tech_stack"},
                {"$group": {"_id": "$tech_stack", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
                {"$project": {"tech": "$_id", "count": 1, "_id": 0}},
            ]

            return list(projects_collection.aggregate(pipeline))

        except Exception as e:
            logger.error(f"Error getting top technologies: {e}")
            return []

    @staticmethod
    def get_all_users(
        role=None,
        dept=None,
        batch=None,
        regno=None,
        created_at=None,
        page=1,
        per_page=10,
    ):
        """
        Get all users with optional filters and pagination.

        Args:
            role: Filter by role
            dept: Filter by department
            batch: Filter by batch
            regno: Filter by registration number
            created_at: Filter by creation date
            page: Page number
            per_page: Number of users per page

        Returns:
            dict: Dictionary with users, total count, and pagination info
        """
        try:
            # Build query
            query = {}

            if role:
                query["role"] = role
            if dept:
                query["dept"] = dept
            if batch:
                query["batch"] = batch
            if regno:
                query["regno"] = regno
            if created_at:
                query["created_at"] = {"$gte": datetime.fromisoformat(created_at)}

            # Calculate skip
            skip = (page - 1) * per_page

            # Get users
            users = list(users_collection.find(query).skip(skip).limit(per_page))

            # Process users
            for user in users:
                user["_id"] = str(user["_id"])

                # Remove sensitive information
                if "password" in user:
                    del user["password"]

            # Get total count
            total_users = users_collection.count_documents(query)

            # Calculate total pages
            total_pages = (total_users + per_page - 1) // per_page

            return {
                "users": users,
                "total_users": total_users,
                "total_pages": total_pages,
                "current_page": page,
            }

        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return {
                "users": [],
                "total_users": 0,
                "total_pages": 0,
                "current_page": page,
            }

    @staticmethod
    def get_alumni_by_willingness(willingness_filter=""):
        """
        Get alumni filtered by willingness.

        Args:
            willingness_filter: Filter by willingness

        Returns:
            list: List of alumni
        """
        try:
            # Build query
            query = {"role": "alumni"}

            if willingness_filter:
                query["willingness"] = willingness_filter

            # Get alumni
            alumni = list(users_collection.find(query))

            # Process alumni
            for a in alumni:
                a["_id"] = str(a["_id"])

                # Remove sensitive information
                if "password" in a:
                    del a["password"]

            return alumni

        except Exception as e:
            logger.error(f"Error getting alumni by willingness: {e}")
            return []

    @staticmethod
    def get_posts_by_author(author_email):
        """
        Get posts by a specific author.

        Args:
            author_email: Email of the author

        Returns:
            list: List of posts
        """
        try:
            # Find the user by email to get their ID
            author = users_collection.find_one({"email": author_email})
            if not author:
                return []

            # Get the author's ID
            author_id = str(author["_id"])

            # Get posts by author ID
            posts = list(news_events_collection.find({"author_id": author_id}))

            # Process posts...
            for post in posts:
                post["_id"] = str(post["_id"])

                # Format dates
                for date_field in ["event_date", "created_at"]:
                    if date_field in post and post[date_field]:
                        if isinstance(post[date_field], datetime):
                            post[date_field] = post[date_field].isoformat()

            return posts

        except Exception as e:
            logger.error(f"Error getting posts by author: {e}")
            return []
