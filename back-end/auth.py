import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from flask import jsonify
from models import User

SECRET_KEY = os.urandom(24).hex()


def create_user(data):
    hashed_pwd = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())
    user = User(
        email=data["email"], password=hashed_pwd, role=data.get("role", "student")
    )
    user.save()
    return jsonify({"message": "User created successfully"}), 201


def login_user(data):
    user = User.find_by_email(data["email"])
    if user and bcrypt.checkpw(data["password"].encode("utf-8"), user["password"]):
        token = jwt.encode(
            {
                "email": user["email"],
                "role": user["role"],
                "exp": datetime.utcnow() + timedelta(hours=1),
            },
            SECRET_KEY,
            algorithm="HS256",
        )
        return jsonify({"token": token}), 200
    return jsonify({"message": "Invalid credentials"}), 401


def get_user_profile(token):
    if not token or not token.startswith("Bearer "):
        return jsonify({"message": "Token is missing or invalid"}), 400
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.find_by_email(payload["email"])
        return jsonify({"email": user["email"], "role": user["role"]}), 200
    except jwt.DecodeError:
        return jsonify({"message": "Invalid token"}), 401


def update_user_profile(token, data):
    if not token or not token.startswith("Bearer "):
        return jsonify({"message": "Token is missing or invalid"}), 400
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        User.update_by_email(payload["email"], data)
        return jsonify({"message": "Profile updated successfully"}), 200
    except jwt.DecodeError:
        return jsonify({"message": "Invalid token"}), 401
