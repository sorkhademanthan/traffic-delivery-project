# SwiftRoute — Chapter 6: Database Schema Design with Prisma

Purpose: Design and implement the database schema for orders, drivers, routes, and delivery tracking.

---

## Overview

We'll use **Prisma ORM** for:
- Type-safe database queries
- Automatic migrations
- Schema versioning
- Easy relationship management

**Database**: PostgreSQL (running via Docker or locally)

---

## Core Entities

1. **Users** - Admin accounts for the web portal
2. **Drivers** - Delivery personnel
3. **Orders** - Customer delivery orders
4. **Routes** - Optimized delivery routes
5. **RouteStops** - Individual stops within a route
6. **DeliveryAttempts** - Delivery attempt history
7. **AuditLogs** - System activity tracking

---

## Step 1: Initialize Prisma

### 1.1 Install Prisma CLI

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

# Already installed in Chapter 5, but verify
npm list prisma @prisma/client

# If not installed:
npm install --save-dev prisma
npm install @prisma/client
```

### 1.2 Initialize Prisma

```bash
# Initialize Prisma (creates prisma folder and schema file)
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Updated with DATABASE_URL (already exists)

### 1.3 Verify DATABASE_URL

Check `backend/.env`:
```bash
DATABASE_URL="postgresql://swiftroute_user:dev_password@localhost:5432/swiftroute_dev"
```

---

## Step 2: Define Database Schema

### 2.1 Update Prisma Schema

Edit `backend/prisma/schema.prisma`:

```prisma
// filepath: backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed password
  name      String
  role      UserRole @default(ADMIN)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  auditLogs AuditLog[]

  @@map("users")
}

enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

// ============================================
// DRIVERS
// ============================================

model Driver {
  id          String       @id @default(cuid())
  name        String
  email       String       @unique
  phone       String
  licenseNo   String?
  vehicleType VehicleType  @default(VAN)
  status      DriverStatus @default(AVAILABLE)
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  routes Route[]

  @@map("drivers")
}

enum VehicleType {
  BIKE
  SCOOTER
  CAR
  VAN
  TRUCK
}

enum DriverStatus {
  AVAILABLE
  ON_ROUTE
  OFF_DUTY
  UNAVAILABLE
}

// ============================================
// ORDERS
// ============================================

model Order {
  id                String      @id @default(cuid())
  orderNumber       String      @unique
  customerName      String
  customerPhone     String
  customerEmail     String?
  address           String
  addressLine2      String?
  city              String
  postalCode        String
  latitude          Float?
  longitude         Float?
  deliveryNotes     String?
  orderValue        Float?
  priority          Priority    @default(NORMAL)
  timeWindow        String? // e.g., "09:00-12:00"
  status            OrderStatus @default(PENDING)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  routeStop         RouteStop?
  deliveryAttempts  DeliveryAttempt[]

  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum OrderStatus {
  PENDING       // Not yet assigned to route
  ASSIGNED      // Assigned to route but not started
  IN_TRANSIT    // Driver is on the way
  DELIVERED     // Successfully delivered
  FAILED        // Delivery failed
  CANCELLED     // Order cancelled
}

// ============================================
// ROUTES & STOPS
// ============================================

model Route {
  id                String      @id @default(cuid())
  routeNumber       String      @unique
  driverId          String
  date              DateTime    @default(now())
  status            RouteStatus @default(PENDING)
  totalDistance     Float?      // in kilometers
  estimatedDuration Int?        // in minutes
  actualDuration    Int?        // in minutes
  startTime         DateTime?
  endTime           DateTime?
  notes             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  driver            Driver      @relation(fields: [driverId], references: [id])
  stops             RouteStop[]

  @@index([driverId])
  @@index([date])
  @@index([status])
  @@map("routes")
}

enum RouteStatus {
  PENDING       // Created but not started
  IN_PROGRESS   // Driver is actively delivering
  COMPLETED     // All stops completed
  CANCELLED     // Route cancelled
  PARTIAL       // Some stops completed, route ended early
}

model RouteStop {
  id              String         @id @default(cuid())
  routeId         String
  orderId         String         @unique
  sequence        Int            // Stop order in route
  status          StopStatus     @default(PENDING)
  estimatedTime   DateTime?      // ETA for this stop
  actualTime      DateTime?      // Actual arrival/completion time
  distanceFromPrevious Float?    // Distance from previous stop (km)
  durationFromPrevious Int?      // Duration from previous stop (minutes)
  latitude        Float?
  longitude       Float?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  route           Route          @relation(fields: [routeId], references: [id], onDelete: Cascade)
  order           Order          @relation(fields: [orderId], references: [id])

  @@index([routeId])
  @@index([status])
  @@map("route_stops")
}

enum StopStatus {
  PENDING       // Not yet reached
  EN_ROUTE      // Driver heading to this stop
  ARRIVED       // Driver arrived at location
  DELIVERED     // Successfully delivered
  FAILED        // Delivery failed
  SKIPPED       // Stop skipped
}

// ============================================
// DELIVERY ATTEMPTS
// ============================================

model DeliveryAttempt {
  id          String         @id @default(cuid())
  orderId     String
  attemptedAt DateTime       @default(now())
  result      AttemptResult
  reason      String?        // Reason for failure
  notes       String?
  photoUrl    String?        // Proof of delivery photo
  signatureUrl String?       // Signature image
  latitude    Float?
  longitude   Float?

  order       Order          @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("delivery_attempts")
}

enum AttemptResult {
  SUCCESS
  FAILED_NO_ANSWER
  FAILED_WRONG_ADDRESS
  FAILED_REFUSED
  FAILED_OTHER
}

// ============================================
// AUDIT LOGS
// ============================================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // e.g., "ORDER_CREATED", "ROUTE_DISPATCHED"
  entityType  String   // e.g., "Order", "Route"
  entityId    String?
  details     Json?    // Additional structured data
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## Step 3: Create Migration

### 3.1 Generate and Apply Migration

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

# Create migration (creates SQL files)
npx prisma migrate dev --name init

# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply migration to database
# 3. Generate Prisma Client
```

### 3.2 Verify Database Tables

```bash
# Connect to database
psql -h localhost -U swiftroute_user -d swiftroute_dev

# List all tables
\dt

# You should see:
# - users
# - drivers
# - orders
# - routes
# - route_stops
# - delivery_attempts
# - audit_logs

# Describe a table
\d orders

# Exit
\q
```

---

## Step 4: Generate Prisma Client

```bash
# Generate TypeScript client
npx prisma generate

# This creates type-safe database client at node_modules/@prisma/client
```

---

## Step 5: Create Database Service

### 5.1 Create Prisma Client Instance

Create `backend/src/config/database.ts`:

```typescript
// filepath: backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### 5.2 Test Database Connection

Create `backend/src/utils/testDb.ts`:

```typescript
// filepath: backend/src/utils/testDb.ts
import prisma from '../config/database';

export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const driverCount = await prisma.driver.count();
    
    console.log(`📊 Database stats:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Drivers: ${driverCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

### 5.3 Update server.ts to Test Connection

Update `backend/src/server.ts`:

```typescript
// filepath: backend/src/server.ts
// ...existing code...
import { testDatabaseConnection } from './utils/testDb';

// ...existing code...

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 SwiftRoute Backend API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Root: http://localhost:${PORT}/`);
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
  
  // Test database connection
  await testDatabaseConnection();
});

// ...existing code...
```

---

## Step 6: Create Seed Data (Optional)

### 6.1 Create Seed Script

Create `backend/prisma/seed.ts`:

```typescript
// filepath: backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@swiftroute.com' },
    update: {},
    create: {
      email: 'admin@swiftroute.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample drivers
  const driver1 = await prisma.driver.upsert({
    where: { email: 'driver1@swiftroute.com' },
    update: {},
    create: {
      name: 'John Driver',
      email: 'driver1@swiftroute.com',
      phone: '+1234567890',
      vehicleType: 'VAN',
      status: 'AVAILABLE',
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { email: 'driver2@swiftroute.com' },
    update: {},
    create: {
      name: 'Jane Wheeler',
      email: 'driver2@swiftroute.com',
      phone: '+1234567891',
      vehicleType: 'CAR',
      status: 'AVAILABLE',
    },
  });
  console.log('✅ Created drivers:', driver1.name, driver2.name);

  // Create sample orders
  const sampleOrders = [
    {
      orderNumber: 'ORD-001',
      customerName: 'Alice Johnson',
      customerPhone: '+1234567800',
      address: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      priority: 'NORMAL',
    },
    {
      orderNumber: 'ORD-002',
      customerName: 'Bob Smith',
      customerPhone: '+1234567801',
      address: '456 Oak Ave',
      city: 'New York',
      postalCode: '10002',
      priority: 'HIGH',
    },
    {
      orderNumber: 'ORD-003',
      customerName: 'Carol White',
      customerPhone: '+1234567802',
      address: '789 Pine Rd',
      city: 'New York',
      postalCode: '10003',
      priority: 'URGENT',
    },
  ];

  for (const orderData of sampleOrders) {
    await prisma.order.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: orderData,
    });
  }
  console.log(`✅ Created ${sampleOrders.length} sample orders`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6.2 Add Seed Script to package.json

Update `backend/package.json`:

```json
// filepath: backend/package.json
{
  // ...existing code...
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "dev:direct": "ts-node src/server.ts",
    "dev:clean": "lsof -ti:5000 | xargs kill -9 2>/dev/null; npm run dev",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:seed": "npx prisma db seed",
    "db:studio": "npx prisma studio",
    "db:reset": "npx prisma migrate reset"
  },
  // ...existing code...
}
```

### 6.3 Run Seed

```bash
npm run db:seed
```

---

## Step 7: Explore Database with Prisma Studio

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# Opens at http://localhost:5555
# You can view and edit data visually
```

---

## Verification Checklist

✅ **Database Schema:**
- [ ] Prisma initialized
- [ ] Schema defined with all models
- [ ] Migration created and applied
- [ ] Prisma Client generated

✅ **Database Connection:**
- [ ] Database service created
- [ ] Connection tested in server.ts
- [ ] Seed data created (optional)

✅ **Tools:**
- [ ] Prisma Studio accessible
- [ ] Can query database from code

---

## Next Steps

✅ **Chapter 6 Complete**: Database schema ready  
🔜 **Chapter 7**: Authentication & Authorization  
🔜 **Chapter 8**: Order Management API (CRUD)  
🔜 **Chapter 9**: Driver Management API  
🔜 **Chapter 10**: Route Optimization Service

---

## Common Commands Reference

```bash
# Prisma Commands
npx prisma migrate dev        # Create and apply migration
npx prisma migrate reset      # Reset database (careful!)
npx prisma generate           # Regenerate Prisma Client
npx prisma studio             # Open GUI
npx prisma db seed            # Run seed script
npx prisma db push            # Push schema without migration (dev only)

# Database Connection
psql -h localhost -U swiftroute_user -d swiftroute_dev

# Inside psql
\dt                           # List tables
\d table_name                 # Describe table
SELECT * FROM users;          # Query
\q                            # Quit
```

---

**Ready to start building?** In Chapter 7, we'll implement authentication and create our first API endpoints! 🔐