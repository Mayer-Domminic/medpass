#!/bin/bash

# Install system dependencies
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib

# Create backend directory structure if it doesn't exist
mkdir -p backend/app/{api/v1/endpoints,core,models,schemas}
cd backend

# Create virtual environment
python3 -m venv backend/venv
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt