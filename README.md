# Tailor App - Custom Tailoring Marketplace

A complete, production-ready platform for ordering custom-tailored clothing, connecting customers with professional tailors. Built with modern technologies and best practices.

## Features

### Core Functionality
- **User Authentication**: Email/password, phone OTP, and OAuth (Google) support with JWT tokens
- **Measurement Management**: Securely store customer measurements with encryption at rest
- **Shop/Tailor Management**: Onboarding, catalog management, and capacity tracking
- **Order System**: Complete order lifecycle with routing, status tracking, and notifications
- **Real-time Updates**: WebSocket integration for live order updates and chat
- **Payment Integration**: Stripe integration for secure payment processing
- **Admin Dashboard**: Platform management, shop approvals, and analytics

### Security Features
- **Encrypted Measurements**: Application-level encryption for sensitive customer data
- **Audit Logs**: Track who accesses customer measurements and when
- **GDPR Compliance**: User data deletion and consent management
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation and sanitization

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Real-time**: Socket.IO
- **Payments**: Stripe
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL 15

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15 (if running locally)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tailor-app
```

### 2. Environment Setup

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your configuration
```

### 3. Development with Docker (Recommended)

Start PostgreSQL:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

Install dependencies and start services:
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all

# Start backend and frontend in development mode
npm run dev
```

The applications will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

### 4. Production with Docker

Build and start all services:
```bash
docker-compose up -d
```

## Project Structure

```
tailor-app/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── common/         # Shared utilities, guards, decorators
│   │   ├── config/         # Configuration files
│   │   ├── database/       # Entities and migrations
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── users/      # User management
│   │   │   ├── measurements/  # Measurement profiles
│   │   │   ├── shops/      # Shop management
│   │   │   ├── products/   # Product catalog
│   │   │   ├── orders/     # Order processing
│   │   │   ├── payments/   # Payment handling
│   │   │   ├── chat/       # Messaging
│   │   │   └── admin/      # Admin operations
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   │   ├── auth/      # Authentication pages
│   │   │   ├── shops/     # Shop browsing
│   │   │   ├── orders/    # Order tracking
│   │   │   ├── measurements/  # Measurement management
│   │   │   ├── tailor/    # Tailor dashboard
│   │   │   └── admin/     # Admin dashboard
│   │   ├── components/    # Reusable components
│   │   ├── lib/          # Utilities and API client
│   │   ├── hooks/        # Custom React hooks
│   │   └── styles/       # Global styles
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docs/                  # Documentation
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml    # Production compose file
├── docker-compose.dev.yml  # Development compose file
└── package.json          # Root package.json
```

## Database Schema

### Core Entities

**Users**
- Authentication and profile information
- Roles: customer, tailor, admin
- Support for multiple auth providers

**Measurements**
- Encrypted measurement data
- Multiple templates (shirts, pants, kurta, etc.)
- Consent tracking and access logs

**Shops**
- Tailor shop details and capacity
- Service categories and working hours
- Rating and review system

**Products**
- Shop catalog items
- Customization options (fabric, color, etc.)
- Pricing and measurement requirements

**Orders**
- Complete order lifecycle
- Status tracking and timeline
- Delivery/pickup options

**Payments**
- Payment transactions
- Stripe integration
- Refund handling

**Messages**
- Real-time chat between customers and tailors
- Order-specific conversations

## API Documentation

Once the backend is running, access the interactive API documentation at:
```
http://localhost:3000/api/docs
```

### Key Endpoints

**Authentication**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login

**Measurements**
- `GET /api/measurements` - Get all measurements
- `POST /api/measurements` - Create new measurement
- `PUT /api/measurements/:id` - Update measurement
- `DELETE /api/measurements/:id` - Delete measurement

**Shops**
- `GET /api/shops` - Browse shops
- `GET /api/shops/:id` - Get shop details
- `POST /api/shops` - Create shop (tailor only)

**Orders**
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get customer orders
- `PATCH /api/orders/:id/status` - Update order status

## Development

### Running Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

### Code Quality

Lint backend:
```bash
cd backend
npm run lint
```

Lint frontend:
```bash
cd frontend
npm run lint
```

### Database Migrations

Generate migration:
```bash
cd backend
npm run migration:generate -- -n MigrationName
```

Run migrations:
```bash
npm run migration:run
```

## Deployment

### Docker Production Deployment

1. Update environment variables in `docker-compose.yml`
2. Build and start:
```bash
docker-compose up -d
```

### Environment Variables (Production)

**Critical Security Settings:**
- `JWT_SECRET`: Use a strong random string (32+ characters)
- `JWT_REFRESH_SECRET`: Different from JWT_SECRET
- `ENCRYPTION_KEY`: Exactly 32 characters for AES-256
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

## Security Considerations

1. **Measurement Encryption**: All sensitive measurement data is encrypted at rest using AES-256
2. **Access Control**: Role-based access control (RBAC) for all endpoints
3. **Audit Logging**: Track measurement access for compliance
4. **Input Validation**: Comprehensive validation using class-validator
5. **Rate Limiting**: Protection against brute force attacks
6. **HTTPS Only**: Enforce HTTPS in production
7. **CORS**: Configure allowed origins properly

## Scaling Considerations

### Database
- Use connection pooling
- Add read replicas for read-heavy operations
- Implement caching with Redis

### Application
- Deploy multiple backend instances behind a load balancer
- Use Redis for session storage
- Implement CDN for static assets

### Real-time
- Use Redis adapter for Socket.IO clustering
- Consider separate WebSocket server

## Monitoring

Recommended monitoring tools:
- **Application**: Sentry for error tracking
- **Performance**: New Relic or Datadog
- **Logs**: ELK Stack or CloudWatch
- **Uptime**: UptimeRobot or Pingdom

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [Wiki or Docs folder]

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Measurement OCR/AI
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Coupon and referral system
- [ ] Video consultations
- [ ] AR fitting room

---

Built with ❤️ for the tailoring industry
