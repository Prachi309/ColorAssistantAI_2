FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and others
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose port (Railway uses $PORT)
EXPOSE 8000

# Start the app
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
