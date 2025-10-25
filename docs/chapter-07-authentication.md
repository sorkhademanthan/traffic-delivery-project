# SwiftRoute — Chapter 7: Authentication & User Management

Purpose: Implement secure JWT-based authentication for admin users.

---

## Overview

We'll build:
1. **User Registration** - Create admin accounts
2. **User Login** - JWT token generation
3. **Authentication Middleware** - Protect routes
4. **Password Security** - Bcrypt hashing
5. **Token Management** - JWT creation and validation

---

## Step 1: Install Additional Dependencies

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

# Install if not already installed
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

---

## Step 2: Create Authentication Utilities

### 2.1 Password Hashing Utility

Create `backend/src/utils/password.ts`:

```typescript
// filepath: backend/src/utils/password.ts
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
```

### 2.2 JWT Token Utility

Create `backend/src/utils/jwt.ts`:

```typescript
// filepath: backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
```

---

## Step 3: Create Authentication Middleware

Create `backend/src/middleware/auth.ts`:

```typescript
// filepath: backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
```

---

## Step 4: Create Auth Controller

Create `backend/src/controllers/authController.ts`:

```typescript
// filepath: backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
```

---

## Step 5: Create Auth Routes

Create `backend/src/routes/authRoutes.ts`:

```typescript
// filepath: backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;
```

---

## Step 6: Update server.ts to Include Auth Routes

Update `backend/src/server.ts`:

```typescript
// filepath: backend/src/server.ts
// ...existing code...
import authRoutes from './routes/authRoutes';

// ...existing code...

// API routes
app.use('/api/auth', authRoutes);

// ...existing code...
```

---

## Step 7: Create Seed Data with Admin User

Update `backend/prisma/seed.ts`:

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
      priority: 'NORMAL' as const,
    },
    {
      orderNumber: 'ORD-002',
      customerName: 'Bob Smith',
      customerPhone: '+1234567801',
      address: '456 Oak Ave',
      city: 'New York',
      postalCode: '10002',
      priority: 'HIGH' as const,
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

### Run the seed:

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

npm run db:seed
```

---

## Step 8: Test Authentication

### 8.1 Restart the server

```bash
npm run dev
```

### 8.2 Test with cURL or Postman

**Register a new user:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@swiftroute.com",
    "password": "test123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@swiftroute.com",
    "password": "admin123"
  }'
```

Save the token from the response!

**Get Profile (Protected Route):**
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Step 9: Update .env with Strong JWT Secret

### /Users/manthansorkhade/Desktop/projects/traffic-delivery-project/backend/.env

```properties
// filepath: /Users/manthansorkhade/Desktop/projects/traffic-delivery-project/backend/.env
# ...existing code...

# JWT
JWT_SECRET=swiftroute-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# ...existing code...
```

---

## Verification Checklist

✅ **Authentication Setup:**
- [ ] Password hashing utility created
- [ ] JWT token utility created
- [ ] Authentication middleware created
- [ ] Auth controller with register/login/profile
- [ ] Auth routes configured
- [ ] Server updated to use auth routes

✅ **Testing:**
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Receive JWT token on login
- [ ] Can access protected route with token
- [ ] Cannot access protected route without token

✅ **Database:**
- [ ] Seed data includes admin user
- [ ] Can login with seeded admin credentials

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get token |
| GET | `/api/auth/profile` | Yes | Get current user profile |

---

## Next Steps

✅ **Chapter 7 Complete**: Authentication implemented  
🔜 **Chapter 8**: Order Management API (CRUD operations)  
🔜 **Chapter 9**: Driver Management API  
🔜 **Chapter 10**: Route Management & Optimization

---

**Test all endpoints and confirm everything works before moving to Chapter 8!** 🔐