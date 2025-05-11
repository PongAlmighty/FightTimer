# FightTimer

A professional-grade browser-based countdown timer for live streaming and production environments. Features a web UI for both display and control, real-time updates, and Bitfocus Companion API integration.

---

## Features
- Web-based timer display and control panel
- Real-time updates via websockets (Flask-SocketIO)
- REST API for remote control and Bitfocus Companion integration
- Customizable timer appearance (color, font, end message, etc.)
- Google Fonts integration with local caching for improved performance
- Support for font variants (weights and styles)
- Persistent settings that survive application restarts

---

## Setup

### 1. Clone the Repository
```sh
git clone https://github.com/PongAlmighty/FightTimer.git
cd FightTimer
```

### 2. Install Dependencies
This project uses Python 3.11+ and dependencies from `pyproject.toml`.
```sh
pip install -r requirements.txt  # If requirements.txt exists
# Or, if not:
pip install flask flask-socketio eventlet
```

### 3. Run the Server (Development)
```sh
python main.py
```
- The server will start on port 8765 by default. Access the timer at: [http://localhost:8765/](http://localhost:8765/)
- Control panel: [http://localhost:8765/control](http://localhost:8765/control)

---

## Running as a Service on macOS

To run FightTimer as a background service (using launchd):

1. Create a launch agent plist at `~/Library/LaunchAgents/com.fighttimer.app.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.fighttimer.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/Users/YOURUSER/Documents/PythonCode/FightTimer/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOURUSER/Documents/PythonCode/FightTimer</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/fighttimer.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/fighttimer.err</string>
</dict>
</plist>
```
Replace `YOURUSER` with your macOS username and adjust paths if needed.

2. Load and start the service:
```sh
launchctl load ~/Library/LaunchAgents/com.fighttimer.app.plist
launchctl start com.fighttimer.app
```

---

## Bitfocus Companion API Integration

The FightTimer API can be controlled remotely via HTTP POST requests. This makes it perfect for integration with Bitfocus Companion or other automation tools.

### API Examples

#### Status Check
```sh
# Get current timer state and settings
curl http://localhost:8765/api/timer
```
Response:
```json
{
  "running": false,
  "minutes": 3,
  "seconds": 0,
  "settings": {
    "textColor": "#000000",
    "backgroundColor": "#00ff00",
    "fontFamily": "Arial",
    "fontSize": 100,
    "fontVariant": "normal",
    "endMessage": "TIME"
  }
}
```

#### Start Timer
```sh
# Start with default time (from last settings)
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Start with specific time
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "minutes": 3, "seconds": 0}'

# Start with 30 seconds
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "minutes": 0, "seconds": 30}'
```

#### Stop Timer
```sh
# Pause the timer (can be resumed with start)
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

#### Reset Timer
```sh
# Reset to initial time values
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "reset"}'
```

#### Update Settings (Colors, Message, etc.)
```sh
# Update all settings at once
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "settings", "settings": {"textColor": "#000000", "backgroundColor": "#00ff00", "fontFamily": "Arial", "fontSize": 100, "fontVariant": "normal", "endMessage": "TIME"}}'

# Update only text color to red
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "settings", "settings": {"textColor": "#FF0000"}}'

# Update font size and end message
curl -X POST http://localhost:8765/api/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "settings", "settings": {"fontSize": 150, "endMessage": "FIGHT!"}}'
```

#### Supported Actions
- `start`: Start the timer (optionally specify `minutes` and `seconds`)
- `stop`: Stop/pause the timer
- `reset`: Reset the timer to initial value
- `settings`: Update timer appearance/settings
  - `textColor`: Color for the timer text (hex format)
  - `backgroundColor`: Background color (hex format)
  - `fontFamily`: Font family name
  - `fontSize`: Font size (numeric value)
  - `fontVariant`: Font weight/style variant (e.g., "normal", "bold", etc.)
  - `endMessage`: Text to display when timer reaches zero

### Bitfocus Companion Integration Tips

#### Button Setup Examples

1. **Start 3-Minute Timer Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "start", "minutes": 3, "seconds": 0}`
   - Content-Type: `application/json`

2. **Start 30-Second Timer Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "start", "minutes": 0, "seconds": 30}`
   - Content-Type: `application/json`

3. **Pause/Stop Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "stop"}`
   - Content-Type: `application/json`

4. **Reset Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "reset"}`
   - Content-Type: `application/json`

5. **Change to Red Text Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "settings", "settings": {"textColor": "#FF0000"}}`
   - Content-Type: `application/json`

6. **Change to Green Text Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "settings", "settings": {"textColor": "#00FF00"}}`
   - Content-Type: `application/json`

7. **Change End Message Button**:
   - Type: HTTP POST
   - URL: `http://localhost:8765/api/timer`
   - Body: `{"action": "settings", "settings": {"endMessage": "FIGHT!"}}`
   - Content-Type: `application/json`

---

## Customization
- Edit `templates/control.html` and `static/js/timer.js` for advanced UI/logic customizations.
- All timer changes are broadcast live to all connected clients.

### Google Fonts Integration

FightTimer supports adding and using Google Fonts with automatic variant detection:

1. **Adding a Google Font**:
   - Go to the control panel at [http://localhost:8765/control](http://localhost:8765/control)
   - In the Customization section, find the "Google Font URL" input field
   - Paste a Google Fonts URL (e.g., `https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap`)
   - Click "Add Font"
   - The font family name will be automatically detected

2. **Using Google Fonts**:
   - Once added, the font will appear in the "Font Family" dropdown
   - Select the font from the dropdown
   - Available font variants (weights and styles) will automatically populate the "Font Variant" dropdown
   - Select a variant to apply it to the timer

3. **Supported Font URL Formats**:
   - Standard format: `https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap`
   - Variable font ranges: `https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap`
   - Multiple styles: `https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap`

4. **Performance Optimization**:
   - Added fonts are downloaded and cached locally
   - Subsequent uses of the font load from local storage rather than from Google
   - This significantly improves loading performance

5. **Settings Persistence**:
   - All font choices, variants, and other settings are automatically saved in your browser's localStorage
   - Your settings will persist even after closing the browser or restarting the server
   - This means you only need to set up your preferred fonts and appearance once

---

## License
See LICENSE file.