# Clone the repository
git clone https://github.com/PongAlmighty/FightTimer.git
cd FightTimer

# Install dependencies
pip install flask flask-socketio flask-sqlalchemy email-validator

# Start the server (default port: 8765)
python main.py

# Optional: Use custom port
PORT=9000 python main.py