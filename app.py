import logging
import os
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'development-key')
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins in development

@app.route('/')
def index():
    """Render the timer display page."""
    logger.debug("Serving index page")
    return render_template('index.html')

@app.route('/control')
def control():
    """Render the control panel page."""
    logger.debug("Serving control panel")
    return render_template('control.html')

@app.route('/api/timer', methods=['GET', 'POST'])
def timer_api():
    """REST API endpoint for Bitfocus Companion integration."""
    if request.method == 'GET':
        logger.debug("API status check")
        return jsonify({
            "status": "success",
            "message": "Timer API endpoint is active",
            "supported_actions": ["start", "stop", "reset", "settings"]
        })

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    action = data.get('action')
    if action not in ['start', 'stop', 'reset', 'settings']:
        return jsonify({"error": "Invalid action"}), 400

    # Handle timer control
    if action == 'settings':
        settings = data.get('settings', {})
        logger.debug(f"API received settings update: {settings}")
        socketio.emit('timer_update', {'action': 'settings', 'settings': settings})
        return jsonify({"status": "success"})
    else:
        control_data = {
            'action': action,
            'minutes': data.get('minutes', 5),
            'seconds': data.get('seconds', 0)
        }
        logger.debug(f"API received timer control: {control_data}")
        socketio.emit('timer_update', control_data)
        return jsonify({"status": "success"})

@socketio.on('timer_control')
def handle_timer_control(data):
    """Handle timer control events from Companion or control panel."""
    logger.debug(f"Received timer control: {data}")
    emit('timer_update', data, broadcast=True)

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.debug("Client connected")
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.debug("Client disconnected")