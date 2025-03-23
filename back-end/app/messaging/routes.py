from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.messaging.models import Conversation, Message
from app.auth.models import User
from app.utils.validators import validate_user_input

messaging_bp = Blueprint("messaging", __name__)


@messaging_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    try:
        current_user = get_jwt_identity()

        # Get conversations
        conversations = Conversation.get_for_user(current_user)

        return jsonify(conversations), 200

    except Exception as e:
        current_app.logger.error(f"Error getting conversations: {e}")
        return jsonify({"error": "Failed to get conversations"}), 500


@messaging_bp.route("/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if "participants" not in data or not isinstance(data["participants"], list):
            return jsonify({"error": "Participants list is required"}), 400

        participants = data["participants"]

        # Add current user if not already in the list
        if current_user not in participants:
            participants.append(current_user)

        # Create conversation
        conversation_id = Conversation.create(participants)

        if not conversation_id:
            return jsonify({"error": "Failed to create conversation"}), 500

        # Get conversation details
        conversation = Conversation.get_by_id(conversation_id)

        return jsonify(conversation), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error creating conversation: {e}")
        return jsonify({"error": str(e)}), 500


@messaging_bp.route("/conversations/<conversation_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(conversation_id):
    try:
        current_user = get_jwt_identity()

        # Get pagination parameters
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))

        # Get user
        user = User.find_by_email(current_user)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get conversation
        conversation = Conversation.get_by_id(conversation_id)

        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        # Check if user is a participant
        if str(user["_id"]) not in conversation["participants"]:
            return jsonify({"error": "Unauthorized"}), 403

        # Get messages
        messages = Message.get_by_conversation(conversation_id, page, per_page)

        return jsonify(messages), 200

    except Exception as e:
        current_app.logger.error(f"Error getting messages: {e}")
        return jsonify({"error": "Failed to get messages"}), 500


@messaging_bp.route("/users/search", methods=["GET"])
@jwt_required()
def search_users():
    try:
        current_user = get_jwt_identity()

        # Get search parameters
        query = request.args.get("q", "")
        role = request.args.get("role", "")
        dept = request.args.get("dept", "")

        # Search users
        users = User.search_users(query, role, dept, current_user)

        return jsonify(users), 200

    except Exception as e:
        current_app.logger.error(f"Error searching users: {e}")
        return jsonify({"error": "Failed to search users"}), 500
