FROM python:3.10-slim

# Install System Dependencies (ffmpeg & curl)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Requirements & Install Python Packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Application Code
COPY . .

# Environment Port variable
ENV PORT=8081

EXPOSE 8081

# Run with Gunicorn WSGI Server for high availability
CMD ["gunicorn", "--bind", "0.0.0.0:8081", "--workers", "2", "--timeout", "120", "cloud_music_api:app"]
