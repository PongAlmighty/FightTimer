import os
from app import app, socketio

if __name__ == "__main__":
    # Use environment variable with fallback for port configuration
    port = int(os.environ.get('PORT', 8765))
    socketio.run(app, host="0.0.0.0", port=port, debug=True, use_reloader=True, log_output=True)