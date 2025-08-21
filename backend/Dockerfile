# Use a more stable Debian-based Python image to ensure package repository access
FROM python:3.12-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required by OpenCV (cv2) and pyzbar
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libgl1-mesa-glx \
       libglib2.0-0 \
       libzbar0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install a compatible version of NumPy BEFORE installing other packages
RUN pip install --no-cache-dir "numpy<2.0"

# Install the rest of the packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "120", "app:app"]