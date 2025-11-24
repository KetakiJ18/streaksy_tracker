# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (for AI features)
- Twilio account (for WhatsApp notifications)
- Vercel account (for frontend deployment)

## Backend Deployment

### Option 1: Railway

1. Connect your GitHub repository to Railway
2. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`

### Option 2: Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add PostgreSQL database and set `DATABASE_URL`
7. Add other environment variables

### Option 3: Docker

```bash
cd backend
docker build -t habit-tracker-backend .
docker run -p 5000:5000 --env-file .env habit-tracker-backend
```

## Frontend Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL` (your backend URL)

The CI/CD pipeline automatically deploys to Vercel on push to main branch.

## Database Setup

1. Create a PostgreSQL database
2. Run the migration:
```bash
psql $DATABASE_URL -f backend/src/migrations/001_initial_schema.sql
```

Or use the SQL file directly:
```bash
psql $DATABASE_URL -f backend/src/config/database.sql
```

## Environment Variables

### Backend

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Frontend

```env
VITE_API_URL=https://your-backend-url.com/api
```

## Testing Deployment

1. Backend health check: `GET https://your-backend-url.com/health`
2. Frontend: Visit your Vercel URL
3. Test registration and login
4. Create a habit and mark it complete
5. Check calendar view
6. Generate an AI insight

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from your server
- Ensure SSL is configured if required

### WhatsApp Notifications Not Working

- Verify Twilio credentials
- Check phone number format (include country code)
- Ensure WhatsApp is enabled in Twilio console

### AI Insights Not Generating

- Verify OpenAI API key is valid
- Check API quota/limits
- Review backend logs for errors

