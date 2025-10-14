# Design Document

## Overview

The multi-timer support feature extends the existing single-timer application to support up to 5 independent timers. The design maintains backward compatibility with the current single-timer mode while adding a new multi-timer mode. Each timer operates independently with its own state, settings, display, and WebSocket connection.

## Architecture

### Mode Selection Architecture

The application will implement a mode-based architecture with two distinct operational modes:

1. **Single Timer Mode** (Default/Legacy)
   - Maintains current behavior and API compatibility
   - Uses existing routes and WebSocket endpoints
   - No timer identification required

2. **Multi-Timer Mode**
   - Supports up to 5 independent timers (IDs 1-5)
   - Each timer has separate routes, WebSocket namespaces, and state
   - Requires timer identification in API calls

### URL Structure

```
Single Timer Mode:
- Display: /
- Control: /control
- API: /api/timer
- WebSocket: default namespace

Multi-Timer Mode:
- Display: /timer/{id} (where id = 1-5)
- Control: /control (with timer selection dropdown)
- API: /api/timer/{id} or /api/timer with timer_id parameter
- WebSocket: /timer/{id} namespace
```

### State Management

Each timer maintains independent state including:
- Current time remaining
- Running status (start/stop/reset)
- Custom settings (colors, fonts, end message)
- Enable/disable status

## Components and Interfaces

### Backend Components

#### 1. Timer Manager Class
```python
class TimerManager:
    def __init__(self):
        self.timers = {}  # Dictionary of timer_id -> TimerState
        self.mode = 'single'  # 'single' or 'multi'
    
    def get_timer(self, timer_id=None):
        # Returns appropriate timer based on mode
    
    def set_mode(self, mode):
        # Switches between single and multi-timer modes
```

#### 2. Timer State Class
```python
class TimerState:
    def __init__(self, timer_id):
        self.timer_id = timer_id
        self.time_left = 180
        self.is_running = False
        self.settings = {}
        self.enabled = True
```

#### 3. Enhanced Flask Routes
- Mode selection endpoint: `/api/mode`
- Multi-timer API: `/api/timer/<int:timer_id>`
- Multi-timer displays: `/timer/<int:timer_id>`
- Timer status endpoint: `/api/timers/status`

#### 4. WebSocket Namespace Management
```python
# Single timer (backward compatibility)
socketio = SocketIO(app)

# Multi-timer namespaces
timer_namespaces = {}
for i in range(1, 6):
    timer_namespaces[i] = f'/timer/{i}'
```

### Frontend Components

#### 1. Mode Selection Interface
- Initial page that allows users to choose between Single Timer and Multi-Timer modes
- Stores mode preference in localStorage
- Redirects to appropriate interface

#### 2. Enhanced Control Panel
- Mode indicator showing current operational mode
- Timer selection dropdown (Multi-Timer mode only)
- Enable/disable checkboxes for each timer (Multi-Timer mode only)
- Dynamic settings panel that updates based on selected timer

#### 3. Timer Display Components
- Single timer display (existing functionality)
- Individual timer displays for multi-timer mode
- Each display connects to its specific WebSocket namespace

#### 4. WebSocket Client Management
```javascript
class TimerWebSocketManager {
    constructor(mode, timerId = null) {
        this.mode = mode;
        this.timerId = timerId;
        this.socket = null;
        this.connect();
    }
    
    connect() {
        if (this.mode === 'single') {
            this.socket = io();
        } else {
            this.socket = io(`/timer/${this.timerId}`);
        }
    }
}
```

## Data Models

### Timer Configuration Model
```python
@dataclass
class TimerConfig:
    timer_id: int
    enabled: bool = True
    time_left: int = 180
    is_running: bool = False
    settings: dict = field(default_factory=dict)
    
    def to_dict(self):
        return asdict(self)
```

### API Request/Response Models
```python
# API Request for timer control
{
    "action": "start|stop|reset|settings",
    "timer_id": 1,  # Required in multi-timer mode
    "minutes": 3,
    "seconds": 0,
    "settings": {}
}

# API Response
{
    "status": "success|error",
    "message": "Optional message",
    "timer_id": 1,
    "data": {}
}
```

### WebSocket Message Models
```python
# Single Timer Mode (backward compatibility)
{
    "action": "start|stop|reset|settings",
    "minutes": 3,
    "seconds": 0,
    "settings": {}
}

# Multi-Timer Mode
{
    "action": "start|stop|reset|settings",
    "timer_id": 1,
    "minutes": 3,
    "seconds": 0,
    "settings": {}
}
```

## Error Handling

### API Error Responses
- Invalid timer_id: HTTP 400 with error message
- Timer not found: HTTP 404 with error message
- Invalid mode: HTTP 400 with error message
- Missing required parameters: HTTP 400 with validation errors

### WebSocket Error Handling
- Connection failures: Automatic reconnection with exponential backoff
- Invalid timer_id: Error event with descriptive message
- Namespace not found: Fallback to default namespace with warning

### Frontend Error Handling
- Mode selection persistence failure: Graceful degradation to single-timer mode
- WebSocket connection failure: Display connection status and retry mechanism
- Timer state synchronization issues: Periodic state refresh from server

## Testing Strategy

### Unit Tests
- Timer state management functions
- API endpoint validation
- WebSocket message routing
- Mode switching logic

### Integration Tests
- End-to-end timer control workflows
- Multi-timer independence verification
- WebSocket namespace isolation
- API backward compatibility

### Browser Tests
- Cross-browser WebSocket compatibility
- localStorage persistence
- Font loading in multi-timer displays
- Responsive design across different screen sizes

## Implementation Phases

### Phase 1: Backend Infrastructure
- Implement TimerManager and TimerState classes
- Add multi-timer API endpoints
- Set up WebSocket namespaces
- Implement mode switching logic

### Phase 2: Frontend Mode Selection
- Create mode selection interface
- Implement localStorage persistence
- Add mode switching functionality
- Update routing logic

### Phase 3: Multi-Timer Control Panel
- Add timer selection dropdown
- Implement enable/disable functionality
- Update settings management for multiple timers
- Add visual indicators for timer status

### Phase 4: Multi-Timer Displays
- Create individual timer display routes
- Implement timer-specific WebSocket connections
- Ensure independent timer rendering
- Add timer identification in displays

### Phase 5: Testing and Polish
- Comprehensive testing across all modes
- Performance optimization for multiple WebSocket connections
- UI/UX improvements
- Documentation updates

## Security Considerations

- Timer ID validation to prevent access to non-existent timers
- Rate limiting on API endpoints to prevent abuse
- WebSocket namespace isolation to prevent cross-timer interference
- Input sanitization for all timer settings and parameters

## Performance Considerations

- Efficient WebSocket connection management
- Minimal memory footprint for inactive timers
- Optimized font loading across multiple displays
- Lazy loading of timer resources
- Connection pooling for WebSocket namespaces

## Docker Container Considerations

The multi-timer implementation is fully compatible with the existing Docker container setup:

### Container Architecture
- **Port Exposure**: Single port (8765) handles all timer endpoints and WebSocket namespaces
- **Volume Mounting**: Existing font volume mount (`./static/fonts/google:/app/static/fonts/google`) supports all timers
- **Environment Variables**: Current environment variables (FLASK_SECRET_KEY, PORT) remain sufficient

### WebSocket Namespace Support
- Flask-SocketIO natively supports multiple namespaces within a single port
- No additional port exposure required for timer-specific WebSocket connections
- Container networking remains unchanged

### Resource Management
- Memory usage scales linearly with active timers (minimal overhead per timer)
- CPU usage remains efficient with proper WebSocket connection pooling
- Font caching shared across all timer instances within the container

### Deployment Considerations
- No changes required to existing docker-compose.yml
- Container restart behavior preserved (unless-stopped)
- Volume persistence ensures font downloads survive container restarts
- Environment variable configuration remains the same

## Backward Compatibility

- Single Timer mode maintains exact current behavior
- Existing API endpoints remain unchanged
- Current WebSocket message format preserved
- No breaking changes to existing integrations
- Graceful fallback for unsupported features