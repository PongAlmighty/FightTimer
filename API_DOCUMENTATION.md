# FightTimer API Documentation

## Overview

FightTimer provides multiple interfaces for controlling countdown timers, including REST API endpoints, WebSocket connections, and web interfaces. The application supports both **Single Timer Mode** and **Multi-Timer Mode** (up to 5 independent timers).

---

## Table of Contents

1. [Modes](#modes)
2. [Web Interfaces](#web-interfaces)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Communication](#websocket-communication)
5. [Timer Control Actions](#timer-control-actions)
6. [Settings Configuration](#settings-configuration)
7. [Integration Examples](#integration-examples)

---

## Modes

### Single Timer Mode
- **Description**: Simple mode with one countdown timer
- **Use Case**: Basic timing needs, backward compatible with existing setups
- **WebSocket Namespace**: `/` (default)
- **API Endpoint**: `/api/timer`

### Multi-Timer Mode
- **Description**: Advanced mode supporting up to 5 independent timers
- **Use Case**: Multiple simultaneous countdowns with separate displays and settings
- **WebSocket Namespaces**: `/timer1`, `/timer2`, `/timer3`, `/timer4`, `/timer5`
- **API Endpoints**: `/api/timer/1`, `/api/timer/2`, `/api/timer/3`, `/api/timer/4`, `/api/timer/5`

### Switching Modes

**Endpoint**: `POST /api/mode`

**Request Body**:
```json
{
  "mode": "single"
}
```
or
```json
{
  "mode": "multi"
}
```

**Response**:
```json
{
  "status": "success",
  "mode": "multi",
  "message": "Mode switched to multi"
}
```

**Check Current Mode**: `GET /api/mode`

**Response**:
```json
{
  "status": "success",
  "mode": "single",
  "timer_count": 1
}
```

---

## Web Interfaces

### Mode Selection Page
- **URL**: `http://<server-ip>:<port>/` or `http://<server-ip>:<port>/mode-selection`
- **Purpose**: Choose between Single Timer and Multi-Timer modes
- **Default Port**: 55011

### Control Panel (Admin Interface)
- **URL**: `http://<server-ip>:<port>/control`
- **Purpose**: Control timer(s), adjust settings, customize appearance
- **Features**:
  - Start/Stop/Reset controls
  - Time input (minutes/seconds)
  - Color customization (text/background)
  - Font selection and sizing
  - Google Fonts integration
  - End message configuration
  - Mode switching
  - Multi-timer selection (in multi-timer mode)

### Timer Display Pages

#### Single Timer Mode
- **URL**: `http://<server-ip>:<port>/timer`
- **Purpose**: Full-screen timer display for OBS/streaming
- **Features**: Real-time countdown, customizable appearance

#### Multi-Timer Mode
- **URLs**:
  - Timer 1: `http://<server-ip>:<port>/timer/1`
  - Timer 2: `http://<server-ip>:<port>/timer/2`
  - Timer 3: `http://<server-ip>:<port>/timer/3`
  - Timer 4: `http://<server-ip>:<port>/timer/4`
  - Timer 5: `http://<server-ip>:<port>/timer/5`
- **Purpose**: Individual full-screen displays for each timer
- **Features**: Independent settings and state per timer

---

## REST API Endpoints

### Base URL
```
http://<server-ip>:<port>
```
Default port: **55011**

### 1. Timer Status (GET)

#### Single Timer Mode
**Endpoint**: `GET /api/timer`

**Response**:
```json
{
  "status": "success",
  "message": "Timer API endpoint is active",
  "mode": "single",
  "supported_actions": ["start", "stop", "reset", "settings"]
}
```

#### Multi-Timer Mode
**Endpoint**: `GET /api/timer/<timer_id>`

Example: `GET /api/timer/1`

**Response**:
```json
{
  "status": "success",
  "timer": {
    "timer_id": 1,
    "time_left": 180,
    "is_running": false,
    "settings": {
      "textColor": "#000000",
      "backgroundColor": "#00ff00",
      "fontFamily": "Arial",
      "fontSize": 100,
      "endMessage": "TIME"
    },
    "enabled": true
  }
}
```

### 2. Timer Control (POST)

#### Single Timer Mode
**Endpoint**: `POST /api/timer`

**Request Body** (Start):
```json
{
  "action": "start"
}
```

**Request Body** (Stop):
```json
{
  "action": "stop"
}
```

**Request Body** (Reset):
```json
{
  "action": "reset",
  "minutes": 5,
  "seconds": 30
}
```

**Request Body** (Update Settings):
```json
{
  "action": "settings",
  "settings": {
    "textColor": "#FFFFFF",
    "backgroundColor": "#000000",
    "fontFamily": "Arial",
    "fontSize": 120,
    "endMessage": "DONE"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "timer_id": 1
}
```

#### Multi-Timer Mode
**Endpoint**: `POST /api/timer/<timer_id>`

Example: `POST /api/timer/3`

**Request Body** (same format as single timer mode):
```json
{
  "action": "start"
}
```

**Response**:
```json
{
  "status": "success",
  "timer_id": 3
}
```

**Alternative**: Include `timer_id` in request body:
```json
{
  "action": "start",
  "timer_id": 3
}
```

### 3. All Timers Status

**Endpoint**: `GET /api/timers/status`

**Response**:
```json
{
  "status": "success",
  "mode": "multi",
  "timers": {
    "1": {
      "timer_id": 1,
      "time_left": 180,
      "is_running": false,
      "settings": {...},
      "enabled": true
    },
    "2": {
      "timer_id": 2,
      "time_left": 300,
      "is_running": true,
      "settings": {...},
      "enabled": true
    }
  }
}
```

### 4. Font Management

**Download Google Font**: `POST /fonts/download`

**Request Body**:
```json
{
  "url": "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
}
```

**Response**:
```json
{
  "success": true,
  "localUrl": "/static/fonts/google/roboto.css"
}
```

**Check Font Status**: `GET /fonts/status`

**Response**:
```json
{
  "status": "success",
  "fonts_count": 5,
  "fonts": ["roboto.css", "opensans.css", "..."]
}
```

---

## WebSocket Communication

### Connection

#### Single Timer Mode
```javascript
const socket = io('http://<server-ip>:<port>');
```

#### Multi-Timer Mode
```javascript
// Connect to specific timer namespace
const socket = io('http://<server-ip>:<port>/timer1');
```

### Events to Emit (Client → Server)

#### 1. Timer Control
**Event**: `timer_control`

**Single Timer Mode**:
```javascript
socket.emit('timer_control', {
  action: 'start'
});
```

**Multi-Timer Mode**:
```javascript
socket.emit('timer_control', {
  action: 'start',
  timer_id: 1
});
```

**Actions**:
- `start`: Start the timer
- `stop`: Stop the timer
- `reset`: Reset timer to specified time
  ```javascript
  socket.emit('timer_control', {
    action: 'reset',
    minutes: 5,
    seconds: 0,
    timer_id: 1  // Only in multi-timer mode
  });
  ```
- `settings`: Update timer appearance
  ```javascript
  socket.emit('timer_control', {
    action: 'settings',
    settings: {
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      fontFamily: 'Arial',
      fontSize: 100,
      endMessage: 'TIME'
    },
    timer_id: 1  // Only in multi-timer mode
  });
  ```

#### 2. Request Current Settings
**Event**: `request_current_settings`

```javascript
socket.emit('request_current_settings', {
  timer_id: 1  // Only in multi-timer mode
});
```

#### 3. Request Timer Status
**Event**: `request_timer_status`

```javascript
socket.emit('request_timer_status', {
  timer_id: 1  // Only in multi-timer mode
});
```

#### 4. Timer Enable/Disable (Multi-Timer Mode)
**Event**: `timer_enabled_changed`

```javascript
socket.emit('timer_enabled_changed', {
  timer_id: 2,
  enabled: false
});
```

### Events to Listen (Server → Client)

#### 1. Connection Response
**Event**: `connection_response`

```javascript
socket.on('connection_response', (data) => {
  console.log(data);
  // {
  //   status: 'connected',
  //   mode: 'multi',
  //   namespace: '/timer1',
  //   timer_id: 1
  // }
});
```

#### 2. Timer Update
**Event**: `timer_update`

```javascript
socket.on('timer_update', (data) => {
  console.log(data);
  // {
  //   action: 'start',
  //   timer_id: 1,
  //   settings: {...}
  // }
});
```

#### 3. Settings Response
**Event**: `settings_response`

```javascript
socket.on('settings_response', (data) => {
  console.log(data);
  // {
  //   status: 'success',
  //   timer_id: 1,
  //   settings: {
  //     textColor: '#000000',
  //     backgroundColor: '#00ff00',
  //     ...
  //   },
  //   state: {
  //     time_left: 180,
  //     is_running: false,
  //     ...
  //   }
  // }
});
```

#### 4. Timer Status
**Event**: `timer_status`

```javascript
socket.on('timer_status', (data) => {
  console.log(data);
  // {
  //   timer_id: 1,
  //   time_left: 180,
  //   is_running: false,
  //   settings: {...},
  //   enabled: true
  // }
});
```

#### 5. All Timers Status (Multi-Timer Mode)
**Event**: `all_timers_status`

```javascript
socket.on('all_timers_status', (data) => {
  console.log(data);
  // {
  //   mode: 'multi',
  //   timers: {
  //     1: {...},
  //     2: {...},
  //     ...
  //   }
  // }
});
```

#### 6. Timer State Changed
**Event**: `timer_state_changed`

```javascript
socket.on('timer_state_changed', (data) => {
  console.log(data);
  // {
  //   timer_id: 1,
  //   action: 'start',
  //   state: {
  //     time_left: 180,
  //     is_running: true,
  //     ...
  //   }
  // }
});
```

#### 7. Error
**Event**: `error`

```javascript
socket.on('error', (data) => {
  console.error(data);
  // {
  //   message: 'Timer 1 not found'
  // }
});
```

---

## Timer Control Actions

### Start Timer
Begins countdown from current time_left value.

**REST API**:
```bash
curl -X POST http://localhost:55011/api/timer/1 \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

**WebSocket**:
```javascript
socket.emit('timer_control', { action: 'start', timer_id: 1 });
```

### Stop Timer
Pauses countdown at current time_left value.

**REST API**:
```bash
curl -X POST http://localhost:55011/api/timer/1 \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

**WebSocket**:
```javascript
socket.emit('timer_control', { action: 'stop', timer_id: 1 });
```

### Reset Timer
Sets timer to specified time and stops it.

**REST API**:
```bash
curl -X POST http://localhost:55011/api/timer/1 \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "minutes": 10, "seconds": 30}'
```

**WebSocket**:
```javascript
socket.emit('timer_control', {
  action: 'reset',
  minutes: 10,
  seconds: 30,
  timer_id: 1
});
```

---

## Settings Configuration

### Available Settings

| Setting | Type | Description | Example |
|---------|------|-------------|---------|
| `textColor` | String (hex) | Timer text color | `"#FFFFFF"` |
| `backgroundColor` | String (hex) | Canvas background color | `"#000000"` |
| `fontFamily` | String | Font family name | `"Arial"` |
| `fontSize` | Integer | Font size in pixels | `100` |
| `fontVariant` | JSON String | Font weight/style | `'{"weight":"700","style":"normal","stretch":"normal"}'` |
| `endMessage` | String | Message when timer reaches 0 | `"TIME"` |
| `googleFontUrl` | String (URL) | Google Fonts CSS URL | `"https://fonts.googleapis.com/..."` |
| `googleFontFamily` | String | Google Font family name | `"Roboto"` |

### Update Settings

**REST API**:
```bash
curl -X POST http://localhost:55011/api/timer/1 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "settings",
    "settings": {
      "textColor": "#FFFFFF",
      "backgroundColor": "#FF0000",
      "fontFamily": "Roboto",
      "fontSize": 150,
      "endMessage": "FINISHED"
    }
  }'
```

**WebSocket**:
```javascript
socket.emit('timer_control', {
  action: 'settings',
  timer_id: 1,
  settings: {
    textColor: '#FFFFFF',
    backgroundColor: '#FF0000',
    fontFamily: 'Roboto',
    fontSize: 150,
    endMessage: 'FINISHED'
  }
});
```

### Google Fonts Integration

1. **Get Google Font URL** from [Google Fonts](https://fonts.google.com/)
2. **Download font locally** (optional but recommended):
   ```bash
   curl -X POST http://localhost:55011/fonts/download \
     -H "Content-Type: application/json" \
     -d '{"url": "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"}'
   ```
3. **Apply font** via settings:
   ```javascript
   socket.emit('timer_control', {
     action: 'settings',
     timer_id: 1,
     settings: {
       googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
       googleFontFamily: 'Roboto',
       fontFamily: 'Roboto'
     }
   });
   ```

---

## Integration Examples

### Bitfocus Companion Integration

#### Single Timer Mode
```javascript
// Start timer
fetch('http://192.168.1.100:55011/api/timer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start' })
});

// Reset to 5 minutes
fetch('http://192.168.1.100:55011/api/timer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'reset',
    minutes: 5,
    seconds: 0
  })
});
```

#### Multi-Timer Mode
```javascript
// Start timer 3
fetch('http://192.168.1.100:55011/api/timer/3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start' })
});

// Stop timer 1
fetch('http://192.168.1.100:55011/api/timer/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'stop' })
});
```

### Node.js WebSocket Client

```javascript
const io = require('socket.io-client');

// Single timer mode
const socket = io('http://localhost:55011');

// Multi-timer mode (timer 2)
const socket2 = io('http://localhost:55011/timer2');

socket.on('connect', () => {
  console.log('Connected to timer');
  
  // Start timer
  socket.emit('timer_control', { action: 'start' });
  
  // Listen for updates
  socket.on('timer_update', (data) => {
    console.log('Timer update:', data);
  });
});
```

### Python REST API Client

```python
import requests

BASE_URL = 'http://localhost:55011'

# Single timer mode
def start_timer():
    response = requests.post(
        f'{BASE_URL}/api/timer',
        json={'action': 'start'}
    )
    return response.json()

# Multi-timer mode
def reset_timer(timer_id, minutes, seconds):
    response = requests.post(
        f'{BASE_URL}/api/timer/{timer_id}',
        json={
            'action': 'reset',
            'minutes': minutes,
            'seconds': seconds
        }
    )
    return response.json()

# Get all timers status
def get_all_timers():
    response = requests.get(f'{BASE_URL}/api/timers/status')
    return response.json()

# Example usage
start_timer()
reset_timer(1, 10, 0)
print(get_all_timers())
```

### OBS Browser Source Setup

1. **Add Browser Source** in OBS
2. **Set URL**:
   - Single Timer: `http://localhost:55011/timer`
   - Multi-Timer: `http://localhost:55011/timer/1` (or 2, 3, 4, 5)
3. **Set Width/Height**: 1920x1080 (or your canvas size)
4. **Check**: "Shutdown source when not visible" (optional)
5. **Check**: "Refresh browser when scene becomes active" (optional)

### Stream Deck / Companion Button Setup

**Button 1 - Start Timer**:
- Action: HTTP Request
- Method: POST
- URL: `http://192.168.1.100:55011/api/timer/1`
- Body: `{"action": "start"}`
- Headers: `Content-Type: application/json`

**Button 2 - Stop Timer**:
- Action: HTTP Request
- Method: POST
- URL: `http://192.168.1.100:55011/api/timer/1`
- Body: `{"action": "stop"}`
- Headers: `Content-Type: application/json`

**Button 3 - Reset to 3 Minutes**:
- Action: HTTP Request
- Method: POST
- URL: `http://192.168.1.100:55011/api/timer/1`
- Body: `{"action": "reset", "minutes": 3, "seconds": 0}`
- Headers: `Content-Type: application/json`

---

## Error Handling

### Common Error Responses

**Timer Not Found**:
```json
{
  "error": "Timer 1 not found"
}
```

**Invalid Action**:
```json
{
  "error": "Invalid action"
}
```

**Missing timer_id in Multi-Timer Mode**:
```json
{
  "error": "timer_id required in multi-timer mode"
}
```

**Invalid Timer ID**:
```json
{
  "error": "Invalid timer ID: 6. Must be between 1 and 5"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters or missing required fields
- `404 Not Found`: Timer not found
- `500 Internal Server Error`: Server error

---

## Notes

### Persistence
- Timer settings are stored in browser localStorage
- Each timer in multi-timer mode has independent settings
- Settings persist across page reloads
- Mode preference is saved in localStorage

### Real-Time Updates
- All connected clients receive updates via WebSocket
- Timer displays automatically sync with control panel changes
- Multiple control panels can control the same timer simultaneously

### Font Caching
- Google Fonts are downloaded and cached locally on first use
- Local font URLs are used for faster loading
- Fonts persist in `./static/fonts/google/` directory

### Browser Compatibility
- Modern browsers with WebSocket support required
- Canvas API support required for timer display
- Socket.IO 4.0.1+ client library required

---

## Support

For issues or questions:
- Check the [README.md](README.md) for setup instructions
- Review the [steering documentation](.kiro/steering/) for project guidelines
- Ensure WebSocket connections are not blocked by firewalls
- Verify the server is running on the expected port (default: 55011)
