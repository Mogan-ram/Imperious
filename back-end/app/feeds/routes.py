from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.feeds.models import Feed
from app.auth.models import User

feeds_bp = Blueprint("feeds", __name__)


@feeds_bp.route("", methods=["GET", "POST"])
@jwt_required()
def handle_feeds():
    current_user = get_jwt_identity()

    if request.method == "GET":
        feeds = Feed.get_all()
        return jsonify(feeds), 200

    elif request.method == "POST":
        try:
            content = request.json.get("content")

            if not content or not content.strip():
                return jsonify({"message": "Content is required"}), 400

            feed_id = Feed.create(current_user, content)
            return jsonify({"id": feed_id}), 201

        except Exception as e:
            current_app.logger.error(f"Error creating feed: {str(e)}")
            return jsonify({"message": str(e)}), 400


@feeds_bp.route("/<id>", methods=["DELETE"])
@jwt_required()
def delete_feed(id):
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        feed = Feed.get_by_id(id)

        if not feed:
            return jsonify({"message": "Feed not found"}), 404

        # Check if user is the author or staff
        if feed["author"] != current_user and user["role"] != "staff":
            return jsonify({"message": "Permission denied"}), 403

        Feed.delete(id)
        return jsonify({"message": "Feed deleted successfully"}), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting feed: {str(e)}")
        return jsonify({"message": str(e)}), 400
