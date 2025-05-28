FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create directory for downloaded fonts if it doesn't exist
RUN mkdir -p static/fonts/google

# Expose the port the app runs on
EXPOSE 8765

# Command to run the application
CMD ["python", "main.py"]
