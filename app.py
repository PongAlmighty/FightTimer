import logging
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a-very-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    """Render the timer display page."""
    return render_template('index.html')

@app.route('/control')
def control():
    """Render the control panel page."""
    return render_template('control.html')

@socketio.on('timer_control')
def handle_timer_control(data):
    """Handle timer control events from Companion or control panel."""
    logger.debug(f"Received timer control: {data}")
    emit('timer_update', data, broadcast=True)

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.debug("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.debug("Client disconnected")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
