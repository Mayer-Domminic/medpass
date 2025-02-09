# MEDPASS - Predictive Assessment for Student Success 🎓

## Overview
MEDPASS is a predictive analytics platform designed to assess and enhance student success in medical education. The system leverages data-driven insights to identify early intervention opportunities and support academic achievement through NetID authentication and comprehensive student performance tracking.

### Deployment URLs
- **API:** [api.medpass.unr.dev](https://api.medpass.unr.dev)
- **Web:** [medpass.unr.dev](https://medpass.unr.dev)

## Server Operations (SSH@MP)
```bash
./startmedpass.sh
pm2 logs
pm2 monit
```

### Database Initialization
```bash
python -m app.scripts.init_db
python -m app.scripts.student_ingest
```

### PostgreSQL Setup
```bash
sudo -u postgres psql

CREATE DATABASE medpass;
CREATE USER medpassadmin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medpass TO medpassadmin;

\c medpass
GRANT ALL ON SCHEMA public TO medpassadmin;
\q
```

### Environment Configuration

#### Find and replace passwords

Create `.env.local` for frontend settings:
```bash
cat <<EOF > .env.local
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your_secret_key
EOF
```

Create `.env` for backend settings:
```bash
cat <<EOF > .env
POSTGRES_SERVER=localhost
POSTGRES_USER=medpassadmin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=medpass
SECRET_KEY=your_secret_key
EOF
```

## Frontend Setup
```bash
# Navigate to frontend directory
cd medpass

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Backend Setup
```bash
# Navigate to backend directory
cd backend

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

