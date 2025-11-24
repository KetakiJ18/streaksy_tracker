#!/bin/bash

# Smart Habit Tracker Setup Script

echo "🚀 Setting up Smart Habit Tracker..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your configuration"
fi
npm install
cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update frontend/.env with your API URL"
fi
npm install
cd ..

# Check Docker
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. You can start the database with: npm run docker:up"
else
    echo "⚠️  Docker not found. You'll need to set up PostgreSQL manually."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database and API keys"
echo "2. Update frontend/.env with your backend API URL"
echo "3. Start PostgreSQL: npm run docker:up (or set up manually)"
echo "4. Run database migrations: cd backend && npm run migrate"
echo "5. Start development: npm run dev"
echo ""

