# Technology Stack

## Backend
- **Python 3.11+** - Core runtime
- **Flask 3.1.0+** - Web framework
- **Flask-SocketIO 5.5.0+** - WebSocket support for real-time communication
- **Eventlet 0.38.2+** - Async networking library
- **Requests 2.31.0+** - HTTP client for Google Fonts downloading

## Frontend
- **Vanilla JavaScript** - No frameworks, direct DOM manipulation
- **HTML5 Canvas** - Timer rendering and display
- **Socket.IO 4.0.1** - WebSocket client library
- **CSS3** - Styling and responsive design

## Development Tools
- **uv** - Python package manager (pyproject.toml)
- **Docker** - Containerization
- **Docker Compose** - Local development orchestration

## Common Commands

### Development
```bash
# Start development server
python main.py

# Install dependencies
pip install -r requirements.txt
# OR with uv
uv sync
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Build standalone container
docker build -t fighttimer .

# Run container
docker run -p 55011:55011 fighttimer
```

### Testing
```bash
# Run application tests (when implemented)
python -m pytest

# Check API endpoint
curl http://localhost:55011/api/timer
```

## Build System
- Uses `pyproject.toml` for Python dependency management
- `requirements.txt` maintained for Docker compatibility
- No build step required - direct Python execution
- Font assets downloaded and cached at runtime

## Deployment
- Default port: 55011
- Environment variables: `FLASK_SECRET_KEY`, `PORT`
- Volume mount for font persistence: `./static/fonts/google`
- Supports macOS launchd service configuration