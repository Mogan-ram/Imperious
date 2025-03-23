from app.models.base import feeds_collection, users_collection
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Feed:
    @staticmethod
    def create(author_email, content):
        """
        Create a new feed post.

        Args:
            author_email: Email of the author
            content: Feed content

        Returns:
            str: ID of the created feed
        """
        try:
            feed_data = {
                "content": content,
                "author": author_email,
                "timestamp": datetime.utcnow(),
            }

            result = feeds_collection.insert_one(feed_data)
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error creating feed: {e}")
            raise

    @staticmethod
    def get_all():
        """
        Get all feeds.

        Returns:
            list: List of feeds
        """
        try:
            feeds = feeds_collection.find().sort("timestamp", -1)

            feed_list = []
            for feed in feeds:
                # Get author details
                author = users_collection.find_one({"email": feed["author"]})

                if author:
                    author_data = {
                        "email": author["email"],
                        "name": author["name"],
                    }
                else:
                    # If author not found, provide default values
                    author_data = {
                        "email": "unknown@example.com",
                        "name": "Unknown User",
                    }

                feed_data = {
                    "_id": str(feed["_id"]),
                    "content": feed["content"],
                    "author": author_data,
                    "timestamp": feed["timestamp"].isoformat(),
                }

                feed_list.append(feed_data)

            return feed_list

        except Exception as e:
            logger.error(f"Error getting feeds: {e}")
            return []

    @staticmethod
    def get_by_id(feed_id):
        """
        Get a feed by ID.

        Args:
            feed_id: Feed ID

        Returns:
            dict: Feed data or None
        """
        try:
            feed = feeds_collection.find_one({"_id": ObjectId(feed_id)})
            return feed

        except Exception as e:
            logger.error(f"Error getting feed: {e}")
            return None

    @staticmethod
    def delete(feed_id):
        """
        Delete a feed.

        Args:
            feed_id: Feed ID

        Returns:
            bool: Success status
        """
        try:
            result = feeds_collection.delete_one({"_id": ObjectId(feed_id)})
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting feed: {e}")
            return False
