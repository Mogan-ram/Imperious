from app.models.base import (
    connections_collection,
    connection_requests_collection,
    users_collection,
)
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class Connection:
    @staticmethod
    def get_user_connections(user_id):
        """
        Get all connections for a specific user.

        Args:
            user_id (str): The user's ID

        Returns:
            list: List of connections with connected user details
        """
        try:
            # Find all accepted connections where user is either user1 or user2
            connections = list(
                connections_collection.find(
                    {
                        "$and": [
                            {"status": "accepted"},
                            {"$or": [{"user1_id": user_id}, {"user2_id": user_id}]},
                        ]
                    }
                )
            )

            result = []
            for connection in connections:
                # Determine which user ID is the other user
                other_user_id = (
                    connection["user2_id"]
                    if connection["user1_id"] == user_id
                    else connection["user1_id"]
                )

                # Get user details
                other_user = users_collection.find_one({"_id": ObjectId(other_user_id)})

                if other_user:
                    result.append(
                        {
                            "connection_id": str(connection["_id"]),
                            "connected_at": connection["updated_at"].isoformat(),
                            "user": {
                                "_id": str(other_user["_id"]),
                                "name": other_user["name"],
                                "email": other_user["email"],
                                "role": other_user["role"],
                                "dept": other_user.get("dept", ""),
                                "batch": other_user.get("batch", ""),
                                "photo_url": other_user.get("photo_url", ""),
                            },
                        }
                    )

            return result
        except Exception as e:
            logger.error(f"Error in get_user_connections: {str(e)}")
            return []

    @staticmethod
    def get_connection_status(user1_id, user2_id):
        """
        Check the connection status between two users.

        Args:
            user1_id (str): The first user's ID
            user2_id (str): The second user's ID

        Returns:
            dict: Connection status information
        """
        try:
            # Check if already connected
            connection = connections_collection.find_one(
                {
                    "$and": [
                        {
                            "$or": [
                                {
                                    "$and": [
                                        {"user1_id": user1_id},
                                        {"user2_id": user2_id},
                                    ]
                                },
                                {
                                    "$and": [
                                        {"user1_id": user2_id},
                                        {"user2_id": user1_id},
                                    ]
                                },
                            ]
                        },
                        {"status": "accepted"},
                    ]
                }
            )

            if connection:
                return {
                    "status": "connected",
                    "connection_id": str(connection["_id"]),
                    "connected_at": connection["updated_at"].isoformat(),
                }

            # Check if there's a pending request from user1 to user2
            sent_request = connection_requests_collection.find_one(
                {"from_user_id": user1_id, "to_user_id": user2_id, "status": "pending"}
            )

            if sent_request:
                return {
                    "status": "pending_sent",
                    "request_id": str(sent_request["_id"]),
                    "created_at": sent_request["created_at"].isoformat(),
                }

            # Check if there's a pending request from user2 to user1
            received_request = connection_requests_collection.find_one(
                {"from_user_id": user2_id, "to_user_id": user1_id, "status": "pending"}
            )

            if received_request:
                return {
                    "status": "pending_received",
                    "request_id": str(received_request["_id"]),
                    "created_at": received_request["created_at"].isoformat(),
                }

            # No connection or pending request
            return {"status": "not_connected"}
        except Exception as e:
            logger.error(f"Error in get_connection_status: {str(e)}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def get_pending_requests(user_id):
        """
        Get pending connection requests for a user.

        Args:
            user_id (str): The user's ID

        Returns:
            list: List of pending connection requests
        """
        try:
            # Get pending connection requests directed to the user
            requests = list(
                connection_requests_collection.find(
                    {"to_user_id": user_id, "status": "pending"}
                ).sort("created_at", -1)
            )

            result = []
            for request in requests:
                # Get sender details
                from_user = users_collection.find_one(
                    {"_id": ObjectId(request["from_user_id"])}
                )

                if from_user:
                    result.append(
                        {
                            "_id": str(request["_id"]),
                            "created_at": request["created_at"].isoformat(),
                            "from_user": {
                                "_id": str(from_user["_id"]),
                                "name": from_user["name"],
                                "email": from_user["email"],
                                "role": from_user["role"],
                                "dept": from_user.get("dept", ""),
                                "batch": from_user.get("batch", ""),
                                "photo_url": from_user.get("photo_url", ""),
                            },
                        }
                    )

            return result
        except Exception as e:
            logger.error(f"Error in get_pending_requests: {str(e)}")
            return []

    @staticmethod
    def create_request(from_user_id, to_user_id):
        """
        Create a new connection request.

        Args:
            from_user_id (str): The sender's user ID
            to_user_id (str): The recipient's user ID

        Returns:
            dict: Result with success status and other info
        """
        try:
            # Don't allow users to connect with themselves
            if from_user_id == to_user_id:
                return {
                    "success": False,
                    "message": "Cannot connect with yourself",
                    "status_code": 400,
                }

            # Check if already connected
            existing_connection = connections_collection.find_one(
                {
                    "$or": [
                        {
                            "$and": [
                                {"user1_id": from_user_id},
                                {"user2_id": to_user_id},
                            ]
                        },
                        {
                            "$and": [
                                {"user1_id": to_user_id},
                                {"user2_id": from_user_id},
                            ]
                        },
                    ]
                }
            )

            if existing_connection:
                return {
                    "success": False,
                    "message": "Connection already exists",
                    "status_code": 400,
                }

            # Check if there's already a pending request in either direction
            existing_request = connection_requests_collection.find_one(
                {
                    "$or": [
                        {
                            "$and": [
                                {"from_user_id": from_user_id},
                                {"to_user_id": to_user_id},
                            ]
                        },
                        {
                            "$and": [
                                {"from_user_id": to_user_id},
                                {"to_user_id": from_user_id},
                            ]
                        },
                    ],
                    "status": "pending",
                }
            )

            if existing_request:
                return {
                    "success": False,
                    "message": "Connection request already exists",
                    "status_code": 400,
                }

            # Create new connection request
            new_request = {
                "from_user_id": from_user_id,
                "to_user_id": to_user_id,
                "status": "pending",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }

            result = connection_requests_collection.insert_one(new_request)

            return {"success": True, "request_id": str(result.inserted_id)}
        except Exception as e:
            logger.error(f"Error in create_request: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to create connection request: {str(e)}",
                "status_code": 500,
            }

    @staticmethod
    def respond_to_request(request_id, user_id, status):
        """
        Respond to a connection request.

        Args:
            request_id (str): The request ID
            user_id (str): The user's ID (for authorization)
            status (str): 'accepted' or 'rejected'

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if status not in ["accepted", "rejected"]:
                return False

            # Find the connection request
            connection_request = connection_requests_collection.find_one(
                {
                    "_id": ObjectId(request_id),
                    "to_user_id": user_id,
                    "status": "pending",
                }
            )

            if not connection_request:
                return False

            # Update the request status
            connection_requests_collection.update_one(
                {"_id": ObjectId(request_id)},
                {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
            )

            # If accepted, create a connection
            if status == "accepted":
                from_user_id = connection_request["from_user_id"]

                new_connection = {
                    "user1_id": from_user_id,
                    "user2_id": user_id,
                    "status": "accepted",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }

                connections_collection.insert_one(new_connection)

            return True
        except Exception as e:
            logger.error(f"Error in respond_to_request: {str(e)}")
            return False

    @staticmethod
    def remove_connection(connection_id, user_id):
        """
        Remove a connection.

        Args:
            connection_id (str): The connection ID
            user_id (str): The user's ID (for authorization)

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Verify user is part of the connection
            connection = connections_collection.find_one(
                {
                    "_id": ObjectId(connection_id),
                    "$or": [{"user1_id": user_id}, {"user2_id": user_id}],
                }
            )

            if not connection:
                return False

            # Delete the connection
            result = connections_collection.delete_one({"_id": ObjectId(connection_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error in remove_connection: {str(e)}")
            return False
