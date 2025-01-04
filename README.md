# Local Timer for OBS

A browser-based countdown timer designed for local use on Mac mini, perfect for OBS integration.

## Local Setup

1. Clone this repository to your Mac mini
2. Install Python 3.x if not already installed
3. Install the required packages:
   ```bash
   pip install flask flask-socketio
   ```

## Running the Timer

1. Start the timer server:
   ```bash
   python app.py
   ```
   The server will start on `http://localhost:5000`

2. Access the timer:
   - Timer Display: `http://localhost:5000`
   - Control Panel: `http://localhost:5000/control`

## OBS Integration

1. Add a new Browser Source in OBS
2. Set the URL to `http://localhost:5000`
3. Set appropriate dimensions (e.g., 1920x1080)
4. Check "Shutdown source when not visible" if desired

## Features

- Clean, high-contrast display optimized for OBS
- Local control panel for timer management
- Customizable text color and font
- Shows "TIME" when countdown reaches zero
- Start, stop, and reset functionality

## Security Note

This timer is designed to run locally on your Mac mini. It only accepts connections from localhost for security.
