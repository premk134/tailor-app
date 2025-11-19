# Architecture Documentation

## System Overview

The Tailor App is a full-stack marketplace platform built with a microservices-inspired modular architecture.

## High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Web Frontend   │◄────────│   API Gateway    │
│   (Next.js)     │         │    (NestJS)      │
│                 │         │                  │
└────────┬────────┘         └─────────┬────────┘
         │                            │
         │                            │
         │  WebSocket                 │  HTTP/REST
         │                            │
         │                  ┌─────────▼────────┐
         │                  │                  │
         │                  │  Business Logic  │
         │                  │   (Modules)      │
         │                  │                  │
         │                  └─────────┬────────┘
         │                            │
         │                   ┌────────┼────────┐
         │                   │        │        │
    ┌────▼────┐      ┌──────▼──┐  ┌──▼────┐ ┌─▼────────┐
    │         │      │         │  │       │ │          │
    │ Socket  │      │  Auth   │  │  DB   │ │ External │
    │  Server │      │ Service │  │ (PG)  │ │   APIs   │
    │         │      │         │  │       │ │ (Stripe) │
    └─────────┘      └─────────┘  └───────┘ └──────────┘
```

## Core Components

### 1. Frontend Layer (Next.js)

**Responsibilities:**
- Server-side rendering (SSR) for SEO
- Client-side routing
- State management (Zustand)
- API communication
- Real-time updates via WebSocket

**Key Features:**
- App Router for modern routing
- TypeScript for type safety
- Tailwind CSS for styling
- Form validation with React Hook Form

### 2. Backend Layer (NestJS)

**Responsibilities:**
- RESTful API endpoints
- Business logic processing
- Data validation
- Authentication & authorization
- Real-time communication

**Architecture Pattern:**
- Modular architecture (feature modules)
- Dependency injection
- Guards and interceptors
- DTO validation

**Modules:**

```
app.module
├── auth.module
│   ├── JWT Strategy
│   ├── Password hashing
│   └── Token management
├── users.module
│   └── Profile management
├── measurements.module
│   ├── Encryption service
│   ├── Audit logging
│   └── Consent management
├── shops.module
│   ├── Shop onboarding
│   └── Capacity management
├── products.module
│   └── Catalog management
├── orders.module
│   ├── Order routing
│   ├── Status tracking
│   └── Event logging
├── payments.module
│   ├── Stripe integration
│   └── Webhook handling
├── chat.module
│   ├── WebSocket gateway
│   └── Message persistence
└── admin.module
    ├── Shop approvals
    └── Analytics
```

### 3. Database Layer (PostgreSQL)

**Schema Design:**
- Normalized relational design
- Proper indexing for performance
- Foreign key constraints
- JSONB for flexible data

**Key Tables:**
- `users` - User accounts and profiles
- `measurements` - Encrypted measurement data
- `shops` - Tailor shop information
- `products` - Product catalog
- `orders` - Order records
- `order_events` - Order timeline
- `payments` - Payment transactions
- `messages` - Chat messages
- `audit_logs` - Access tracking

## Data Flow

### 1. Customer Order Flow

```
Customer → Frontend
    ↓
Select Shop & Product
    ↓
Choose/Create Measurement
    ↓
Submit Order (API Call)
    ↓
Backend validates
    ↓
Check shop capacity
    ↓
Create order record
    ↓
Notify shop (WebSocket)
    ↓
Create payment intent
    ↓
Return to customer
    ↓
Customer pays
    ↓
Webhook confirms payment
    ↓
Update order status
    ↓
Notify customer (WebSocket)
```

### 2. Measurement Encryption Flow

```
Customer enters measurements
    ↓
Frontend sends to API
    ↓
Backend validates data
    ↓
Encryption Service encrypts JSON
    ↓
Store encrypted blob in DB
    ↓
Create audit log entry
    ↓
Return success
    ↓
When accessed:
    ↓
Check permissions & consent
    ↓
Decrypt data
    ↓
Log access
    ↓
Return decrypted measurements
```

## Security Architecture

### Authentication Flow

```
User credentials → Backend
    ↓
Validate credentials
    ↓
Generate JWT tokens
    ↓
    ├─ Access Token (15 min)
    └─ Refresh Token (7 days)
    ↓
Return to client
    ↓
Store in localStorage
    ↓
Include in API requests
    ↓
JWT Guard validates
    ↓
Extract user from token
    ↓
Check role permissions
    ↓
Allow/Deny access
```

### Data Protection Layers

1. **Transport Layer**: HTTPS/TLS
2. **Application Layer**: JWT authentication
3. **Database Layer**: Encrypted sensitive fields
4. **Access Layer**: RBAC and audit logs

## Real-time Architecture

### WebSocket Communication

```
Client connects → Socket.IO Gateway
    ↓
Authenticate connection
    ↓
Join user-specific room
    ↓
Listen for events:
    ├─ Order status updates
    ├─ New messages
    └─ Payment confirmations
    ↓
Emit to specific rooms
    ↓
Client receives update
    ↓
Update UI
```

## Scalability Considerations

### Horizontal Scaling

**Application Tier:**
- Stateless backend allows multiple instances
- Load balancer distributes traffic
- Redis for session management

**Database Tier:**
- Read replicas for queries
- Connection pooling
- Partitioning for large tables

**WebSocket Tier:**
- Redis adapter for Socket.IO clustering
- Sticky sessions for WebSocket connections

### Caching Strategy

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
   ┌───▼────┐
   │ Redis  │  ← Check cache
   │ Cache  │
   └───┬────┘
       │
    Hit?──No──► ┌──────────┐
       │        │ Database │
      Yes       └─────┬────┘
       │              │
       │        Cache result
       │              │
       └──────────────┘
              ▼
       Return to client
```

## Deployment Architecture

### Development

```
Developer Machine
├── Backend (localhost:3000)
├── Frontend (localhost:3001)
└── PostgreSQL (Docker)
```

### Production

```
Load Balancer
    ↓
┌───────────────────┐
│  Backend Cluster  │
│  (3+ instances)   │
└───────┬───────────┘
        │
┌───────▼──────────────┐
│   Database Cluster   │
│  Primary + Replicas  │
└──────────────────────┘
        │
┌───────▼───────┐
│  File Storage │
│  (S3/CDN)     │
└───────────────┘
```

## API Design Patterns

### RESTful Conventions

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT/PATCH**: Update resources
- **DELETE**: Remove resources

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

## Monitoring & Observability

### Logging Levels

1. **ERROR**: System errors and exceptions
2. **WARN**: Warning conditions
3. **INFO**: General information
4. **DEBUG**: Detailed debugging information

### Metrics to Track

- Request latency
- Database query performance
- Error rates
- Active WebSocket connections
- Order conversion rates
- Payment success rates

## Performance Optimization

### Backend
- Database query optimization
- Caching frequently accessed data
- Pagination for large datasets
- Connection pooling
- Async processing for heavy operations

### Frontend
- Code splitting
- Image optimization
- SSR for initial load
- Client-side caching
- Lazy loading

## Future Enhancements

1. **Microservices**: Split into smaller services
2. **Event Sourcing**: For complete order history
3. **CQRS**: Separate read/write models
4. **GraphQL**: Flexible data fetching
5. **Service Mesh**: For service-to-service communication
