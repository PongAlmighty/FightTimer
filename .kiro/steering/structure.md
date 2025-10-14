# Project Structure

## Root Directory
```
├── main.py              # Application entry point
├── app.py               # Flask application and routes
├── font_manager.py      # Google Fonts download and caching
├── requirements.txt     # Python dependencies
├── pyproject.toml       # Python project configuration
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Docker orchestration
└── update-container.sh  # Container update script
```

## Frontend Assets
```
├── templates/           # Jinja2 HTML templates
│   ├── index.html      # Timer display page
│   └── control.html    # Control panel interface
├── static/
│   ├── css/
│   │   └── styles.css  # Application styles
│   ├── js/
│   │   ├── timer.js    # Timer display logic
│   │   └── websocket.js # WebSocket communication
│   └── fonts/
│       └── google/     # Downloaded Google Fonts cache
```

## Configuration Files
```
├── .kiro/              # Kiro IDE configuration
│   ├── steering/       # AI assistant guidance
│   └── specs/          # Feature specifications
├── .github/            # GitHub workflows and templates
├── .vscode/            # VS Code settings
└── .gitignore          # Git ignore patterns
```

## Architecture Patterns

### Flask Application Structure
- **main.py** - Entry point, runs Flask-SocketIO server
- **app.py** - Route definitions, WebSocket handlers, business logic
- **font_manager.py** - Utility class for font operations

### Frontend Organization
- **Templates** - Server-rendered HTML with Jinja2
- **Static assets** - Organized by type (css, js, fonts)
- **JavaScript** - Class-based organization, no build process

### API Structure
- **REST endpoints** - `/api/timer` for external integration
- **WebSocket events** - Real-time timer updates
- **Static routes** - `/`, `/control` for user interfaces

## File Naming Conventions
- **Python files** - snake_case (app.py, font_manager.py)
- **HTML templates** - lowercase (index.html, control.html)
- **JavaScript files** - camelCase classes, lowercase files
- **CSS files** - lowercase with hyphens for multi-word

## Development Workflow
1. **Backend changes** - Modify app.py or font_manager.py
2. **Frontend changes** - Update templates/ or static/ files
3. **Testing** - Use browser for UI, curl/Postman for API
4. **Deployment** - Docker Compose for local, container for production

## Future Structure (Multi-Timer)
The project is evolving to support multiple timers with these additions:
- Timer management classes in backend
- Timer-specific routes and WebSocket namespaces
- Mode selection interface
- Enhanced control panel with timer selection