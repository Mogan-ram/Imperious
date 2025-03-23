from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.connections.models import Connection
from app.auth.models import User
from bson import ObjectId
from datetime import datetime, timezone

connections_bp = Blueprint('connections', __name__)

@connections_bp.route('', methods=['GET'])
@jwt_required()
def get_user_connections():
    try:
        current_user = get_jwt_identity()
        user = User.find_by_email(current_user)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        user_id = str(user["_id"])
        
        # Get connections
        connections = Connection.get_user_connections(user_id)
        
        return jsonify(connections), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting connections: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_specific_user_connections(user_id):
    try:
        current_user = get_jwt_identity()
        # Verify user exists
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Get connections
        connections = Connection.get_user_connections(user_id)
        
        # Check if we should limit the connections shown
        current_user_obj = User.find_by_email(current_user)
        is_own_profile = user_id == str(current_user_obj["_id"])
        is_admin = current_user_obj["role"].lower() in ["admin", "staff"]
        
        if not is_own_profile and not is_admin:
            # Limit the number of connections shown
            connections = connections[:10]
        
        return jsonify(connections), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting specific user connections: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/status/<user_id>', methods=['GET'])
@jwt_required()
def check_connection_status(user_id):
    try:
        current_user = get_jwt_identity()
        current_user_obj = User.find_by_email(current_user)
        
        if not current_user_obj:
            return jsonify({"message": "Current user not found"}), 404
        
        current_user_id = str(current_user_obj["_id"])
        
        # Get connection status
        status = Connection.get_connection_status(current_user_id, user_id)
        
        return jsonify(status), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking connection status: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_connection_requests():
    try:
        current_user = get_jwt_identity()
        current_user_obj = User.find_by_email(current_user)
        
        if not current_user_obj:
            return jsonify({"message": "User not found"}), 404
        
        current_user_id = str(current_user_obj["_id"])
        
        # Get connection requests
        requests = Connection.get_pending_requests(current_user_id)
        
        return jsonify(requests), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting connection requests: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/requests', methods=['POST'])
@jwt_required()
def send_connection_request():
    try:
        current_user = get_jwt_identity()
        current_user_obj = User.find_by_email(current_user)
        
        if not current_user_obj:
            return jsonify({"message": "User not found"}), 404
        
        data = request.get_json()
        to_user_id = data.get("userId")
        
        if not to_user_id:
            return jsonify({"message": "Target user ID is required"}), 400
        
        # Verify target user exists
        to_user = User.find_by_id(to_user_id)
        
        if not to_user:
            return jsonify({"message": "Target user not found"}), 404
        
        current_user_id = str(current_user_obj["_id"])
        
        # Create connection request
        result = Connection.create_request(current_user_id, to_user_id)
        
        if result["success"]:
            return jsonify({
                "message": "Connection request sent successfully",
                "request_id": result["request_id"]
            }), 201
        else:
            return jsonify({"message": result["message"]}), result["status_code"]
        
    except Exception as e:
        current_app.logger.error(f"Error sending connection request: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/requests/<request_id>', methods=['PUT'])
@jwt_required()
def respond_to_connection_request(request_id):
    try:
        current_user = get_jwt_identity()
        current_user_obj = User.find_by_email(current_user)
        
        if not current_user_obj:
            return jsonify({"message": "User not found"}), 404
        
        data = request.get_json()
        status = data.get("status")
        
        if status not in ["accepted", "rejected"]:
            return jsonify({"message": "Invalid status. Must be 'accepted' or 'rejected'"}), 400
        
        current_user_id = str(current_user_obj["_id"])
        
        # Respond to connection request
        result = Connection.respond_to_request(request_id, current_user_id, status)
        
        if result:
            return jsonify({"message": f"Connection request {status}"}), 200
        else:
            return jsonify({"message": "Connection request not found or not directed to you"}), 404
        
    except Exception as e:
        current_app.logger.error(f"Error responding to connection request: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@connections_bp.route('/<connection_id>', methods=['DELETE'])
@jwt_required()
def remove_connection(connection_id):
    try:
        current_user = get_jwt_identity()
        current_user_obj = User.find_by_email(current_user)
        
        if not current_user_obj:
            return jsonify({"message": "User not found"}), 404
        
        current_user_id = str(current_user_obj["_id"])
        
        # Remove connection
        result = Connection.remove_connection(connection_id, current_user_id)
        
        if result:
            return jsonify({"message": "Connection removed successfully"}), 200
        else:
            return jsonify({"message": "Connection not found or you are not authorized to remove it"}), 404
        
    except Exception as e:
        current_app.logger.error(f"Error removing connection: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500