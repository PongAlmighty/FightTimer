import logging
import os
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from font_manager import FontManager

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app and SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'development-key')
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins in development

# Initialize the font manager
font_manager = FontManager()

@app.route('/')
def index():
    """Render the timer display page."""
    logger.debug("Serving index page")
    return render_template('index.html')

@app.route('/fonts/status')
def font_status():
    """Return status of downloaded fonts."""
    if not os.path.exists(font_manager.font_dir):
        return jsonify({"status": "no_fonts", "message": "No fonts have been downloaded yet"})
    
    font_files = [f for f in os.listdir(font_manager.font_dir) if f.endswith('.css') or f.endswith('.woff2')]
    return jsonify({
        "status": "success",
        "fonts_count": len(font_files),
        "fonts": font_files
    })

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
        
        # If there's a Google Font URL, download it locally
        if settings.get('googleFontUrl'):
            google_font_url = settings['googleFontUrl']
            local_font_url = font_manager.get_local_font_url(google_font_url)
            
            if local_font_url:
                # Replace the Google Font URL with the local URL
                settings['googleFontUrl'] = local_font_url
                logger.debug(f"Replaced Google Font URL with local URL: {local_font_url}")
        
        socketio.emit('timer_update', {'action': 'settings', 'settings': settings})
        return jsonify({"status": "success"})
    else:
        control_data = {
            'action': action,
            'minutes': data.get('minutes', 3),
            'seconds': data.get('seconds', 0)
        }
        logger.debug(f"API received timer control: {control_data}")
        socketio.emit('timer_update', control_data)
        return jsonify({"status": "success"})

@socketio.on('timer_control')
def handle_timer_control(data):
    """Handle timer control events from Companion or control panel."""
    logger.debug(f"Received timer control: {data}")
    
    # If this is a settings update with a Google Font URL, download it locally
    if data.get('action') == 'settings' and data.get('settings', {}).get('googleFontUrl'):
        google_font_url = data['settings']['googleFontUrl']
        local_font_url = font_manager.get_local_font_url(google_font_url)
        
        if local_font_url:
            # Replace the Google Font URL with the local URL
            data['settings']['googleFontUrl'] = local_font_url
            logger.debug(f"Replaced Google Font URL with local URL: {local_font_url}")
    
    emit('timer_update', data, broadcast=True)

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.debug("Client connected")
    emit('connection_response', {'status': 'connected'})

@socketio.on('request_current_settings')
def handle_settings_request():
    """Handle request for current settings."""
    logger.debug("Client requested current settings")
    # This would ideally fetch from a database
    # For now, we'll just acknowledge the request
    emit('settings_response', {'status': 'acknowledged'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.debug("Client disconnected")
