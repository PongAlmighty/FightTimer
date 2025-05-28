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

## API Documentation

The FightTimer application exposes a REST API endpoint for remote control. This is primarily designed for integrations like Bitfocus Companion.

**Base URL:** `http://<your-server-address>:8765` (Default: `http://localhost:8765`)

### Endpoint: `/api/timer`

This is the main endpoint for interacting with the timer.

#### Method: `GET`

-   **Description:** Checks the status of the API and lists supported actions. Note: This endpoint does *not* return the current timer's detailed state (e.g., time remaining, current settings). Timer state updates are broadcast via WebSockets.
-   **Response Body (JSON):**
    ```json
    {
      "status": "success",
      "message": "Timer API endpoint is active",
      "supported_actions": ["start", "stop", "reset", "settings"]
    }
    ```
-   **Example (`curl`):**
    ```bash
    curl http://localhost:8765/api/timer
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

-   **Actions Details:**

    -   **`"action": "start"`**
        -   **Description:** Starts the timer from a specified time or resumes it if paused.
        -   **Additional Body Parameters (optional):**
            -   `minutes` (integer): Initial minutes for the timer (e.g., `5`). Defaults to the last set time or 3 if never set.
            -   `seconds` (integer): Initial seconds for the timer (e.g., `30`). Defaults to the last set time or 0 if never set.
        -   **Example (`curl`):**
            ```bash
            # Start/resume with default/previous time
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start"}' http://localhost:8765/api/timer

            # Start a new timer for 2 minutes and 30 seconds
            curl -X POST -H "Content-Type: application/json" -d '{"action": "start", "minutes": 2, "seconds": 30}' http://localhost:8765/api/timer
            ```

    -   **`"action": "stop"`**
        -   **Description:** Pauses the currently running timer.
        -   **Example (`curl`):**
            ```bash
            curl -X POST -H "Content-Type: application/json" -d '{"action": "stop"}' http://localhost:8765/api/timer
            ```

    -   **`"action": "reset"`**
        -   **Description:** Stops the timer and resets it to the initial time values (typically the last values used for a `start` action, or defaults to 3 minutes if no specific time has been set).
        -   **Example (`curl`):**
            ```bash
            curl -X POST -H "Content-Type: application/json" -d '{"action": "reset"}' http://localhost:8765/api/timer
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
            # Update text color to red and font size to 120px
            curl -X POST -H "Content-Type: application/json" \
                 -d '{"action": "settings", "settings": {"textColor": "#FF0000", "fontSize": 120}}' \
                 http://localhost:8765/api/timer

            # Change the end message and set a Google Font
            curl -X POST -H "Content-Type: application/json" \
                 -d '{"action": "settings", "settings": {"endMessage": "Round Over", "googleFontUrl": "https://fonts.googleapis.com/css2?family=Lato&display=swap"}}' \
                 http://localhost:8765/api/timer
            ```
-   **Success Response (for all POST actions):**
    ```json
    {
      "status": "success"
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

### Connecting

1.  Establish a WebSocket connection to the server.
2.  Upon successful connection, the server emits a `connection_response` event.

### Key Server-Sent Events

Listen for the following events from the server:

1.  **`connection_response`**
    -   **Description:** Confirms a successful WebSocket connection.
    -   **Data:**
        ```json
        { "status": "connected" }
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
              // Other potential fields related to the timer's internal state might be present
            }
            ```
            *Note: When the timer is running, the client-side JavaScript in the official display page handles the per-second countdown. This `timer_update` event for `start` provides the initial time. For a hardware timer, you'll need to implement your own countdown logic based on the `minutes` and `seconds` received when `action` is `start`, and stop/pause when `action` is `stop` or `reset`.

        -   **For `settings` action:**
            ```json
            {
              "action": "settings",
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
    -   **Description:** Sent by the server in response to a `request_current_settings` event from the client. Currently, this just acknowledges the request.
    -   **Data:**
        ```json
        { "status": "acknowledged" }
        ```
        *Note: As of the current implementation, this event does not return the actual settings data. To get the full settings, a client typically listens for `timer_update` events with `action: "settings"`.*

### Client-Sent Events (Optional)

While primarily for listening, a client *can* send events. The main one a custom client might consider is:

1.  **`request_current_settings`**
    -   **Description:** A client can emit this event to ask the server for the current settings. The server will respond with a `settings_response` (see above).
    -   **Data:** No data payload is typically required for this event.
    -   **Example (conceptual JavaScript):** `socket.emit('request_current_settings');`

### Example Workflow for a Hardware Timer Client:

1.  Connect to the WebSocket server.
2.  On receiving `connection_response`, confirm connection.
3.  Listen for `timer_update` events:
    -   If `data.action` is `"start"`: Get `data.minutes` and `data.seconds`. Start your hardware countdown from this time.
    -   If `data.action` is `"stop"` or `"reset"`: Pause or stop your hardware countdown.
    -   If `data.action` is `"settings"`: Update any relevant display properties on your hardware (e.g., if your hardware can change colors based on `data.settings.textColor` or `data.settings.backgroundColor`).
4.  (Optional) On connect, you might emit `request_current_settings` to trigger an initial settings update, though the server currently only acknowledges this. The first `timer_update` with an action of `settings` or `start` will provide initial state.

This WebSocket interface allows for tight synchronization between the FightTimer application and any external displays or controllers.

## Bitfocus Companion Integration

FightTimer can be easily controlled using Bitfocus Companion, allowing you to trigger timer actions from a Stream Deck or other control surfaces.

Companion communicates with FightTimer using its REST API. You'll typically use the "Generic HTTP Request" action in Companion (often found as "HTTP POST" or similar, depending on the Companion module version).

**Target URL:** `http://<IP_ADDRESS_OF_FIGHTTIMER_SERVER>:8765/api/timer`
(Replace `<IP_ADDRESS_OF_FIGHTTIMER_SERVER>` with the actual IP address or hostname where FightTimer is running. If Companion is on the same machine, you can use `http://localhost:8765/api/timer`.)

**Content-Type:** `application/json` (This should be set for all POST requests in Companion, usually in the request headers option.)

### API Usage Notes for Companion:
-   The API is primarily for *sending commands*. To see the current timer status (time remaining, colors, etc.), you should have the FightTimer display page (`http://<IP_ADDRESS_OF_FIGHTTIMER_SERVER>:8765/`) open on a screen visible to the operator, or use the control panel (`http://<IP_ADDRESS_OF_FIGHTTIMER_SERVER>:8765/control`).
-   For a full list of API actions and parameters, please refer to the [API Documentation](#api-documentation) section above.

### Common Companion Button Examples:

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