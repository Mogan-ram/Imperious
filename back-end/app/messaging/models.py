from app.models.base import (
    conversations_collection,
    messages_collection,
    users_collection,
)
from bson import ObjectId
from datetime import datetime, timezone
from pymongo import DESCENDING
import logging

logger = logging.getLogger(__name__)


class Conversation:
    @staticmethod
    def create(participants):
        """
        Create a new conversation between users.

        Args:
            participants: List of user email addresses

        Returns:
            str: ID of the created conversation
        """
        try:
            # Ensure all participants are valid users
            valid_participants = []

            for email in participants:
                user = users_collection.find_one({"email": email})

                if user:
                    valid_participants.append(str(user["_id"]))

            if len(valid_participants) < 2:
                raise ValueError("At least two valid participants are required")

            # Ensure we don't create duplicate conversations
            existing = conversations_collection.find_one(
                {
                    "participants": {
                        "$all": valid_participants,
                        "$size": len(valid_participants),
                    }
                }
            )

            if existing:
                return str(existing["_id"])

            # Create new conversation
            conversation = {
                "participants": valid_participants,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "last_message": None,
            }

            result = conversations_collection.insert_one(conversation)
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return None

    @staticmethod
    def get_by_id(conversation_id):
        """
        Get a conversation by ID.

        Args:
            conversation_id: Conversation ID

        Returns:
            dict: Conversation data or None
        """
        try:
            conversation = conversations_collection.find_one(
                {"_id": ObjectId(conversation_id)}
            )

            if conversation:
                # Convert ObjectId to string
                conversation["_id"] = str(conversation["_id"])

                # Get participant details
                participants = []
                for user_id in conversation["participants"]:
                    user = users_collection.find_one({"_id": ObjectId(user_id)})

                    if user:
                        participants.append(
                            {
                                "_id": str(user["_id"]),
                                "name": user.get("name", "Unknown"),
                                "email": user.get("email", ""),
                                "role": user.get("role", ""),
                                "dept": user.get("dept", ""),
                            }
                        )

                conversation["participant_details"] = participants

                # Format dates
                if "created_at" in conversation:
                    conversation["created_at"] = conversation["created_at"].isoformat()
                if "updated_at" in conversation:
                    conversation["updated_at"] = conversation["updated_at"].isoformat()

            return conversation

        except Exception as e:
            logger.error(f"Error in Conversation.get_by_id: {e}")
            return None

    @staticmethod
    def get_for_user(user_email):
        """
        Get all conversations for a user.

        Args:
            user_email: User email

        Returns:
            list: List of conversations
        """
        try:
            user = users_collection.find_one({"email": user_email})

            if not user:
                return []

            user_id = str(user["_id"])

            # Find all conversations where the user is a participant
            conversations = list(
                conversations_collection.find({"participants": user_id}).sort(
                    "updated_at", DESCENDING
                )
            )

            result = []
            for conv in conversations:
                # Convert ObjectId to string
                conv["_id"] = str(conv["_id"])

                # Get the other participants' details
                other_participants = []
                for participant_id in conv["participants"]:
                    if participant_id != user_id:
                        other_user = users_collection.find_one(
                            {"_id": ObjectId(participant_id)}
                        )

                        if other_user:
                            other_participants.append(
                                {
                                    "_id": str(other_user["_id"]),
                                    "name": other_user.get("name", "Unknown"),
                                    "email": other_user.get("email", ""),
                                    "role": other_user.get("role", ""),
                                    "dept": other_user.get("dept", ""),
                                }
                            )

                conv["other_participants"] = other_participants

                # Get unread count
                unread_count = messages_collection.count_documents(
                    {
                        "conversation_id": conv["_id"],
                        "sender": {"$ne": user_id},
                        "read_by": {"$nin": [user_id]},
                    }
                )

                conv["unread_count"] = unread_count

                # Get last message
                last_message = messages_collection.find_one(
                    {"conversation_id": conv["_id"]}, sort=[("created_at", DESCENDING)]
                )

                if last_message:
                    last_message["_id"] = str(last_message["_id"])

                    if "created_at" in last_message:
                        last_message["created_at"] = last_message[
                            "created_at"
                        ].isoformat()

                    conv["last_message"] = last_message

                # Format dates
                if "created_at" in conv:
                    conv["created_at"] = conv["created_at"].isoformat()
                if "updated_at" in conv:
                    conv["updated_at"] = conv["updated_at"].isoformat()

                result.append(conv)

            return result

        except Exception as e:
            logger.error(f"Error in Conversation.get_for_user: {e}")
            return []

    @staticmethod
    def mark_as_read(conversation_id, user_email):
        """
        Mark all messages in a conversation as read for a user.

        Args:
            conversation_id: Conversation ID
            user_email: User email

        Returns:
            bool: Success status
        """
        try:
            user = users_collection.find_one({"email": user_email})

            if not user:
                return False

            user_id = str(user["_id"])

            # Update all unread messages
            messages_collection.update_many(
                {
                    "conversation_id": conversation_id,
                    "sender": {"$ne": user_id},
                    "read_by": {"$nin": [user_id]},
                },
                {"$addToSet": {"read_by": user_id}},
            )

            return True

        except Exception as e:
            logger.error(f"Error marking conversation as read: {e}")
            return False


class Message:
    @staticmethod
    def create(user_email, conversation_id, text, attachments=None):
        """
        Create a new message.

        Args:
            user_email: Email of the sender
            conversation_id: ID of the conversation
            text: Message text
            attachments: List of attachment objects (optional)

        Returns:
            dict: Created message with user details
        """
        try:
            # Validate user
            user = users_collection.find_one({"email": user_email})

            if not user:
                raise ValueError("Invalid user")

            # Validate conversation
            conversation = conversations_collection.find_one(
                {"_id": ObjectId(conversation_id)}
            )

            if not conversation:
                raise ValueError("Conversation not found")

            # Ensure user is a participant
            user_id = str(user["_id"])

            if user_id not in conversation["participants"]:
                raise ValueError("User is not a participant in this conversation")

            # Create message
            now = datetime.now(timezone.utc)
            message = {
                "conversation_id": conversation_id,
                "sender": user_id,
                "text": text,
                "created_at": now,
                "read_by": [user_id],  # Sender has read their own message
                "attachments": attachments or [],
            }

            result = messages_collection.insert_one(message)
            message_id = str(result.inserted_id)

            # Update conversation's last update time
            conversations_collection.update_one(
                {"_id": ObjectId(conversation_id)}, {"$set": {"updated_at": now}}
            )

            # Return the created message with additional info
            message["_id"] = message_id
            message["created_at"] = message["created_at"].isoformat()
            message["sender_details"] = {
                "_id": user_id,
                "name": user.get("name", "Unknown"),
                "email": user.get("email", ""),
                "role": user.get("role", ""),
                "dept": user.get("dept", ""),
            }

            return message

        except Exception as e:
            logger.error(f"Error creating message: {e}")
            raise

    @staticmethod
    def get_by_conversation(conversation_id, page=1, per_page=20):
        """
        Get messages for a conversation with pagination.

        Args:
            conversation_id: ID of the conversation
            page: Page number (starting from 1)
            per_page: Number of messages per page

        Returns:
            dict: Paginated messages with total count and page info
        """
        try:
            # Calculate skip
            skip = (page - 1) * per_page

            # Get total count
            total = messages_collection.count_documents(
                {"conversation_id": conversation_id}
            )

            # Get messages with pagination
            messages = list(
                messages_collection.find({"conversation_id": conversation_id})
                .sort("created_at", DESCENDING)
                .skip(skip)
                .limit(per_page)
            )

            # Process messages
            result = []
            for msg in messages:
                # Convert ObjectId to string
                msg["_id"] = str(msg["_id"])

                # Get sender details
                sender = users_collection.find_one({"_id": ObjectId(msg["sender"])})

                if sender:
                    msg["sender_details"] = {
                        "_id": str(sender["_id"]),
                        "name": sender.get("name", "Unknown"),
                        "email": sender.get("email", ""),
                        "role": sender.get("role", ""),
                        "dept": sender.get("dept", ""),
                    }

                # Format date
                if "created_at" in msg:
                    msg["created_at"] = msg["created_at"].isoformat()

                result.append(msg)

            # Reverse to get chronological order (oldest first)
            result.reverse()

            return {
                "messages": result,
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page,
            }

        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return {
                "messages": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "pages": 0,
            }
