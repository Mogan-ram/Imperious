import os
from app import create_app, socketio

app = create_app(os.getenv("FLASK_CONFIG") or "default")

if __name__ == "__main__":
    socketio.run(app, debug=app.config["DEBUG"], host="0.0.0.0", port=5000)
