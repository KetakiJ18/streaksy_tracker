# Habit Tracker Backend API

RESTful API for the Smart Habit Tracker application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy `.env.example` to `.env`):
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npm run migrate
```

Or manually run the SQL schema:
```bash
psql $DATABASE_URL -f src/config/database.sql
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/me` - Update user profile (protected)

### Habits

- `GET /api/habits` - Get all habits (protected)
- `GET /api/habits/:id` - Get single habit (protected)
- `POST /api/habits` - Create habit (protected)
- `PUT /api/habits/:id` - Update habit (protected)
- `DELETE /api/habits/:id` - Delete habit (protected)

### Tracking

- `GET /api/tracks/today` - Get today's habits with completion status (protected)
- `POST /api/tracks/:habitId/complete` - Mark habit as completed (protected)
- `POST /api/tracks/:habitId/incomplete` - Mark habit as incomplete (protected)
- `GET /api/tracks/calendar` - Get calendar heatmap data (protected)
- `GET /api/tracks/:habitId/logs` - Get track logs for habit (protected)

### AI Insights

- `GET /api/insights/habit/:habitId` - Generate insight for habit (protected)
- `GET /api/insights/patterns` - Get pattern analysis (protected)
- `GET /api/insights/recent` - Get recent insights (protected)

### Notifications

- `GET /api/notifications` - Get user notifications (protected)
- `POST /api/notifications/test-reminder` - Send test reminder (protected)

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp number

