import logging
import os
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, Namespace
from font_manager import FontManager
from timer_manager import TimerManager

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app and SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'development-key')
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins in development

# Initialize the font manager and timer manager
font_manager = FontManager()
timer_manager = TimerManager()

def broadcast_timer_update(data, timer_id=None):
    """
    Helper function to broadcast timer updates to the appropriate namespace.
    
    Args:
        data: The data to broadcast
        timer_id: Timer ID for multi-timer mode
    """
    if timer_manager.get_mode() == 'multi' and timer_id:
        # Multi-timer mode: broadcast to specific timer namespace
        socketio.emit('timer_update', data, namespace=f'/timer{timer_id}')
        logger.debug(f"Broadcasted to namespace /timer{timer_id}: {data}")
        
        # Mirror Timer 1 to default namespace for hardware/legacy compatibility
        if timer_id == 1:
            socketio.emit('timer_update', data)
            logger.debug(f"Mirrored Timer 1 update to default namespace")
    else:
        # Single-timer mode: broadcast to default namespace
        socketio.emit('timer_update', data)
        logger.debug(f"Broadcasted to default namespace: {data}")

def broadcast_to_control_panels(event, data):
    """
    Helper function to broadcast events to all control panel connections.
    
    Args:
        event: Event name to broadcast
        data: Data to broadcast
    """
    socketio.emit(event, data)
    logger.debug(f"Broadcasted {event} to control panels: {data}")

# Timer-specific namespace class
class TimerNamespace(Namespace):
    def __init__(self, namespace, timer_id):
        super().__init__(namespace)
        self.timer_id = timer_id
        logger.debug(f"Created namespace {namespace} for timer {timer_id}")
    
    def on_connect(self):
        logger.debug(f"Client connected to timer {self.timer_id} namespace")
        emit('connection_response', {
            'status': 'connected',
            'timer_id': self.timer_id,
            'namespace': f'/timer{self.timer_id}'
        })
        
        # Initial synchronization for newly joined client
        timer = timer_manager.get_timer(self.timer_id)
        if timer and timer.is_running:
            time_left = timer.get_current_time_left()
            minutes = time_left // 60
            seconds = time_left % 60
            
            logger.debug(f"Sending initial sync to new client on timer {self.timer_id}: {minutes}:{seconds}")
            
            # Send sync sequence: Reset to exact time, then Start
            emit('timer_update', {
                'action': 'reset',
                'minutes': minutes,
                'seconds': seconds,
                'timer_id': self.timer_id,
                'is_initial_sync': True
            })
            emit('timer_update', {
                'action': 'start',
                'timer_id': self.timer_id
            })
    
    def on_disconnect(self):
        logger.debug(f"Client disconnected from timer {self.timer_id} namespace")
    
    def on_timer_control(self, data):
        """Handle timer control events for this specific timer."""
        logger.debug(f"Received timer control for timer {self.timer_id}: {data}")
        
        # Get the timer for this namespace
        timer = timer_manager.get_timer(self.timer_id)
        if not timer:
            emit('error', {'message': f'Timer {self.timer_id} not found'})
            return
        
        action = data.get('action')
        
        # Handle timer operations
        if action == 'settings':
            settings = data.get('settings', {})
            
            # If there's a Google Font URL, download it locally
            if settings.get('googleFontUrl'):
                google_font_url = settings['googleFontUrl']
                local_font_url = font_manager.get_local_font_url(google_font_url)
                
                if local_font_url:
                    # Replace the Google Font URL with the local URL
                    settings['googleFontUrl'] = local_font_url
                    logger.debug(f"Replaced Google Font URL with local URL: {local_font_url}")
            
            timer.update_settings(settings)
            data['settings'] = settings
        elif action == 'start':
            timer.start()
        elif action == 'stop':
            timer.stop()
        elif action == 'reset':
            minutes = data.get('minutes', 3)
            seconds = data.get('seconds', 0)
            timer.reset(minutes, seconds)
        
        # Add timer_id to response and broadcast to this namespace only
        data['timer_id'] = self.timer_id
        emit('timer_update', data, broadcast=True)
        
        # Also notify control panels about the timer state change
        timer = timer_manager.get_timer(self.timer_id)
        if timer:
            broadcast_to_control_panels('timer_state_changed', {
                'timer_id': self.timer_id,
                'action': action,
                'state': timer.to_dict()
            })
    
    def on_request_current_settings(self, data=None):
        """Handle request for current settings for this timer."""
        logger.debug(f"Client requested current settings for timer {self.timer_id}")
        
        timer = timer_manager.get_timer(self.timer_id)
        
        if timer:
            response = {
                'status': 'success',
                'timer_id': timer.timer_id,
                'settings': timer.settings,
                'state': timer.to_dict()
            }
        else:
            response = {'status': 'error', 'message': f'Timer {self.timer_id} not found'}
        
        emit('settings_response', response)
    
    def on_request_timer_status(self, data=None):
        """Handle request for timer status for this timer."""
        logger.debug(f"Client requested timer status for timer {self.timer_id}")
        
        timer = timer_manager.get_timer(self.timer_id)
        if timer:
            emit('timer_status', timer.to_dict())
        else:
            emit('error', {'message': f'Timer {self.timer_id} not found'})
    
    def on_timer_state(self, data):
        """Receive periodic state broadcast from hardware timer and sync web displays."""
        timer = timer_manager.get_timer(self.timer_id)
        if not timer:
            return

        time_remaining = data.get('timeRemaining')
        is_running = data.get('isRunning', False)
        is_paused = data.get('isPaused', True)

        if time_remaining is None:
            return

        minutes = time_remaining // 60
        seconds = time_remaining % 60

        # Sync server-side timer so the heartbeat task stays accurate
        timer.reset(minutes, seconds)
        if is_running and not is_paused:
            timer.start()

        # Push correction to web display clients only (broadcast=True skips hardware sender)
        # Use is_heartbeat so the client applies drift-check logic before correcting
        emit('timer_update', {
            'action': 'reset',
            'minutes': minutes,
            'seconds': seconds,
            'timer_id': self.timer_id,
            'is_heartbeat': True
        }, broadcast=True)

        if is_running and not is_paused:
            emit('timer_update', {
                'action': 'start',
                'timer_id': self.timer_id,
                'is_heartbeat': True
            }, broadcast=True)
        elif is_paused:
            emit('timer_update', {
                'action': 'stop',
                'timer_id': self.timer_id,
                'is_heartbeat': True
            }, broadcast=True)

        logger.debug(f"Hardware sync timer {self.timer_id}: {time_remaining}s remaining, running={is_running}, paused={is_paused}")

    def on_control_panel_message(self, data):
        """Handle messages from control panel to this timer."""
        logger.debug(f"Timer {self.timer_id} received control panel message: {data}")

        # Forward the message to all clients connected to this timer namespace
        emit('control_panel_update', data, broadcast=True)

# Register timer namespaces for multi-timer mode (timers 1-5)
timer_namespaces = {}
for timer_id in range(1, 6):
    namespace_path = f'/timer{timer_id}'
    timer_namespace = TimerNamespace(namespace_path, timer_id)
    timer_namespaces[timer_id] = timer_namespace
    socketio.on_namespace(timer_namespace)

@app.route('/')
def index():
    """Redirect to mode selection or appropriate timer interface."""
    logger.debug("Index route accessed")
    # Redirect to mode selection page - let JavaScript handle mode preference checking
    return render_template('mode_selection.html')

@app.route('/mode-selection')
def mode_selection():
    """Render the mode selection page."""
    logger.debug("Serving mode selection page")
    return render_template('mode_selection.html')

@app.route('/timer')
def single_timer():
    """Render the single timer display page."""
    logger.debug("Serving single timer page")
    return render_template('index.html')

@app.route('/legacy')
def legacy_redirect():
    """Handle legacy direct access - redirect to mode selection."""
    logger.debug("Legacy route accessed, redirecting to mode selection")
    return render_template('mode_selection.html')

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
    
    port = int(os.environ.get('PORT', 55011))
    return render_template('control.html', server_port=port)

@app.route('/timer/<int:timer_id>')
def timer_display(timer_id):
    """Render individual timer display page for multi-timer mode."""
    # Validate timer_id range
    if timer_id not in range(1, 6):
        logger.error(f"Invalid timer_id: {timer_id}. Must be 1-5")
        return jsonify({"error": f"Invalid timer ID: {timer_id}. Must be between 1 and 5"}), 400
    
    # Check if timer exists or create it
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        logger.error(f"Timer {timer_id} not found")
        return jsonify({"error": f"Timer {timer_id} not found"}), 404
    
    logger.debug(f"Serving timer display for timer {timer_id}")
    return render_template(f'timer_{timer_id}.html')

@app.route('/api/mode', methods=['GET', 'POST'])
def mode_api():
    """API endpoint for mode management."""
    if request.method == 'GET':
        return jsonify({
            "status": "success",
            "mode": timer_manager.get_mode(),
            "timer_count": timer_manager.get_timer_count()
        })
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    mode = data.get('mode')
    if mode not in ['single', 'multi']:
        return jsonify({"error": "Invalid mode. Must be 'single' or 'multi'"}), 400
    
    success = timer_manager.set_mode(mode)
    if success:
        return jsonify({
            "status": "success",
            "mode": timer_manager.get_mode(),
            "message": f"Mode switched to {mode}"
        })
    else:
        return jsonify({"error": "Failed to switch mode"}), 500

@app.route('/api/check-mode-preference')
def check_mode_preference():
    """API endpoint to check if user should be redirected based on mode preference."""
    # This endpoint helps with server-side routing decisions
    # The actual mode preference is stored in localStorage on the client side
    return jsonify({
        "status": "success",
        "message": "Mode preference should be checked on client side",
        "current_server_mode": timer_manager.get_mode()
    })

@app.route('/api/timers/status')
def timers_status():
    """Get status of all timers."""
    timers = timer_manager.get_all_timers()
    timer_data = {tid: timer.to_dict() for tid, timer in timers.items()}
    
    return jsonify({
        "status": "success",
        "mode": timer_manager.get_mode(),
        "timers": timer_data
    })

@app.route('/api/timer', methods=['GET', 'POST'])
@app.route('/api/timer/<int:timer_id>', methods=['GET', 'POST'])
def timer_api(timer_id=None):
    """REST API endpoint for Bitfocus Companion integration."""
    if request.method == 'GET':
        if timer_id:
            timer = timer_manager.get_timer(timer_id)
            if not timer:
                return jsonify({"error": f"Timer {timer_id} not found"}), 404
            return jsonify({
                "status": "success",
                "timer": timer.to_dict()
            })
        else:
            logger.debug("API status check")
            return jsonify({
                "status": "success",
                "message": "Timer API endpoint is active",
                "mode": timer_manager.get_mode(),
                "supported_actions": ["start", "stop", "reset", "settings"]
            })

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Get timer_id from URL parameter or request data
    request_timer_id = timer_id or data.get('timer_id')
    
    # Get the appropriate timer
    timer = timer_manager.get_timer(request_timer_id)
    if not timer:
        if timer_manager.get_mode() == 'multi' and not request_timer_id:
            return jsonify({"error": "timer_id required in multi-timer mode"}), 400
        return jsonify({"error": f"Timer {request_timer_id} not found"}), 404

    action = data.get('action')
    if action not in ['start', 'stop', 'reset', 'settings']:
        return jsonify({"error": "Invalid action"}), 400

    # Handle timer control
    if action == 'settings':
        settings = data.get('settings', {})
        logger.debug(f"API received settings update for timer {timer.timer_id}: {settings}")
        
        # If there's a Google Font URL, download it locally
        if settings.get('googleFontUrl'):
            google_font_url = settings['googleFontUrl']
            local_font_url = font_manager.get_local_font_url(google_font_url)
            
            if local_font_url:
                # Replace the Google Font URL with the local URL
                settings['googleFontUrl'] = local_font_url
                logger.debug(f"Replaced Google Font URL with local URL: {local_font_url}")
        
        timer.update_settings(settings)
        
        # Emit update with timer_id for multi-timer mode
        update_data = {'action': 'settings', 'settings': settings}
        if timer_manager.get_mode() == 'multi':
            update_data['timer_id'] = timer.timer_id
        
        broadcast_timer_update(update_data, timer.timer_id)
        return jsonify({"status": "success", "timer_id": timer.timer_id})
    else:
        # Handle start, stop, reset actions
        if action == 'start':
            timer.start()
        elif action == 'stop':
            timer.stop()
        elif action == 'reset':
            minutes = data.get('minutes', 3)
            seconds = data.get('seconds', 0)
            timer.reset(minutes, seconds)
        
        control_data = {
            'action': action,
            'minutes': data.get('minutes', 3),
            'seconds': data.get('seconds', 0)
        }
        
        # Add timer_id for multi-timer mode
        if timer_manager.get_mode() == 'multi':
            control_data['timer_id'] = timer.timer_id
        
        logger.debug(f"API received timer control for timer {timer.timer_id}: {control_data}")
        broadcast_timer_update(control_data, timer.timer_id)
        return jsonify({"status": "success", "timer_id": timer.timer_id})

@socketio.on('timer_control')
def handle_timer_control(data):
    """Handle timer control events from Companion or control panel (single-timer mode and control panel)."""
    logger.debug(f"Received timer control on default namespace: {data}")
    
    # Get timer_id from data
    timer_id = data.get('timer_id')
    
    # Get the appropriate timer
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        if timer_manager.get_mode() == 'multi' and not timer_id:
            emit('error', {'message': 'timer_id required in multi-timer mode'})
            return
        emit('error', {'message': f'Timer {timer_id} not found'})
        return
    
    action = data.get('action')
    
    # Handle timer operations
    if action == 'settings':
        settings = data.get('settings', {})
        
        # If there's a Google Font URL, download it locally
        if settings.get('googleFontUrl'):
            google_font_url = settings['googleFontUrl']
            local_font_url = font_manager.get_local_font_url(google_font_url)
            
            if local_font_url:
                # Replace the Google Font URL with the local URL
                settings['googleFontUrl'] = local_font_url
                logger.debug(f"Replaced Google Font URL with local URL: {local_font_url}")
        
        timer.update_settings(settings)
        data['settings'] = settings
    elif action == 'start':
        timer.start()
    elif action == 'stop':
        timer.stop()
    elif action == 'reset':
        minutes = data.get('minutes', 3)
        seconds = data.get('seconds', 0)
        timer.reset(minutes, seconds)
    
    # Add timer_id to response for multi-timer mode
    if timer_manager.get_mode() == 'multi':
        data['timer_id'] = timer.timer_id
    
    # Broadcast to appropriate namespace
    broadcast_timer_update(data, timer.timer_id)
    
    # Also notify control panels about the timer state change
    broadcast_to_control_panels('timer_state_changed', {
        'timer_id': timer.timer_id,
        'action': action,
        'state': timer.to_dict()
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection to default namespace (single-timer mode and control panel)."""
    logger.debug("Client connected to default namespace")
    emit('connection_response', {
        'status': 'connected',
        'mode': timer_manager.get_mode(),
        'namespace': 'default'
    })
    
    # Initial synchronization for newly joined client (single mode)
    if timer_manager.get_mode() == 'single':
        timer = timer_manager.get_timer(1)
        if timer and timer.is_running:
            time_left = timer.get_current_time_left()
            minutes = time_left // 60
            seconds = time_left % 60
            
            logger.debug(f"Sending initial sync to new single-mode client: {minutes}:{seconds}")
            
            emit('timer_update', {
                'action': 'reset',
                'minutes': minutes,
                'seconds': seconds,
                'timer_id': 1,
                'is_initial_sync': True
            })
            emit('timer_update', {
                'action': 'start',
                'timer_id': 1
            })

@socketio.on('request_current_settings')
def handle_settings_request(data=None):
    """Handle request for current settings (single-timer mode and control panel)."""
    logger.debug("Client requested current settings on default namespace")
    
    timer_id = data.get('timer_id') if data else None
    timer = timer_manager.get_timer(timer_id)
    
    if timer:
        response = {
            'status': 'success',
            'timer_id': timer.timer_id,
            'settings': timer.settings,
            'state': timer.to_dict()
        }
    else:
        response = {'status': 'error', 'message': 'Timer not found'}
    
    emit('settings_response', response)

@socketio.on('request_timer_status')
def handle_timer_status_request(data=None):
    """Handle request for timer status (single-timer mode and control panel)."""
    logger.debug("Client requested timer status on default namespace")
    
    timer_id = data.get('timer_id') if data else None
    
    if timer_id:
        timer = timer_manager.get_timer(timer_id)
        if timer:
            emit('timer_status', timer.to_dict())
        else:
            emit('error', {'message': f'Timer {timer_id} not found'})
    else:
        # Return all timers status (useful for control panel)
        timers = timer_manager.get_all_timers()
        timer_data = {tid: timer.to_dict() for tid, timer in timers.items()}
        emit('timers_status', {
            'mode': timer_manager.get_mode(),
            'timers': timer_data
        })

@socketio.on('control_panel_timer_select')
def handle_control_panel_timer_select(data):
    """Handle timer selection from control panel."""
    logger.debug(f"Control panel timer selection: {data}")
    
    timer_id = data.get('timer_id')
    if not timer_id:
        emit('error', {'message': 'timer_id required for timer selection'})
        return
    
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        emit('error', {'message': f'Timer {timer_id} not found'})
        return
    
    # Send current timer state to control panel
    emit('timer_selected', {
        'timer_id': timer_id,
        'state': timer.to_dict(),
        'settings': timer.settings
    })

@socketio.on('control_panel_get_all_timers')
def handle_control_panel_get_all_timers(data=None):
    """Handle request for all timer statuses from control panel."""
    logger.debug("Control panel requested all timer statuses")
    
    timers = timer_manager.get_all_timers()
    timer_data = {tid: timer.to_dict() for tid, timer in timers.items()}
    
    emit('all_timers_status', {
        'mode': timer_manager.get_mode(),
        'timers': timer_data
    })

@socketio.on('timer_enabled_changed')
def handle_timer_enabled_changed(data):
    """Handle timer enable/disable from control panel."""
    logger.debug(f"Timer enabled state change: {data}")
    
    timer_id = data.get('timer_id')
    enabled = data.get('enabled', True)
    
    if not timer_id:
        emit('timer_enabled_response', {
            'status': 'error',
            'message': 'timer_id required'
        })
        return
    
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        emit('timer_enabled_response', {
            'status': 'error',
            'timer_id': timer_id,
            'message': f'Timer {timer_id} not found'
        })
        return
    
    # Update timer enabled state
    timer.set_enabled(enabled)
    
    # Send success response
    emit('timer_enabled_response', {
        'status': 'success',
        'timer_id': timer_id,
        'enabled': enabled
    })
    
    # Broadcast state change to all control panels
    broadcast_to_control_panels('timer_state_changed', {
        'timer_id': timer_id,
        'action': 'enabled_changed',
        'state': timer.to_dict()
    })

@socketio.on('request_multi_timer_status')
def handle_request_multi_timer_status(data=None):
    """Handle request for multi-timer status from control panel."""
    logger.debug("Control panel requested multi-timer status")
    
    if timer_manager.get_mode() != 'multi':
        emit('multi_timer_status', {
            'status': 'error',
            'message': 'Not in multi-timer mode'
        })
        return
    
    timers = timer_manager.get_all_timers()
    timer_data = {tid: timer.to_dict() for tid, timer in timers.items()}
    
    emit('multi_timer_status', {
        'status': 'success',
        'mode': 'multi',
        'timers': timer_data
    })
    
    emit('all_timers_status', {
        'mode': timer_manager.get_mode(),
        'timers': timer_data
    })

@socketio.on('control_panel_timer_enable')
def handle_control_panel_timer_enable(data):
    """Handle timer enable/disable from control panel."""
    logger.debug(f"Control panel timer enable/disable: {data}")
    
    timer_id = data.get('timer_id')
    enabled = data.get('enabled', True)
    
    if not timer_id:
        emit('error', {'message': 'timer_id required for timer enable/disable'})
        return
    
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        emit('error', {'message': f'Timer {timer_id} not found'})
        return
    
    timer.enabled = enabled
    logger.debug(f"Timer {timer_id} {'enabled' if enabled else 'disabled'}")
    
    # Broadcast timer status update
    emit('timer_enabled_changed', {
        'timer_id': timer_id,
        'enabled': enabled,
        'state': timer.to_dict()
    }, broadcast=True)

@socketio.on('control_panel_broadcast_to_timer')
def handle_control_panel_broadcast_to_timer(data):
    """Handle control panel request to broadcast to specific timer."""
    logger.debug(f"Control panel broadcast to timer: {data}")
    
    timer_id = data.get('timer_id')
    message_data = data.get('data', {})
    
    if not timer_id:
        emit('error', {'message': 'timer_id required for timer broadcast'})
        return
    
    timer = timer_manager.get_timer(timer_id)
    if not timer:
        emit('error', {'message': f'Timer {timer_id} not found'})
        return
    
    # Add timer_id to message data
    message_data['timer_id'] = timer_id
    
    # Broadcast to specific timer namespace
    if timer_manager.get_mode() == 'multi':
        socketio.emit('control_panel_message', message_data, namespace=f'/timer{timer_id}')
    else:
        # In single-timer mode, broadcast to default namespace
        socketio.emit('control_panel_message', message_data)
    
    # Confirm broadcast to control panel
    emit('broadcast_confirmed', {
        'timer_id': timer_id,
        'message': 'Message broadcasted successfully'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from default namespace."""
    logger.debug("Client disconnected from default namespace")

def master_heartbeat_sync():
    """Background task to broadcast server's master clock to all clients to prevent drift."""
    while True:
        socketio.sleep(5) # Sync more frequently (every 5 seconds)
        try:
            timers = timer_manager.get_all_timers()
            for tid, timer in timers.items():
                if timer.is_running:
                    time_left = timer.get_current_time_left()
                    # Only sync if there is time remaining
                    if time_left > 0:
                        minutes = time_left // 60
                        seconds = time_left % 60
                        
                        data_reset = {
                            'action': 'reset',
                            'minutes': minutes,
                            'seconds': seconds,
                            'timer_id': tid,
                            'is_heartbeat': True
                        }
                        
                        data_start = {
                            'action': 'start',
                            'timer_id': tid,
                            'is_heartbeat': True
                        }
                        
                        # Use the helper to ensure reliable broadcasting
                        broadcast_timer_update(data_reset, tid)
                        broadcast_timer_update(data_start, tid)
            
            logger.debug("Master clock heartbeat completed")
        except Exception as e:
            logger.error(f"Error in master heartbeat: {e}")

# Start the synchronization heartbeat task
socketio.start_background_task(master_heartbeat_sync)
