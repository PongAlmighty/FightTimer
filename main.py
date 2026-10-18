import os
from app import app, socketio

if __name__ == "__main__":
    # Use environment variable with fallback to port 55011
    port = int(os.environ.get('PORT', 55011))
    # Reloader stays off: under it the master_heartbeat_sync background task never runs
    socketio.run(app, host="0.0.0.0", port=port, debug=True, use_reloader=False, log_output=True, allow_unsafe_werkzeug=True)