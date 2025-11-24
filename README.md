# Smart Habit Tracker

AI-powered habit tracking web application with personalized insights and WhatsApp notifications.

## Features

- 🔐 Secure authentication (JWT, optional OAuth)
- 📊 Habit tracking with streaks and consistency scores
- 📅 Calendar heatmap visualization
- 🤖 AI-powered behavior insights and suggestions
- 📱 WhatsApp notifications via Twilio
- 🌙 Dark mode support
- 📱 Mobile-first responsive design
- ✅ Comprehensive testing suite

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI/Claude (pluggable adapter pattern)
- **Notifications**: Twilio WhatsApp API
- **Testing**: Jest, Vitest, Playwright
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions + Vercel

## Project Structure

```
tracker/
├── backend/          # Express API server
├── frontend/         # React application
├── docker-compose.yml
└── README.md
```

## Quick Start

### Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

### Manual Setup

### Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose (optional, for local PostgreSQL)
- PostgreSQL (or use Docker)
- OpenAI API key (for AI features)
- Twilio account (for WhatsApp notifications)

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories.

**Backend `.env`:**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/habit_tracker
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Local Development

1. **Using Docker (Recommended):**
   ```bash
   npm run docker:up
   npm install
   npm run dev
   ```

2. **Manual Setup:**
   ```bash
   # Install dependencies
   npm install
   
   # Start PostgreSQL (if not using Docker)
   # Then run migrations
   cd backend && npm run migrate
   
   # Start development servers
   npm run dev
   ```

### Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

## API Documentation

See `backend/README.md` for detailed API documentation.

## Deployment

- **Frontend**: Deploy to Vercel (automatic via GitHub Actions)
- **Backend**: Deploy to your preferred Node.js hosting (Railway, Render, etc.)

## License

MIT

