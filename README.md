# MEDPASS - Predictive Assessment for Student Success 🎓

## Overview
MEDPASS is a predictive analytics platform designed to assess and enhance student success in medical education. The system leverages data-driven insights to identify early intervention opportunities and support academic achievement through NetID authentication and comprehensive student performance tracking.

## 🌐 Project Architecture

### Frontend (`/medpass`)
- **Framework**: Next.js 14+ (App Router)
- **Development**: Turbopack
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Authentication**: Auth0 with NetID Integration
- **Language**: TypeScript
- **Deployment**: Netlify (medpass.netlify.app)

### Backend (`/backend`)
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT with Auth0
- **Deployment**: api.domm.dev

## 📁 Project Structure

```
medpass/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   │       ├── api.py
│   │   │       └── endpoints/
│   │   │           └── users.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   └── base.py
│   │   └── schemas/
│   │       └── user.py
│   ├── scripts/
│   │   └── init_db.py
│   └── requirements.txt
└── medpass/
    ├── app/
    │   ├── auth/
    │   │   ├── callback/
    │   │   ├── login/
    │   │   ├── logout/
    │   │   └── verify-netid/
    │   ├── dashboard/
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── auth/
    │   ├── ui/
    │   └── Dashboard.tsx
    ├── lib/
    │   └── auth/
    │       ├── context.tsx
    │       └── types.ts
    └── styles/
        └── globals.css
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- Python 3.8+
- PostgreSQL
- pnpm (recommended) or npm

### Database Setup

1. First, initialize the PostgreSQL database:
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

2. Initialize database tables:
```bash
# Navigate to backend directory
cd backend

# Run the initialization script
python scripts/init_db.py
```

### Environment Setup

#### Frontend (.env.local)
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'

# Production
# NEXT_PUBLIC_API_URL=https://api.domm.dev
```

#### Backend (.env)
```env
PROJECT_NAME=MEDPASS
VERSION=1.0.0
API_V1_STR=/api/v1

# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=medpass_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=medpass

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_API_AUDIENCE=your-api-identifier
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

# Initialize database tables
python scripts/init_db.py

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🛠️ API Routes

### Authentication Routes
- `POST /api/v1/users/verify-netid` - Verify UNR NetID
- `POST /api/v1/users` - Create/Update user profile
- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users` - List all users (admin only)

### Frontend Routes
- `/` - Landing/Welcome page
- `/auth/login` - Login page
- `/auth/callback` - Auth0 callback handler
- `/auth/verify-netid` - NetID verification
- `/dashboard` - Main dashboard
- `/profile` - User profile

## 👥 Authentication Flow

1. User initiates login through Auth0
2. After successful Auth0 authentication:
   - New users are redirected to NetID verification
   - Existing users with verified NetID go to dashboard
3. NetID verification process:
   - User enters UNR NetID
   - Backend validates NetID
   - On success, user proceeds to dashboard

## 🚀 Deployment

### Frontend
The frontend is automatically deployed to Netlify when changes are pushed to the main branch.
- Production URL: medpass.domm.dev
- Preview URL: medpass.netlify.app

### Backend
The backend API is deployed to a dedicated server:
- Production URL: api.domm.dev
- API Documentation: api.domm.dev/docs

## 📝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request