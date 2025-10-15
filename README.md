# FightTimer

A professional-grade browser-based countdown timer for live streaming and production environments. Features a web UI for both display and control, real-time updates, and Bitfocus Companion API integration.

---

## Features
- **Single Timer Mode** and **Multi-Timer Mode** (up to 5 independent timers)
- Web-based timer display and control panel
- Real-time updates via websockets (Flask-SocketIO)
- REST API for remote control and Bitfocus Companion integration
- Customizable timer appearance (color, font, end message, etc.)
- Google Fonts integration with local caching for improved performance
- Support for font variants (weights and styles)
- Persistent settings that survive application restarts
- Independent settings and state for each timer in multi-timer mode
- Separate display URLs for each timer in multi-timer mode

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

## Timer Modes

FightTimer supports two modes of operation:

### Single Timer Mode
The traditional mode with one timer display and control panel. This is the simplest mode and maintains backward compatibility with existing setups.

**Access:** Navigate to [http://localhost:8765/](http://localhost:8765/) and select "Single Timer" mode.

**Features:**
- One timer display
- Simple control panel
- Perfect for basic timing needs
- Compatible with existing API integrations

### Multi-Timer Mode
Advanced mode supporting up to 5 independent timers simultaneously. Each timer operates independently with its own settings, state, and WebSocket namespace.

**Access:** Navigate to [http://localhost:8765/](http://localhost:8765/) and select "Multi-Timer" mode.

**Features:**
- Up to 5 separate timers (Timer 1 through Timer 5)
- Individual timer displays at `/timer/1`, `/timer/2`, `/timer/3`, `/timer/4`, `/timer/5`
- Independent settings per timer (colors, fonts, end messages)
- Enhanced control panel with timer selection dropdown
- Enable/disable individual timers
- Timer-specific WebSocket namespaces (`/timer/1` through `/timer/5`)

**Individual Timer URLs:**
- Timer 1: [http://localhost:8765/timer/1](http://localhost:8765/timer/1)
- Timer 2: [http://localhost:8765/timer/2](http://localhost:8765/timer/2)
- Timer 3: [http://localhost:8765/timer/3](http://localhost:8765/timer/3)
- Timer 4: [http://localhost:8765/timer/4](http://localhost:8765/timer/4)
- Timer 5: [http://localhost:8765/timer/5](http://localhost:8765/timer/5)

### Switching Modes
You can switch between modes at any time:
1. Navigate to [http://localhost:8765/mode-selection](http://localhost:8765/mode-selection)
2. Select your desired mode
3. Your preference is saved in your browser's localStorage

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

## API Documentation

The FightTimer application exposes REST API endpoints for remote control. This is primarily designed for integrations like Bitfocus Companion.

**Base URL:** `http://<your-server-address>:8765` (Default: `http://localhost:8765`)

**Important:** In Multi-Timer mode, most endpoints require a `timer_id` parameter to specify which timer to control. In Single Timer mode, the `timer_id` is optional and ignored if provided.

### Endpoint: `/api/mode`

Manages the timer mode (single or multi-timer).

#### Method: `GET`

-   **Description:** Get the current timer mode.
-   **Response Body (JSON):**
    ```json
    {
      "status": "success",
      "mode": "single" | "multi",
      "timer_count": 1
    }
    ```
-   **Example (`curl`):**
    ```bash
    curl http://localhost:8765/api/mode
    ```

#### Method: `POST`

-   **Description:** Switch between single and multi-timer modes.
-   **Request Headers:**
    -   `Content-Type: application/json`
-   **Request Body (JSON):**
    -   `mode` (string, required): Either `"single"` or `"multi"`
-   **Example (`curl`):**
    ```bash
    # Switch to multi-timer mode
    curl -X POST -H "Content-Type: application/json" -d '{"mode": "multi"}' http://localhost:8765/api/mode
    
    # Switch to single timer mode
    curl -X POST -H "Content-Type: application/json" -d '{"mode": "single"}' http://localhost:8765/api/mode
    ```
-   **Success Response:**
    ```json
    {
      "status": "success",
      "mode": "multi",
      "message": "Mode switched to multi"
    }
    ```

### Endpoint: `/api/timers/status`

Get the status of all timers.

#### Method: `GET`

-   **Description:** Returns the state of all active timers.
-   **Response Body (JSON):**
    ```json
    {
      "status": "success",
      "mode": "single" | "multi",
      "timers": {
        "1": {
          "timer_id": 1,
          "time_left": 180,
          "is_running": false,
          "enabled": true,
          "settings": {}
        }
      }
    }
    ```
-   **Example (`curl`):**
    ```bash
    curl http://localhost:8765/api/timers/status
    ```

### Endpoint: `/api/timer` and `/api/timer/<timer_id>`

This is the main endpoint for interacting with timers. In Multi-Timer mode, you can optionally specify a `timer_id` in the URL path or in the request body.

#### Method: `GET`

-   **Description:** Checks the status of the API and lists supported actions. When a `timer_id` is provided, returns that timer's state.
-   **Response Body (JSON) - Without timer_id:**
    ```json
    {
      "status": "success",
      "message": "Timer API endpoint is active",
      "mode": "single" | "multi",
      "supported_actions": ["start", "stop", "reset", "settings"]
    }
    ```
-   **Response Body (JSON) - With timer_id:**
    ```json
    {
      "status": "success",
      "timer": {
        "timer_id": 1,
        "time_left": 180,
        "is_running": false,
        "enabled": true,
        "settings": {}
      }
    }
    ```
-   **Example (`curl`):**
    ```bash
    # Get API status
    curl http://localhost:8765/api/timer
    
    # Get specific timer status (multi-timer mode)
    curl http://localhost:8765/api/timer/2
    ```

#### Method: `POST`

-   **Description:** Sends commands to control the timer or update its settings.
-   **Request Headers:**
    -   `Content-Type: application/json`
-   **Request Body (JSON):**
    -   `action` (string, required): The action to perform. Valid actions are:
        -   `"start"`: Starts or resumes the timer.
        -   `"stop"`: Pauses the timer.
        -   `"reset"`: Resets the timer.
        -   `"settings"`: Updates timer settings.
    -   `timer_id` (integer, optional in Single Timer mode, required in Multi-Timer mode): The timer ID (1-5) to control. Can also be specified in the URL path as `/api/timer/<timer_id>`.

-   **Actions Details:**

    -   **`"action": "start"`**
        -   **Description:** Starts the timer from a specified time or resumes it if paused.
        -   **Additional Body Parameters (optional):**
            -   `minutes` (integer): Initial minutes for the timer (e.g., `5`). Defaults to the last set time or 3 if never set.
            -   `seconds` (integer): Initial seconds for the timer (e.g., `30`). Defaults to the last set time or 0 if never set.
        -   **Example (`curl`):**
            ```bash
            # Single Timer Mode - Start/resume with default/previous time
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start"}' http://localhost:8765/api/timer

            # Single Timer Mode - Start a new timer for 2 minutes and 30 seconds
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start", "minutes": 2, "seconds": 30}' http://localhost:8765/api/timer
            
            # Multi-Timer Mode - Start timer 2 for 5 minutes (URL path method)
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start", "minutes": 5, "seconds": 0}' http://localhost:8765/api/timer/2
            
            # Multi-Timer Mode - Start timer 3 for 1 minute (request body method)
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start", "timer_id": 3, "minutes": 1, "seconds": 0}' http://localhost:8765/api/timer
            ```

    -   **`"action": "stop"`**
        -   **Description:** Pauses the currently running timer.
        -   **Example (`curl`):**
            ```bash
            # Single Timer Mode
            curl -X POST -H "Content-Type: application/json" -d '{"action": "stop"}' http://localhost:8765/api/timer
            
            # Multi-Timer Mode - Stop timer 4
            curl -X POST -H "Content-Type: application/json" -d '{"action": "stop"}' http://localhost:8765/api/timer/4
            ```

    -   **`"action": "reset"`**
        -   **Description:** Stops the timer and resets it to the initial time values (typically the last values used for a `start` action, or defaults to 3 minutes if no specific time has been set).
        -   **Example (`curl`):**
            ```bash
            # Single Timer Mode
            curl -X POST -H "Content-Type: application/json" -d '{"action": "reset"}' http://localhost:8765/api/timer
            
            # Multi-Timer Mode - Reset timer 1
            curl -X POST -H "Content-Type: application/json" -d '{"action": "reset", "timer_id": 1}' http://localhost:8765/api/timer
            ```

    -   **`"action": "settings"`**
        -   **Description:** Updates various appearance and behavior settings of the timer.
        -   **Additional Body Parameters (required):**
            -   `settings` (object): An object containing one or more settings to update.
                -   `textColor` (string, optional): Timer text color (hex format, e.g., `"#FFFFFF"`).
                -   `backgroundColor` (string, optional): Timer background color (hex format, e.g., `"#000000"`).
                -   `fontFamily` (string, optional): Font family name (e.g., `"Arial"`, `"Roboto"`).
                -   `fontSize` (integer, optional): Font size in pixels (e.g., `100`).
                -   `fontVariant` (string, optional): Font weight and/or style (e.g., `"normal"`, `"bold"`, `"700 italic"`). Refer to CSS `font-style` and `font-weight` for common values.
                -   `endMessage` (string, optional): Text displayed when the timer reaches zero (e.g., `"TIME'S UP!"`).
                -   `googleFontUrl` (string, optional): URL to a Google Fonts stylesheet (e.g., `"https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap"`). The server will attempt to download and cache this font for offline use. If a new `googleFontUrl` is provided, it replaces any previous one.
        -   **Example (`curl`):**
            ```bash
            # Single Timer Mode - Update text color to red and font size to 120px
            curl -X POST -H "Content-Type: application/json" \
                 -d '{"action": "settings", "settings": {"textColor": "#FF0000", "fontSize": 120}}' \
                 http://localhost:8765/api/timer

            # Single Timer Mode - Change the end message and set a Google Font
            curl -X POST -H "Content-Type: application/json" \
                 -d '{"action": "settings", "settings": {"endMessage": "Round Over", "googleFontUrl": "https://fonts.googleapis.com/css2?family=Lato&display=swap"}}' \
                 http://localhost:8765/api/timer
            
            # Multi-Timer Mode - Update timer 5 background color to blue
            curl -X POST -H "Content-Type: application/json" \
                 -d '{"action": "settings", "settings": {"backgroundColor": "#0000FF"}}' \
                 http://localhost:8765/api/timer/5
            ```
-   **Success Response (for all POST actions):**
    ```json
    {
      "status": "success",
      "timer_id": 1  // Included in multi-timer mode
    }
    ```
-   **Error Responses (for all POST actions):**
    -   If no JSON data provided (Status Code: 400):
        ```json
        { "error": "No data provided" } 
        ```
    -   If `action` is invalid (Status Code: 400):
        ```json
        { "error": "Invalid action" }
        ```

## WebSocket API for Real-time Updates

For applications requiring real-time synchronization with the timer (like a custom hardware display), FightTimer provides a WebSocket interface powered by Flask-SocketIO.

**WebSocket URL:** `ws://<your-server-address>:8765/socket.io/` (Default: `ws://localhost:8765/socket.io/`)

(Note: The exact URL might vary slightly depending on the Socket.IO client library used. Most libraries handle the `/socket.io/` path automatically when given the base URL like `ws://localhost:8765`.)

### WebSocket Namespaces

The WebSocket connection varies depending on the timer mode:

#### Single Timer Mode
- **Default Namespace:** `ws://localhost:8765/socket.io/`
- All timer updates are broadcast on the default namespace
- Backward compatible with existing integrations

#### Multi-Timer Mode
- **Default Namespace:** `ws://localhost:8765/socket.io/` (for control panel and management)
- **Timer-Specific Namespaces:**
  - Timer 1: `ws://localhost:8765/timer/1`
  - Timer 2: `ws://localhost:8765/timer/2`
  - Timer 3: `ws://localhost:8765/timer/3`
  - Timer 4: `ws://localhost:8765/timer/4`
  - Timer 5: `ws://localhost:8765/timer/5`

Each timer display in multi-timer mode connects to its own dedicated namespace, ensuring that updates are isolated to the specific timer.

### Connecting

1.  Establish a WebSocket connection to the server (or to a specific timer namespace in multi-timer mode).
2.  Upon successful connection, the server emits a `connection_response` event.

### Key Server-Sent Events

Listen for the following events from the server:

1.  **`connection_response`**
    -   **Description:** Confirms a successful WebSocket connection.
    -   **Data (Single Timer Mode):**
        ```json
        { 
          "status": "connected",
          "mode": "single",
          "namespace": "default"
        }
        ```
    -   **Data (Multi-Timer Mode - Timer Namespace):**
        ```json
        { 
          "status": "connected",
          "timer_id": 2,
          "namespace": "/timer/2"
        }
        ```

2.  **`timer_update`**
    -   **Description:** This is the primary event for receiving timer state changes. It's emitted whenever the timer is started, stopped, reset, or its settings are updated (either via the control panel or the REST API).
    -   **Data (JSON object):** The structure of the data object depends on the action that triggered the update.

        -   **For `start`, `stop`, `reset` actions:**
            ```json
            {
              "action": "start" | "stop" | "reset",
              "minutes": 5, // Current minutes value
              "seconds": 30, // Current seconds value
              "timer_id": 1  // Included in multi-timer mode
            }
            ```
            *Note: When the timer is running, the client-side JavaScript in the official display page handles the per-second countdown. This `timer_update` event for `start` provides the initial time. For a hardware timer, you'll need to implement your own countdown logic based on the `minutes` and `seconds` received when `action` is `start`, and stop/pause when `action` is `stop` or `reset`.

        -   **For `settings` action:**
            ```json
            {
              "action": "settings",
              "timer_id": 1,  // Included in multi-timer mode
              "settings": {
                "textColor": "#FFFFFF",
                "backgroundColor": "#000000",
                "fontFamily": "Arial",
                "fontSize": 100,
                "fontVariant": "normal",
                "endMessage": "TIME'S UP!",
                "googleFontUrl": "https://fonts.googleapis.com/css2?family=Roboto&display=swap" // This will be the local URL if caching was successful
              }
            }
            ```
            *Note: Not all settings fields will be present if only a partial update was made. The `settings` object will contain only the fields that were changed.*

3.  **`settings_response`**
    -   **Description:** Sent by the server in response to a `request_current_settings` event from the client. Returns the current settings and state of the timer.
    -   **Data:**
        ```json
        {
          "status": "success",
          "timer_id": 1,
          "settings": {
            "textColor": "#000000",
            "backgroundColor": "#00ff00",
            "fontFamily": "DSEG14 Modern",
            "fontSize": 100
          },
          "state": {
            "timer_id": 1,
            "time_left": 180,
            "is_running": false,
            "enabled": true,
            "settings": {}
          }
        }
        ```

### Client-Sent Events (Optional)

While primarily for listening, a client *can* send events. Common events include:

1.  **`request_current_settings`**
    -   **Description:** A client can emit this event to ask the server for the current settings. The server will respond with a `settings_response` (see above).
    -   **Data (optional):**
        ```json
        { "timer_id": 1 }  // Required in multi-timer mode
        ```
    -   **Example (conceptual JavaScript):**
        ```javascript
        // Single Timer Mode
        socket.emit('request_current_settings');
        
        // Multi-Timer Mode
        socket.emit('request_current_settings', { timer_id: 2 });
        ```

2.  **`request_timer_status`**
    -   **Description:** Request the current status of a timer (or all timers).
    -   **Data (optional):**
        ```json
        { "timer_id": 1 }  // Omit to get all timers in multi-timer mode
        ```
    -   **Response Event:** `timer_status` or `timers_status`

3.  **`timer_control`**
    -   **Description:** Control the timer directly via WebSocket (alternative to REST API).
    -   **Data:**
        ```json
        {
          "action": "start" | "stop" | "reset" | "settings",
          "timer_id": 1,  // Required in multi-timer mode
          "minutes": 3,   // For start/reset actions
          "seconds": 0,   // For start/reset actions
          "settings": {}  // For settings action
        }
        ```

### Example Workflow for a Hardware Timer Client:

#### Single Timer Mode:
1.  Connect to the WebSocket server at `ws://localhost:8765/socket.io/`.
2.  On receiving `connection_response`, confirm connection.
3.  Listen for `timer_update` events:
    -   If `data.action` is `"start"`: Get `data.minutes` and `data.seconds`. Start your hardware countdown from this time.
    -   If `data.action` is `"stop"` or `"reset"`: Pause or stop your hardware countdown.
    -   If `data.action` is `"settings"`: Update any relevant display properties on your hardware.
4.  (Optional) On connect, emit `request_current_settings` to get the current timer state.

#### Multi-Timer Mode (connecting to a specific timer):
1.  Connect to the specific timer's namespace, e.g., `ws://localhost:8765/timer/2` for Timer 2.
2.  On receiving `connection_response`, confirm connection and note the `timer_id`.
3.  Listen for `timer_update` events on this namespace - they will only contain updates for this specific timer.
4.  All actions (start, stop, reset, settings) received on this namespace are specific to this timer.
5.  (Optional) Use `request_current_settings` with the timer_id to get initial state.

#### Multi-Timer Mode (control panel connecting to all timers):
1.  Connect to the default namespace `ws://localhost:8765/socket.io/`.
2.  Use `request_timer_status` without a timer_id to get status of all timers.
3.  Send `timer_control` events with specific `timer_id` values to control individual timers.
4.  Listen for `timer_state_changed` events to be notified when any timer's state changes.

This WebSocket interface allows for tight synchronization between the FightTimer application and any external displays or controllers.

## Bitfocus Companion Integration

FightTimer can be easily controlled using Bitfocus Companion, allowing you to trigger timer actions from a Stream Deck or other control surfaces. Both Single Timer and Multi-Timer modes are fully supported.

Companion communicates with FightTimer using its REST API. You'll typically use the "Generic HTTP Request" action in Companion (often found as "HTTP POST" or similar, depending on the Companion module version).

**Target URL (Single Timer Mode):** `http://<IP_ADDRESS_OF_FIGHTTIMER_SERVER>:8765/api/timer`

**Target URL (Multi-Timer Mode):** `http://<IP_ADDRESS_OF_FIGHTTIMER_SERVER>:8765/api/timer/<TIMER_ID>`
(Where `<TIMER_ID>` is a number from 1 to 5)

(Replace `<IP_ADDRESS_OF_FIGHTTIMER_SERVER>` with the actual IP address or hostname where FightTimer is running. If Companion is on the same machine, you can use `http://localhost:8765/api/timer`.)

**Content-Type:** `application/json` (This should be set for all POST requests in Companion, usually in the request headers option.)

### API Usage Notes for Companion:
-   The API is primarily for *sending commands*. To see the current timer status (time remaining, colors, etc.), you should have the FightTimer display page open on a screen visible to the operator, or use the control panel.
-   **Single Timer Mode:** Use `http://localhost:8765/` for the display and `http://localhost:8765/control` for the control panel.
-   **Multi-Timer Mode:** Use `http://localhost:8765/timer/1` through `http://localhost:8765/timer/5` for individual timer displays, and `http://localhost:8765/control` for the control panel (which can manage all timers).
-   For a full list of API actions and parameters, please refer to the [API Documentation](#api-documentation) section above.

### Common Companion Button Examples:

#### Single Timer Mode Examples:

1.  **Start 3-Minute Timer:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "start", "minutes": 3, "seconds": 0}`

2.  **Start 30-Second Warning Timer:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "start", "minutes": 0, "seconds": 30}`

3.  **Pause/Stop Timer:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "stop"}`

4.  **Reset Timer:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "reset"}`

5.  **Change Colors (e.g., to Red Text on Black Background):**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "settings", "settings": {"textColor": "#FF0000", "backgroundColor": "#000000"}}`

6.  **Change End Message:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "settings", "settings": {"endMessage": "NEXT ROUND"}}`

#### Multi-Timer Mode Examples:

7.  **Start Timer 2 for 5 Minutes:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer/2`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "start", "minutes": 5, "seconds": 0}`

8.  **Stop Timer 3:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer/3`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "stop"}`

9.  **Reset Timer 1:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer/1`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "reset"}`

10. **Set Timer 4 Background to Green:**
    -   **Action Type:** Generic HTTP Request
    -   **Method:** POST
    -   **URL:** `http://localhost:8765/api/timer/4`
    -   **Headers:** `Content-Type: application/json`
    -   **JSON Body:** `{"action": "settings", "settings": {"backgroundColor": "#00FF00"}}`

11. **Start All Timers Simultaneously (requires multiple buttons):**
    -   Create separate buttons for each timer (Timer 1-5)
    -   Each button uses URL: `http://localhost:8765/api/timer/X` (where X is 1-5)
    -   Each button has JSON Body: `{"action": "start", "minutes": 3, "seconds": 0}`

Remember to adjust the IP address in the URL if FightTimer is running on a different machine than Companion.

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