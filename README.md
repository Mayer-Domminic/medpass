# MEDPASS - Predictive Assessment for Student Success 🎓

## Overview
MEDPASS is a predictive analytics platform designed to assess and enhance student success in medical education. The system leverages data-driven insights to identify early intervention opportunities and support academic achievement.

## 🌐 Project Architecture

### Frontend (`/medpass`)
- **Framework**: Next.js (App Router)
- **Development**: Turbopack
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Language**: TypeScript
- **Deployment**: Netlify (medpass.netlify.app)

### Backend (`/backend`)
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Deployment**: api.domm.dev

## 📁 Project Structure

```
medpass/
├── setup_backend.sh           # Root level setup script
├── backend/
│   ├── app/
│   │   ├── api/              # /backend/app/api
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/            # /backend/app/core
│   │   ├── models/          # /backend/app/models
│   │   └── services/        # /backend/app/services
│   ├── tests/               # /backend/tests
│   └── requirements.txt     # /backend/requirements.txt
└── medpass/
    ├── app/                 # /medpass/app
    ├── components/          # /medpass/components
    ├── lib/                 # /medpass/lib
    ├── public/              # /medpass/public
    └── styles/              # /medpass/styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- Python 3.8+
- PostgreSQL
- pnpm (recommended) or npm

### Initial Server Setup (Production Only)
If deploying to a fresh server:

1. Make the setup script executable:
```bash
chmod +x setup_backend.sh
```

2. Run the setup script:
```bash
./setup_backend.sh
```

This script will:
- Install system dependencies
- Configure Nginx for api.domm.dev
- Set up systemd service for FastAPI
- Configure the backend environment

### Database Setup
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE medpass;
CREATE USER medpass_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medpass TO medpass_user;

# Connect to the medpass database
\c medpass

# Grant needed privileges
GRANT ALL ON SCHEMA public TO medpass_user;

# Exit PostgreSQL
\q
```

### Environment Setup

#### Frontend (.env.local) # /medpass/.env.local
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production
# NEXT_PUBLIC_API_URL=http://api.domm.dev
```

#### Backend (.env) # /backend/.env
```env
# Development
POSTGRES_SERVER=localhost
POSTGRES_USER=medpass_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=medpass

# Production
# POSTGRES_SERVER=47.44.253.179
# POSTGRES_USER=medpass_user
# POSTGRES_PASSWORD=your_secure_password
# POSTGRES_DB=medpass
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd medpass

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# pip freeze > requirements.txt

# Run database migrations
export PYTHONPATH=$PYTHONPATH:$(pwd)  # Important for Alembic to find the app
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🛠️ Development

### Available Scripts

#### Frontend # /medpass/package.json
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

#### Backend # /backend
- `uvicorn app.main:app --reload` - Start development server
- `pytest` - Run tests
- `black .` - Format code
- `isort .` - Sort imports

### Service Management (Production)
```bash
# Start the FastAPI service
sudo systemctl start medpass

# Check service status
sudo systemctl status medpass

# View logs
sudo journalctl -u medpass -f

# Restart Nginx after config changes
sudo systemctl restart nginx
```

## 🚀 Deployment

### Frontend
The frontend is automatically deployed to Netlify when changes are pushed to the main branch.
- Production URL: medpass.domm.dev
- Preview URL: medpass.netlify.app

### Backend
The API is deployed to api.domm.dev

#### Manual Backend Deployment
```bash
# SSH into the server
ssh user@47.44.253.179

# Pull latest changes
cd /path/to/medpass
git pull

# Restart the service
sudo systemctl restart medpass

# Check the logs
sudo journalctl -u medpass -f
```






### SSL and Nginx Setup

1. Install required packages:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

2. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/api.domm.dev
# Paste the configuration provided in api.domm.dev.conf
```

3. Create symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/api.domm.dev /etc/nginx/sites-enabled/
```

4. Remove default config (if it exists):
```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

5. Get SSL certificate:
```bash
sudo certbot --nginx -d api.domm.dev
```

6. Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

7. Verify SSL auto-renewal is set up:
```bash
sudo systemctl status certbot.timer
```

#### SSL Certificate Renewal

Certificates will automatically renew if the certbot timer is active. To manually renew:
```bash
sudo certbot renew
```

#### Testing SSL Configuration

You can test your SSL configuration at [SSL Labs](https://www.ssllabs.com/ssltest/).