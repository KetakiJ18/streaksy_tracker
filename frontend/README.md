# Habit Tracker Frontend

React + TypeScript frontend for the Smart Habit Tracker application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Features

- 🔐 Authentication (Login/Register)
- 📊 Dashboard with today's habits
- 📝 Habit management (CRUD)
- 📅 Calendar heatmap view
- 🤖 AI-powered insights
- ⚙️ Settings and profile management
- 🌙 Dark mode support
- 📱 Mobile-responsive design

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state management)
- Axios (HTTP client)
- React Hot Toast (notifications)
- Lucide React (icons)

## Build

```bash
npm run build
```

## Testing

```bash
npm test
npm run test:ui
npm run test:e2e
```

## Deployment

The frontend is configured for Vercel deployment. The CI/CD pipeline automatically deploys on push to main branch.

