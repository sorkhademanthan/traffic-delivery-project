# SwiftRoute — Chapter 9: Driver Management API

Purpose: Build complete CRUD operations for driver management with status tracking and availability management.

---

## Overview

We'll build:
1. **Create Driver** - Add new driver to the system
2. **Get Drivers** - List with filtering, pagination, search
3. **Get Driver by ID** - Single driver details
4. **Update Driver** - Edit driver information
5. **Delete Driver** - Remove driver
6. **Driver Status Management** - Update availability and status
7. **Driver Statistics** - Dashboard metrics

---

## Tasks Checklist

### Phase 1: Backend Setup
- [ ] Create driver controller (`src/controllers/driverController.ts`)
- [ ] Create driver routes (`src/routes/driverRoutes.ts`)
- [ ] Update server.ts to include driver routes
- [ ] Test all CRUD endpoints

### Phase 2: Testing
- [ ] Test create driver
- [ ] Test get all drivers
- [ ] Test get driver by ID
- [ ] Test update driver
- [ ] Test delete driver
- [ ] Test driver statistics
- [ ] Test status updates

### Phase 3: Documentation
- [ ] Document all API endpoints
- [ ] Create Postman collection
- [ ] Add sample requests and responses

---

## Step 1: Create Driver Controller

Create `backend/src/controllers/driverController.ts`:

```typescript
// filepath: backend/src/controllers/driverController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma, DriverStatus, VehicleType } from '@prisma/client';

// Create new driver
export const createDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      licenseNo,
      vehicleType,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      res.status(400).json({ error: 'Name, email, and phone are required' });
      return;
    }

    // Check if email already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { email },
    });

    if (existingDriver) {
      res.status(409).json({ error: 'Driver with this email already exists' });
      return;
    }

    // Create driver
    const driver = await prisma.driver.create({
      data: {
        name,
        email,
        phone,
        licenseNo: licenseNo || null,
        vehicleType: (vehicleType as VehicleType) || VehicleType.VAN,
        status: DriverStatus.AVAILABLE,
        isActive: true,
      },
    });

    res.status(201).json({
      message: 'Driver created successfully',
      driver,
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

// Get all drivers with filtering and pagination
export const getDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      vehicleType,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: Prisma.DriverWhereInput = {};

    if (status) where.status = status as DriverStatus;
    if (vehicleType) where.vehicleType = vehicleType as VehicleType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get drivers with pagination
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          routes: {
            where: {
              status: 'IN_PROGRESS',
            },
            take: 1,
          },
        },
      }),
      prisma.driver.count({ where }),
    ]);

    res.json({
      drivers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// Get single driver by ID
export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        routes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            stops: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    });

    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    res.json({ driver });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

// Update driver
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    // If email is being updated, check if it's already in use
    if (updateData.email && updateData.email !== existingDriver.email) {
      const emailExists = await prisma.driver.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        res.status(409).json({ error: 'Email already in use by another driver' });
        return;
      }
    }

    // Update driver
    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

// Delete driver
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
      include: {
        routes: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    if (!existingDriver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    // Check if driver has active routes
    if (existingDriver.routes.length > 0) {
      res.status(400).json({
        error: 'Cannot delete driver with active routes',
      });
      return;
    }

    // Delete driver
    await prisma.driver.delete({
      where: { id },
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

// Update driver status
export const updateDriverStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(DriverStatus).includes(status)) {
      res.status(400).json({ 
        error: 'Valid status is required',
        validStatuses: Object.values(DriverStatus),
      });
      return;
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: 'Driver status updated successfully',
      driver,
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
};

// Get driver statistics
export const getDriverStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalDrivers,
      availableDrivers,
      onRouteDrivers,
      offDutyDrivers,
      activeDrivers,
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.driver.count({ where: { status: 'ON_ROUTE' } }),
      prisma.driver.count({ where: { status: 'OFF_DUTY' } }),
      prisma.driver.count({ where: { isActive: true } }),
    ]);

    res.json({
      stats: {
        total: totalDrivers,
        available: availableDrivers,
        onRoute: onRouteDrivers,
        offDuty: offDutyDrivers,
        active: activeDrivers,
        inactive: totalDrivers - activeDrivers,
      },
    });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({ error: 'Failed to fetch driver statistics' });
  }
};
```

---

## Step 2: Create Driver Routes

Create `backend/src/routes/driverRoutes.ts`:

```typescript
// filepath: backend/src/routes/driverRoutes.ts
import { Router } from 'express';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  getDriverStats,
} from '../controllers/driverController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Driver CRUD
router.post('/', createDriver);
router.get('/', getDrivers);
router.get('/stats', getDriverStats);
router.get('/:id', getDriverById);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

// Status management
router.patch('/:id/status', updateDriverStatus);

export default router;
```

---

## Step 3: Update server.ts

Update `backend/src/server.ts`:

```typescript
// filepath: backend/src/server.ts
// ...existing code...
import driverRoutes from './routes/driverRoutes';

// ...existing code...

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);

// ...existing code...
```

---

## Step 4: Test Driver API

### 4.1 Restart Server

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend
npm run dev
```

### 4.2 Get Authentication Token

```bash
export TOKEN="your-token-here"
```

### 4.3 Test Endpoints

**Create Driver:**
```bash
curl -X POST http://localhost:5001/api/drivers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mike Driver",
    "email": "mike@swiftroute.com",
    "phone": "+1234567893",
    "licenseNo": "DL123456",
    "vehicleType": "TRUCK"
  }'
```

**Get All Drivers:**
```bash
curl -X GET "http://localhost:5001/api/drivers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Driver Stats:**
```bash
curl -X GET http://localhost:5001/api/drivers/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Get Single Driver:**
```bash
curl -X GET http://localhost:5001/api/drivers/DRIVER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Update Driver:**
```bash
curl -X PUT http://localhost:5001/api/drivers/DRIVER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+9999999999",
    "vehicleType": "VAN"
  }'
```

**Update Driver Status:**
```bash
curl -X PATCH http://localhost:5001/api/drivers/DRIVER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ON_ROUTE"
  }'
```

**Delete Driver:**
```bash
curl -X DELETE http://localhost:5001/api/drivers/DRIVER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drivers` | Create new driver |
| GET | `/api/drivers` | Get all drivers (with filters) |
| GET | `/api/drivers/stats` | Get driver statistics |
| GET | `/api/drivers/:id` | Get single driver |
| PUT | `/api/drivers/:id` | Update driver |
| DELETE | `/api/drivers/:id` | Delete driver |
| PATCH | `/api/drivers/:id/status` | Update driver status |

---

## Query Parameters for GET /api/drivers

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (AVAILABLE, ON_ROUTE, OFF_DUTY, UNAVAILABLE)
- `vehicleType` - Filter by vehicle type (BIKE, SCOOTER, CAR, VAN, TRUCK)
- `isActive` - Filter by active status (true/false)
- `search` - Search in name, email, phone
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

---

## Driver Statuses

- `AVAILABLE` - Ready for new assignments
- `ON_ROUTE` - Currently on delivery route
- `OFF_DUTY` - Not working (break, end of shift)
- `UNAVAILABLE` - Temporarily unavailable

---

## Vehicle Types

- `BIKE` - Motorcycle/bike
- `SCOOTER` - Scooter
- `CAR` - Car
- `VAN` - Van
- `TRUCK` - Truck

---

## Sample Responses

### Create Driver Success
```json
{
  "message": "Driver created successfully",
  "driver": {
    "id": "cmh6xyz123...",
    "name": "Mike Driver",
    "email": "mike@swiftroute.com",
    "phone": "+1234567893",
    "licenseNo": "DL123456",
    "vehicleType": "TRUCK",
    "status": "AVAILABLE",
    "isActive": true,
    "createdAt": "2025-10-25T20:00:00.000Z",
    "updatedAt": "2025-10-25T20:00:00.000Z"
  }
}
```

### Get Drivers Success
```json
{
  "drivers": [
    {
      "id": "cmh6abc...",
      "name": "John Driver",
      "email": "driver1@swiftroute.com",
      "phone": "+1234567890",
      "vehicleType": "VAN",
      "status": "AVAILABLE",
      "isActive": true,
      "routes": []
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Driver Stats Success
```json
{
  "stats": {
    "total": 3,
    "available": 2,
    "onRoute": 1,
    "offDuty": 0,
    "active": 3,
    "inactive": 0
  }
}
```

---

## Validation Rules

### Create Driver
- `name` (required): 2-100 characters
- `email` (required): Valid email format, unique
- `phone` (required): Valid phone number
- `licenseNo` (optional): License number
- `vehicleType` (optional): One of the valid types (default: VAN)

### Update Driver
- All fields optional
- `email` must be unique if changed

### Update Status
- `status` (required): One of the valid driver statuses

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name, email, and phone are required"
}
```

### 404 Not Found
```json
{
  "error": "Driver not found"
}
```

### 409 Conflict
```json
{
  "error": "Driver with this email already exists"
}
```

---

## Completion Checklist

### Backend Implementation
- [ ] Driver controller created with all functions
- [ ] Driver routes configured
- [ ] Server.ts updated with driver routes
- [ ] All CRUD operations working

### Testing
- [ ] Create driver - Success
- [ ] Get all drivers - Success
- [ ] Get driver by ID - Success
- [ ] Update driver - Success
- [ ] Delete driver - Success
- [ ] Update driver status - Success
- [ ] Get driver stats - Success
- [ ] Search drivers - Success
- [ ] Filter by status - Success
- [ ] Filter by vehicle type - Success

### Edge Cases
- [ ] Duplicate email validation
- [ ] Delete driver with active routes (should fail)
- [ ] Invalid status update (should fail)
- [ ] Invalid driver ID (should return 404)

---

## Next Steps

✅ **Chapter 9 Complete**: Driver Management API ready  
🔜 **Chapter 10**: Route Management & Assignment  
🔜 **Chapter 11**: Route Optimization Algorithm  
🔜 **Chapter 12**: Real-time Tracking & WebSockets  

---

**Test all endpoints before moving to Chapter 10!** 🚗