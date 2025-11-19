# Complete Setup Guide

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Docker** and **Docker Compose**
- **PostgreSQL** 15 (if running without Docker)
- **Git**

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tailor-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

#### Backend Environment

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=tailor_app

# JWT Configuration (Generate secure random strings!)
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-different-random-32-char-string>
JWT_REFRESH_EXPIRES_IN=7d

# Encryption (MUST be exactly 32 characters)
ENCRYPTION_KEY=<exactly-32-character-string>

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Optional: Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Optional: Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Optional: AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
```

**Generate secure keys:**

```bash
# For JWT secrets (32 characters each)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For ENCRYPTION_KEY (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

#### Frontend Environment

Create `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
sleep 5

# Run migrations (will be auto-run on first start)
cd backend
npm run migration:run
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL 15
2. Create database:

```bash
psql -U postgres
CREATE DATABASE tailor_app;
\q
```

3. Run migrations:

```bash
cd backend
npm run migration:run
```

### 5. Start Development Servers

#### Option A: Start All at Once

```bash
# From root directory
npm run dev
```

This starts both backend and frontend concurrently.

#### Option B: Start Separately

Terminal 1 (Backend):
```bash
cd backend
npm run start:dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Verify Installation

Open your browser and navigate to:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

You should see:
- Frontend landing page
- Swagger API documentation

### 7. Create Test Accounts

#### Via API Documentation

1. Go to http://localhost:3000/api/docs
2. Find `POST /api/auth/signup`
3. Click "Try it out"
4. Enter test data:

```json
{
  "name": "Test Customer",
  "email": "customer@test.com",
  "password": "password123",
  "role": "customer"
}
```

5. Execute and save the access token

Create a tailor account:

```json
{
  "name": "Test Tailor",
  "email": "tailor@test.com",
  "password": "password123",
  "role": "tailor"
}
```

#### Via Frontend

1. Go to http://localhost:3001
2. Click "Sign Up"
3. Fill in the form
4. Select role (Customer or Tailor)
5. Submit

### 8. Seed Sample Data (Optional)

Create a seed script or manually add data through the API.

Example: Create a shop via API:

```bash
# Get auth token first (from signup response)
TOKEN="your_access_token"

# Create shop
curl -X POST http://localhost:3000/api/shops \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Tailors",
    "description": "High-quality custom tailoring",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "phone": "+919876543210",
    "email": "contact@premiumtailors.com",
    "categories": ["mens_wear", "womens_wear"]
  }'
```

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Database Migrations

Generate a new migration:

```bash
cd backend
npm run migration:generate -- -n MigrationName
```

Run pending migrations:

```bash
npm run migration:run
```

Revert last migration:

```bash
npm run migration:revert
```

## Production Deployment

### 1. Update Environment Variables

Set production values in:
- `docker-compose.yml`
- Or use environment variable injection

**Critical production settings:**

```env
NODE_ENV=production
JWT_SECRET=<strong-production-secret>
ENCRYPTION_KEY=<strong-production-key>
DB_PASSWORD=<strong-database-password>
```

### 2. Build and Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Verify Deployment

```bash
# Health check
curl http://localhost:3000/api/health

# Check database connection
docker-compose exec backend npm run migration:run
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d tailor_app
```

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a few seconds
# 2. Invalid environment variables
# 3. Port 3000 already in use
```

### Frontend Build Errors

```bash
# Clear Next.js cache
cd frontend
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Migration Errors

```bash
# Reset database (⚠️ Data loss!)
docker-compose down -v
docker-compose up -d postgres

# Wait and run migrations
sleep 5
cd backend
npm run migration:run
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Permission Denied

```bash
# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Module Not Found

```bash
# Clear all node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## Next Steps

After successful setup:

1. ✅ Explore the API documentation
2. ✅ Create test accounts (customer, tailor, admin)
3. ✅ Test the complete order flow
4. ✅ Customize the frontend UI
5. ✅ Configure payment providers
6. ✅ Set up email/SMS services
7. ✅ Deploy to staging environment

## Support

For issues:
- Check the [troubleshooting section](#troubleshooting)
- Review logs: `docker-compose logs`
- Open an issue on GitHub
