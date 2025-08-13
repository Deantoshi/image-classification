#!/bin/bash

echo
echo "=========================================================="
echo "=       Starting Image Processing Application          ="
echo "=========================================================="
echo

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create input/output folders in the script's directory
if [ ! -d "$SCRIPT_DIR/input" ]; then
    mkdir "$SCRIPT_DIR/input"
fi

if [ ! -d "$SCRIPT_DIR/output" ]; then
    mkdir "$SCRIPT_DIR/output"
fi

echo "IMPORTANT:"
echo "1. Place your images in the 'input' folder that was just created."
echo "2. Results will appear in the 'output' folder."
echo
read -p "Press Enter to continue..."

echo
echo "--- Checking for Updates and Running Analysis ---"
echo

# This command downloads the latest version of your app from Docker Hub.
docker pull ai555/maskrcnn-app

# Run the Docker container with mounted volumes
docker run --rm -it -v "$SCRIPT_DIR/input:/app/input" -v "$SCRIPT_DIR/output:/app/output" ai555/maskrcnn-app

echo
echo "=========================================================="
echo "=                 Application Finished                   ="
echo "=========================================================="
echo
read -p "Press Enter to exit..."