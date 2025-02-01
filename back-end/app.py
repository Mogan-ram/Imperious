from flask import Flask, request, jsonify
from flask_cors import CORS
from auth import create_user, login_user, get_user_profile, update_user_profile

app = Flask(__name__)
CORS(app)


# routes
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    return create_user(data)


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    return login_user(data)


@app.route("/profile", methods=["GET", "PUT"])
def profile():
    token = request.headers.get("Authorization")
    if request.method == "GET":
        return get_user_profile(token)
    elif request.method == "PUT":
        return update_user_profile(token, request.json)


if __name__ == "__main__":
    app.run(debug=True)
