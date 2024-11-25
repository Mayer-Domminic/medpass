# MEDPASS - Predictive Assessment for Student Success 🎓

## Overview
MEDPASS is a predictive analytics platform designed to assess and enhance student success in medical education. The system leverages data-driven insights to identify early intervention opportunities and support academic achievement.

## 🌐 Project Architecture

### Frontend (`/medpass`)
- **Framework**: Next.js 14+ (App Router)
- **Development**: Turbopack
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Language**: TypeScript
- **Deployment**: Netlify (medpass.netlify.app)

### Backend (`/backend`)
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Deployment**: api.domm.dev

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or later
- Python 3.8+
- PostgreSQL
- pnpm (recommended) or npm

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

# Start FastAPI server
uvicorn main:app --reload
```

## 📁 Project Structure

```
medpass/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
└── medpass/
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    └── styles/
```

## 🛠️ Development

### Environment Variables
Create `.env` files in both frontend and backend directories:

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/medpass
```

### Available Scripts

#### Frontend
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests

#### Backend
- `uvicorn main:app --reload` - Start development server
- `pytest` - Run tests
- `black .` - Format code
- `isort .` - Sort imports

## 🚀 Deployment

### Frontend
The frontend is automatically deployed to Netlify when changes are pushed to the main branch.
- Production URL: medpass.domm.dev
- Preview URL: medpass.netlify.app

### Backend
The API is deployed to api.domm.dev