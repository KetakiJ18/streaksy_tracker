# Smart Habit Tracker Setup Script (PowerShell)

Write-Host "🚀 Setting up Smart Habit Tracker..." -ForegroundColor Cyan

# Check Node.js version
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

$nodeVersion = (node -v).Substring(1).Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $(node -v)" -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup backend
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update backend/.env with your configuration" -ForegroundColor Yellow
}
npm install
Set-Location ..

# Setup frontend
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update frontend/.env with your API URL" -ForegroundColor Yellow
}
npm install
Set-Location ..

# Check Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Docker detected. You can start the database with: npm run docker:up" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker not found. You'll need to set up PostgreSQL manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your database and API keys"
Write-Host "2. Update frontend/.env with your backend API URL"
Write-Host "3. Start PostgreSQL: npm run docker:up (or set up manually)"
Write-Host "4. Run database migrations: cd backend && npm run migrate"
Write-Host "5. Start development: npm run dev"
Write-Host ""

