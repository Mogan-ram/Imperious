import os
import logging
import atexit
import signal
from app.auth.models import User
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_mail import Mail, Message
from app.messaging.models import Conversation, Message
from flask import Flask, current_app, jsonify, request
from flask_socketio import SocketIO, join_room, leave_room


# Initialize extensions
jwt = JWTManager()
socketio = SocketIO(
    cors_allowed_origins="*",  # Replace with your frontend URL in production
    async_mode="threading",  # Use threading mode
    logger=False,  # Enable logging
    engineio_logger=False,  # Enable engine.io logging
)
# Dictionary to track online users
online_users = {}
mail = Mail()
load_dotenv()


def create_app(config_name=None):
    """Application factory for creating Flask instances."""
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "default")
    app.config.from_object(f"app.config.{config_name.capitalize()}Config")

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Configure CORS properly
    CORS(
        app,
        resources={
            r"/*": {
                "origins": ["http://localhost:3000", "https://nex-um.netlify.app/"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )

    # Mail configuration
    app.config["MAIL_SERVER"] = "smtp.gmail.com"  # Or your SMTP server
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")  # Set as env variable
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")  # Set as env variable
    app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER")

    # backend connection test
    @app.route("/")
    def home():
        return "Backend API is running!", 200

    mail = Mail()
    mail.init_app(app)

    # Initialize extensions
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.profile.routes import profile_bp
    from app.news_events.routes import news_events_bp
    from app.projects.routes import projects_bp
    from app.mentorship.routes import mentorship_bp
    from app.collaborations.routes import collaborations_bp
    from app.jobs.routes import jobs_bp
    from app.analytics.routes import analytics_bp
    from app.messaging.routes import messaging_bp
    from app.connections.routes import connections_bp
    from app.feeds.routes import feeds_bp
    from app.utils.email import send_bug_report_email

    app.register_blueprint(auth_bp)
    app.register_blueprint(feeds_bp, url_prefix="/feeds")
    app.register_blueprint(profile_bp, url_prefix="/profile")
    app.register_blueprint(news_events_bp, url_prefix="/news-events")
    app.register_blueprint(projects_bp, url_prefix="/projects")
    app.register_blueprint(mentorship_bp, url_prefix="/mentorship")
    app.register_blueprint(collaborations_bp, url_prefix="/collaborations")
    app.register_blueprint(jobs_bp, url_prefix="/jobs")
    app.register_blueprint(analytics_bp)
    app.register_blueprint(messaging_bp, url_prefix="/api")
    app.register_blueprint(connections_bp, url_prefix="/connections")

    # Setup error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Invalid token"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        app.logger.error(f"Token expired: {jwt_data}")
        return jsonify(message="Token has expired"), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        app.logger.error(f"Missing token error: {error}")
        return jsonify(message="Missing authorization token"), 401

    # Register shutdown handlers
    def shutdown_server():
        app.logger.info("Server shutting down...")

    atexit.register(shutdown_server)
    signal.signal(signal.SIGTERM, lambda sig, frame: shutdown_server())
    signal.signal(signal.SIGINT, lambda sig, frame: shutdown_server())

    @app.route("/shutdown", methods=["POST"])
    def shutdown():
        shutdown_server()
        return "Server shutting down..."

    @app.before_request
    def handle_options_request():
        if request.method == "OPTIONS":
            response = current_app.make_default_options_response()

            # Add CORS headers
            headers = response.headers
            headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
            headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            headers["Access-Control-Allow-Credentials"] = "true"

            return response

    # Create upload directories if they don't exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["NEWS_EVENTS_UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["PROFILE_PHOTOS_FOLDER"], exist_ok=True)

    # Socket.IO event handlers
    @socketio.on("connect")
    def handle_connect():
        app.logger.info("Client connected")

    @socketio.on("disconnect")
    def handle_disconnect():
        # Remove user from online users
        for user_email, sid in list(online_users.items()):
            if sid == request.sid:
                del online_users[user_email]
                socketio.emit(
                    "user_status",
                    {"email": user_email, "status": "online"},
                    to="/",  # Broadcast to all connections
                )
                app.logger.info(f"User {user_email} disconnected")
                break

    @socketio.on("login")
    def handle_login(data):
        user_email = data.get("email")
        if user_email:
            # Store user's socket ID
            online_users[user_email] = request.sid
            # Notify others that user is online
            socketio.emit(
                "user_status",
                {"email": user_email, "status": "online"},
                to="/",  # Broadcast to all connections
            )
            app.logger.info(f"User {user_email} logged in")

    @socketio.on("join_conversation")
    def handle_join_conversation(data):
        conversation_id = data.get("conversation_id")
        user_email = data.get("email")

        if not conversation_id or not user_email:
            app.logger.warning(f"Missing data in join_conversation: {data}")
            return

        # Create a room name using conversation ID
        room = f"conversation_{conversation_id}"

        # Verify user is part of the conversation
        user = User.find_by_email(user_email)
        if not user:
            app.logger.warning(f"User not found: {user_email}")
            return

        conversation = Conversation.get_by_id(conversation_id)
        if not conversation:
            app.logger.warning(f"Conversation not found: {conversation_id}")
            return

        # Check if user is a participant
        if str(user["_id"]) not in conversation["participants"]:
            app.logger.warning(
                f"User {user_email} is not a participant in conversation {conversation_id}"
            )
            return

        # Join the room
        join_room(room)
        app.logger.info(f"User {user_email} joined conversation {conversation_id}")

        # Mark conversation as read
        Conversation.mark_as_read(conversation_id, user_email)

        # Notify others that messages were read
        socketio.emit(
            "messages_read",
            {
                "conversation_id": conversation_id,
                "user_id": str(user["_id"]),
                "user_email": user_email,
            },
            room=room,
        )

    @socketio.on("leave_conversation")
    def handle_leave_conversation(data):
        conversation_id = data.get("conversation_id")

        if conversation_id:
            room = f"conversation_{conversation_id}"
            leave_room(room)
            app.logger.info(f"User left conversation {conversation_id}")

    @socketio.on("send_message")
    def handle_send_message(data):
        user_email = data.get("email")
        conversation_id = data.get("conversation_id")
        text = data.get("text")
        attachments = data.get("attachments")

        if not user_email or not conversation_id or not text:
            app.logger.warning("Incomplete message data")
            return

        try:
            # Create the message
            message = Message.create(user_email, conversation_id, text, attachments)

            # Send to all clients in the conversation room
            room = f"conversation_{conversation_id}"
            socketio.emit("new_message", message, room=room)

            app.logger.info(
                f"Message from {user_email} in conversation {conversation_id}: {text[:20]}..."
            )
        except Exception as e:
            app.logger.error(f"Error sending message: {e}")

    return app
