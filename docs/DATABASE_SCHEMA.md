# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   Users     │────────<│ Measurements │
└──────┬──────┘         └──────────────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│    Shops    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│  Products   │
└─────────────┘

┌─────────────┐         ┌──────────────┐
│   Users     │────────<│   Orders     │
│ (Customer)  │         └──────┬───────┘
└─────────────┘                │
                               │
┌─────────────┐                │
│    Shops    │───────────────<│
└─────────────┘                │
                               │
┌──────────────┐               │
│ Measurements │──────────────<│
└──────────────┘               │
                               │
                        ┌──────▼──────┐
                        │   Payments  │
                        └─────────────┘
                               │
                        ┌──────▼──────────┐
                        │  Order Events   │
                        └─────────────────┘
```

## Tables

### users

Stores user account information for customers, tailors, and admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR | NULLABLE | User's full name |
| email | VARCHAR | UNIQUE, NOT NULL | Email address |
| phone | VARCHAR | UNIQUE, NULLABLE | Phone number |
| password | VARCHAR | NULLABLE | Hashed password |
| role | ENUM | NOT NULL, DEFAULT 'customer' | User role (customer, tailor, admin) |
| authProvider | ENUM | NOT NULL, DEFAULT 'local' | Auth provider (local, google, apple) |
| googleId | VARCHAR | NULLABLE | Google OAuth ID |
| appleId | VARCHAR | NULLABLE | Apple OAuth ID |
| avatar | VARCHAR | NULLABLE | Avatar URL |
| emailVerified | BOOLEAN | DEFAULT false | Email verification status |
| phoneVerified | BOOLEAN | DEFAULT false | Phone verification status |
| isActive | BOOLEAN | DEFAULT true | Account active status |
| preferences | JSONB | NULLABLE | User preferences |
| lastLoginAt | TIMESTAMP | NULLABLE | Last login timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_phone` on `phone`
- `idx_users_role` on `role`

### measurements

Stores encrypted customer measurement profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FOREIGN KEY → users.id | Owner of measurements |
| name | VARCHAR | NOT NULL | Measurement profile name |
| templateType | ENUM | NOT NULL | Template type (mens_shirt, womens_blouse, etc.) |
| unit | ENUM | DEFAULT 'cm' | Measurement unit (cm, inch) |
| encryptedData | TEXT | NOT NULL | Encrypted measurement values |
| photos | TEXT[] | DEFAULT [] | Photo URLs |
| notes | TEXT | NULLABLE | Additional notes |
| consentGiven | BOOLEAN | DEFAULT true | Consent to share with tailors |
| isDefault | BOOLEAN | DEFAULT false | Default measurement profile |
| lastUsedAt | TIMESTAMP | NULLABLE | Last used timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_measurements_user` on `userId`
- `idx_measurements_template` on `templateType`

### shops

Stores tailor shop information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| ownerId | UUID | FOREIGN KEY → users.id | Shop owner |
| name | VARCHAR | NOT NULL | Shop name |
| description | TEXT | NULLABLE | Shop description |
| address | TEXT | NULLABLE | Physical address |
| latitude | DECIMAL(10,7) | NULLABLE | Latitude coordinate |
| longitude | DECIMAL(10,7) | NULLABLE | Longitude coordinate |
| city | VARCHAR | NULLABLE | City |
| state | VARCHAR | NULLABLE | State/Province |
| country | VARCHAR | NULLABLE | Country |
| pincode | VARCHAR | NULLABLE | Postal code |
| phone | VARCHAR | NULLABLE | Contact phone |
| email | VARCHAR | NULLABLE | Contact email |
| status | ENUM | DEFAULT 'pending_approval' | Shop status |
| categories | ENUM[] | DEFAULT [] | Service categories |
| images | TEXT[] | DEFAULT [] | Shop image URLs |
| workingHours | JSONB | NULLABLE | Working hours by day |
| maxConcurrentOrders | INTEGER | DEFAULT 10 | Max simultaneous orders |
| rating | DECIMAL(3,2) | DEFAULT 0 | Average rating |
| totalReviews | INTEGER | DEFAULT 0 | Total review count |
| acceptingOrders | BOOLEAN | DEFAULT true | Currently accepting orders |
| paymentMethods | JSONB | NULLABLE | Accepted payment methods |
| bankDetails | TEXT | NULLABLE | Encrypted bank details |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_shops_owner` on `ownerId`
- `idx_shops_status` on `status`
- `idx_shops_city` on `city`
- `idx_shops_location` on `latitude, longitude` (GIS index)

### products

Stores shop product/service catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| shopId | UUID | FOREIGN KEY → shops.id | Associated shop |
| name | VARCHAR | NOT NULL | Product name |
| description | TEXT | NULLABLE | Product description |
| type | ENUM | DEFAULT 'standard' | Product type (standard, custom) |
| basePrice | DECIMAL(10,2) | NOT NULL | Base price |
| images | TEXT[] | DEFAULT [] | Product image URLs |
| options | JSONB | NULLABLE | Customization options |
| measurementTemplate | ENUM | NULLABLE | Required measurement template |
| requiredMeasurements | TEXT[] | DEFAULT [] | Required measurement fields |
| isActive | BOOLEAN | DEFAULT true | Product active status |
| orderCount | INTEGER | DEFAULT 0 | Total orders count |
| estimatedDays | INTEGER | DEFAULT 5 | Estimated completion days |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_products_shop` on `shopId`
- `idx_products_active` on `isActive`

### orders

Stores customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| customerId | UUID | FOREIGN KEY → users.id | Customer |
| shopId | UUID | FOREIGN KEY → shops.id | Shop |
| measurementId | UUID | FOREIGN KEY → measurements.id | Measurement profile |
| status | ENUM | DEFAULT 'created' | Order status |
| items | JSONB | NOT NULL | Order items with options |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal amount |
| tax | DECIMAL(10,2) | DEFAULT 0 | Tax amount |
| deliveryCharge | DECIMAL(10,2) | DEFAULT 0 | Delivery fee |
| discount | DECIMAL(10,2) | DEFAULT 0 | Discount amount |
| totalAmount | DECIMAL(10,2) | NOT NULL | Total amount |
| paymentStatus | ENUM | DEFAULT 'pending' | Payment status |
| deliveryType | ENUM | DEFAULT 'pickup' | Delivery type (pickup, delivery) |
| deliveryAddress | JSONB | NULLABLE | Delivery address |
| scheduledFor | TIMESTAMP | NULLABLE | Scheduled date |
| confirmedAt | TIMESTAMP | NULLABLE | Confirmation timestamp |
| completedAt | TIMESTAMP | NULLABLE | Completion timestamp |
| cancelledAt | TIMESTAMP | NULLABLE | Cancellation timestamp |
| customerNotes | TEXT | NULLABLE | Customer notes |
| tailorNotes | TEXT | NULLABLE | Tailor notes |
| attachments | TEXT[] | DEFAULT [] | Attachment URLs |
| rating | INTEGER | NULLABLE | Customer rating (1-5) |
| review | TEXT | NULLABLE | Customer review |
| reviewedAt | TIMESTAMP | NULLABLE | Review timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_orders_customer` on `customerId`
- `idx_orders_shop` on `shopId`
- `idx_orders_status` on `status`
- `idx_orders_created` on `createdAt`

### order_events

Stores order timeline events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| orderId | UUID | FOREIGN KEY → orders.id | Associated order |
| eventType | ENUM | NOT NULL | Event type |
| actorId | UUID | FOREIGN KEY → users.id | User who triggered event |
| payload | JSONB | NULLABLE | Event data |
| description | TEXT | NULLABLE | Event description |
| createdAt | TIMESTAMP | NOT NULL | Event timestamp |

**Indexes:**
- `idx_order_events_order` on `orderId`
- `idx_order_events_created` on `createdAt`

### payments

Stores payment transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| orderId | UUID | FOREIGN KEY → orders.id | Associated order |
| provider | ENUM | NOT NULL | Payment provider (stripe, razorpay, cash) |
| providerChargeId | VARCHAR | NULLABLE | Provider transaction ID |
| providerPaymentIntentId | VARCHAR | NULLABLE | Provider payment intent ID |
| paymentMethod | ENUM | NOT NULL | Payment method type |
| status | ENUM | DEFAULT 'pending' | Payment status |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| refundedAmount | DECIMAL(10,2) | DEFAULT 0 | Refunded amount |
| currency | VARCHAR | DEFAULT 'INR' | Currency code |
| metadata | JSONB | NULLABLE | Additional metadata |
| failureReason | TEXT | NULLABLE | Failure reason |
| paidAt | TIMESTAMP | NULLABLE | Payment timestamp |
| refundedAt | TIMESTAMP | NULLABLE | Refund timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_payments_order` on `orderId`
- `idx_payments_provider_id` on `providerChargeId`

### messages

Stores chat messages between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| fromId | UUID | FOREIGN KEY → users.id | Message sender |
| toId | UUID | FOREIGN KEY → users.id | Message recipient |
| orderId | UUID | FOREIGN KEY → orders.id, NULLABLE | Related order |
| text | TEXT | NOT NULL | Message text |
| attachments | TEXT[] | DEFAULT [] | Attachment URLs |
| isRead | BOOLEAN | DEFAULT false | Read status |
| readAt | TIMESTAMP | NULLABLE | Read timestamp |
| createdAt | TIMESTAMP | NOT NULL | Creation timestamp |

**Indexes:**
- `idx_messages_order` on `orderId`
- `idx_messages_conversation` on `fromId, toId, createdAt`

### audit_logs

Stores audit trail for compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| actorId | UUID | FOREIGN KEY → users.id, NULLABLE | User who performed action |
| action | ENUM | NOT NULL | Action type |
| targetType | ENUM | NOT NULL | Target entity type |
| targetId | UUID | NOT NULL | Target entity ID |
| details | JSONB | NULLABLE | Action details |
| ipAddress | VARCHAR | NULLABLE | Client IP address |
| userAgent | VARCHAR | NULLABLE | Client user agent |
| createdAt | TIMESTAMP | NOT NULL | Action timestamp |

**Indexes:**
- `idx_audit_logs_actor` on `actorId`
- `idx_audit_logs_target` on `targetType, targetId`
- `idx_audit_logs_created` on `createdAt`

## Enums

### UserRole
- `customer` - Regular customer
- `tailor` - Tailor/shop owner
- `admin` - Platform administrator

### AuthProvider
- `local` - Email/password authentication
- `google` - Google OAuth
- `apple` - Apple Sign In

### MeasurementTemplate
- `mens_shirt` - Men's shirt measurements
- `mens_pants` - Men's pants measurements
- `mens_kurta` - Men's kurta measurements
- `mens_suit` - Men's suit measurements
- `womens_blouse` - Women's blouse measurements
- `womens_kurti` - Women's kurti measurements
- `womens_saree_blouse` - Women's saree blouse measurements
- `womens_salwar` - Women's salwar measurements
- `womens_dress` - Women's dress measurements
- `custom` - Custom template

### OrderStatus
- `created` - Order created
- `pending_confirmation` - Awaiting shop confirmation
- `confirmed` - Shop confirmed order
- `in_production` - Being tailored
- `ready_for_pickup` - Ready for customer pickup
- `out_for_delivery` - Out for delivery
- `delivered` - Delivered to customer
- `completed` - Order completed
- `cancelled` - Order cancelled
- `refunded` - Order refunded

## Data Integrity

### Foreign Key Constraints
All foreign key relationships enforce CASCADE on delete for:
- measurements → users
- products → shops
- order_events → orders
- payments → orders

### Triggers
- Update `updatedAt` timestamp on record modification
- Update shop rating on new review
- Increment/decrement order counts

### Constraints
- Email uniqueness
- Phone uniqueness
- Only one default measurement per user
- Positive prices and amounts
- Valid enum values
