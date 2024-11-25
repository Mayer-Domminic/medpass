#!/bin/bash

# Install system dependencies
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib

# Create backend directory structure if it doesn't exist
mkdir -p backend/app/{api/v1/endpoints,core,models,schemas}
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Setup Nginx
sudo bash -c 'cat > /etc/nginx/sites-available/api.domm.dev' << 'EOL'
server {
    listen 80;
    server_name api.domm.dev;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

# Enable the Nginx site
sudo ln -s /etc/nginx/sites-available/api.domm.dev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Create systemd service for FastAPI
sudo bash -c 'cat > /etc/systemd/system/medpass.service' << 'EOL'
[Unit]
Description=MEDPASS FastAPI Application
After=network.target

[Service]
User=fweshi
Group=fweshi
WorkingDirectory=/home/fweshi/projec/medpass/backend
Environment="PATH=/home/fweshi/projec/medpass/backend/venv/bin"
ExecStart=/home/fweshi/projec/medpass/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOL

# Start and enable the service
sudo systemctl daemon-reload
sudo systemctl start medpass
sudo systemctl enable medpass