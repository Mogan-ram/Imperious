from app.models.base import news_events_collection, users_collection
from bson import ObjectId
from datetime import datetime
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


# Create a cache clear function outside the class
def clear_news_events_cache():
    """Clear the cache for NewsEvent.get_all method."""
    NewsEvent.get_all.cache_clear()


class NewsEvent:
    @staticmethod
    def create(data):
        """
        Create a new news or event.

        Args:
            data: Dictionary containing news event data

        Returns:
            ObjectId: ID of the created news/event
        """
        try:
            result = news_events_collection.insert_one(data)
            # Clear the cache after creating a new item
            try:
                clear_news_events_cache()
            except Exception as cache_error:
                logger.warning(
                    f"Cache clearing failed but item was created: {cache_error}"
                )
            return result.inserted_id
        except Exception as e:
            logger.error(f"Failed to create news/event: {str(e)}")
            raise Exception(f"Failed to create news/event: {str(e)}")

    @staticmethod
    @lru_cache(maxsize=128)
    def get_all(page=1, limit=10, event_type=None, sort_by="created_at", order=-1):
        """
        Get all news and events, with optional filtering.

        Args:
            page: Page number
            limit: Number of items per page
            event_type: Filter by type (news or event)
            sort_by: Field to sort by
            order: Sort order (1 for ascending, -1 for descending)

        Returns:
            dict: Dictionary containing items, total count, and page count
        """
        # Add debug logging
        logger.info(f"Cache request for {event_type} items")

        # Build query
        query = {}
        if event_type and event_type.lower() != "all":
            query["type"] = event_type.lower()

        # Count total documents
        total = news_events_collection.count_documents(query)

        # Calculate skip
        skip = (page - 1) * limit

        # Get items
        items = list(
            news_events_collection.find(query)
            .sort(sort_by, -1 if order == -1 else 1)
            .skip(skip)
            .limit(limit)
        )

        # Process items
        for item in items:
            # Convert ObjectId to string
            item["_id"] = str(item["_id"])

            # Get author info
            if "author_id" in item:
                try:
                    author = users_collection.find_one(
                        {"_id": ObjectId(item["author_id"])}
                    )
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
                except:
                    item["author"] = {"name": "Unknown", "email": "Unknown"}

            # Format dates
            for date_field in ["event_date", "created_at"]:
                if date_field in item and item[date_field]:
                    if isinstance(item[date_field], datetime):
                        item[date_field] = item[date_field].isoformat()

        return {"items": items, "total": total, "pages": (total + limit - 1) // limit}

    @staticmethod
    def get_by_id(id):
        """
        Get a news/event by ID.

        Args:
            id: News/event ID

        Returns:
            dict: News/event data or None
        """
        try:
            item = news_events_collection.find_one({"_id": ObjectId(id)})

            if item:
                # Convert ObjectId to string
                item["_id"] = str(item["_id"])

                # Get author info
                if "author_id" in item:
                    author = users_collection.find_one(
                        {"_id": ObjectId(item["author_id"])}
                    )
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

                # Format dates
                for date_field in ["event_date", "created_at"]:
                    if date_field in item and item[date_field]:
                        if isinstance(item[date_field], datetime):
                            item[date_field] = item[date_field].isoformat()

            return item
        except Exception as e:
            logger.error(f"Error in get_by_id: {e}")
            return None

    @staticmethod
    def get_by_author(author_email):
        """
        Get all news/events by a specific author.

        Args:
            author_email: Author's email

        Returns:
            list: List of news/events
        """
        try:
            items = list(news_events_collection.find({"author_id": author_email}))

            # Process items
            for item in items:
                # Convert ObjectId to string
                item["_id"] = str(item["_id"])

                # Format dates
                for date_field in ["event_date", "created_at"]:
                    if date_field in item and item[date_field]:
                        if isinstance(item[date_field], datetime):
                            item[date_field] = item[date_field].isoformat()

            return items
        except Exception as e:
            logger.error(f"Error in get_by_author: {e}")
            return []

    @staticmethod
    def update(id, data):
        """
        Update a news/event.

        Args:
            id: News/event ID
            data: Updated data

        Returns:
            bool: Success status
        """
        try:
            result = news_events_collection.update_one(
                {"_id": ObjectId(id)}, {"$set": data}
            )

            # Clear cache after update
            try:
                clear_news_events_cache()
            except Exception as cache_error:
                logger.warning(
                    f"Cache clearing failed but item was updated: {cache_error}"
                )

            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error in update: {e}")
            return False

    @staticmethod
    def delete(id):
        """
        Delete a news/event.

        Args:
            id: News/event ID

        Returns:
            bool: Success status
        """
        try:
            result = news_events_collection.delete_one({"_id": ObjectId(id)})

            # Clear cache after delete
            try:
                clear_news_events_cache()
            except Exception as cache_error:
                logger.warning(
                    f"Cache clearing failed but item was deleted: {cache_error}"
                )

            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error in delete: {e}")
            return False

    @staticmethod
    def can_edit(user_id, news_event_id):
        """
        Check if a user has permission to edit a news/event.

        Args:
            user_id: User ID
            news_event_id: News/event ID

        Returns:
            bool: True if the user has permission to edit, False otherwise
        """
        try:
            # Get the news/event
            news_event = NewsEvent.get_by_id(news_event_id)
            if not news_event:
                return False

            # Check if the user is the author
            return news_event["author_id"] == user_id

        except Exception as e:
            logger.error(f"Error in can_edit: {e}")
            return False

    @staticmethod
    def can_delete(user_id, user_role, news_event_id):
        """
        Check if a user has permission to delete a news/event.

        Args:
            user_id: User ID
            user_role: User role (staff or alumni)
            news_event_id: News/event ID

        Returns:
            bool: True if the user has permission to delete, False otherwise
        """
        try:
            # Get the news/event
            news_event = NewsEvent.get_by_id(news_event_id)
            if not news_event:
                return False

            # Get the author
            author_id = news_event.get("author_id")
            if not author_id:
                return False

            # Staff can delete their own posts or alumni posts
            if user_role.lower() == "staff":
                if author_id == user_id:
                    return True  # Staff can delete their own posts

                # Staff can delete alumni posts but not other staff posts
                try:
                    author = users_collection.find_one({"_id": ObjectId(author_id)})
                    if author and author.get("role", "").lower() == "alumni":
                        return True
                except:
                    pass
                return False

            # Alumni can only delete their own posts
            if user_role.lower() == "alumni":
                return author_id == user_id

            return False

        except Exception as e:
            logger.error(f"Error in can_delete: {e}")
            return False
