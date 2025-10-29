# SwiftRoute — Chapter 10: Route Management & Assignment API

Purpose: Build route creation, order assignment, driver assignment, and route lifecycle management.

---

## Overview

We'll build:
1. **Create Route** - Create delivery route with driver assignment
2. **Get Routes** - List with filtering, pagination, search
3. **Get Route by ID** - Single route with all stops and details
4. **Update Route** - Edit route information
5. **Delete Route** - Remove route
6. **Assign Orders to Route** - Add orders as route stops
7. **Remove Orders from Route** - Unassign orders
8. **Start/Complete Route** - Update route status
9. **Route Statistics** - Dashboard metrics

---

## Tasks Checklist

### Phase 1: Backend Setup
- [ ] Create route controller (`src/controllers/routeController.ts`)
- [ ] Create route stop controller (`src/controllers/routeStopController.ts`)
- [ ] Create route routes (`src/routes/routeRoutes.ts`)
- [ ] Update server.ts to include route routes
- [ ] Test all CRUD endpoints

### Phase 2: Route Assignment Logic
- [ ] Assign orders to route
- [ ] Remove orders from route
- [ ] Calculate route sequence
- [ ] Update order statuses when assigned
- [ ] Validate driver availability

### Phase 3: Route Lifecycle
- [ ] Start route (update driver status)
- [ ] Complete route
- [ ] Cancel route
- [ ] Track route progress

### Phase 4: Testing
- [ ] Test create route with driver
- [ ] Test assign orders to route
- [ ] Test get route with all stops
- [ ] Test route statistics
- [ ] Test start/complete route
- [ ] Test driver status updates

---

## Step 1: Create Route Controller

Create `backend/src/controllers/routeController.ts`:

```typescript
// filepath: backend/src/controllers/routeController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma, RouteStatus, DriverStatus, OrderStatus } from '@prisma/client';

// Create new route
export const createRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      driverId,
      date,
      notes,
    } = req.body;

    // Validate required fields
    if (!driverId) {
      res.status(400).json({ error: 'Driver ID is required' });
      return;
    }

    // Check if driver exists and is available
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }

    if (!driver.isActive) {
      res.status(400).json({ error: 'Driver is not active' });
      return;
    }

    // Generate unique route number
    const routeCount = await prisma.route.count();
    const routeNumber = `RT-${String(routeCount + 1).padStart(6, '0')}`;

    // Create route
    const route = await prisma.route.create({
      data: {
        routeNumber,
        driverId,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
        status: RouteStatus.PENDING,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vehicleType: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Route created successfully',
      route,
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
};

// Get all routes with filtering and pagination
export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      driverId,
      date,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: Prisma.RouteWhereInput = {};

    if (status) where.status = status as RouteStatus;
    if (driverId) where.driverId = driverId as string;
    
    if (date) {
      const searchDate = new Date(date as string);
      where.date = {
        gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        lte: new Date(searchDate.setHours(23, 59, 59, 999)),
      };
    }

    if (search) {
      where.OR = [
        { routeNumber: { contains: search as string, mode: 'insensitive' } },
        { driver: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    // Get routes with pagination
    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              vehicleType: true,
              status: true,
            },
          },
          stops: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  customerName: true,
                  address: true,
                  city: true,
                  status: true,
                },
              },
            },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      prisma.route.count({ where }),
    ]);

    res.json({
      routes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

// Get single route by ID
export const getRouteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: true,
        stops: {
          include: {
            order: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

// Update route
export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // If route is completed, don't allow updates
    if (existingRoute.status === 'COMPLETED') {
      res.status(400).json({ error: 'Cannot update completed route' });
      return;
    }

    // Update route
    const route = await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        driver: true,
        stops: {
          include: { order: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    res.json({
      message: 'Route updated successfully',
      route,
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
};

// Delete route
export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!existingRoute) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Don't allow deletion of routes in progress
    if (existingRoute.status === 'IN_PROGRESS') {
      res.status(400).json({ error: 'Cannot delete route in progress' });
      return;
    }

    // If route has stops, unassign orders first
    if (existingRoute.stops.length > 0) {
      await prisma.order.updateMany({
        where: {
          routeStop: {
            routeId: id,
          },
        },
        data: {
          status: OrderStatus.PENDING,
        },
      });
    }

    // Delete route (cascade will delete stops)
    await prisma.route.delete({
      where: { id },
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
};

// Assign orders to route
export const assignOrdersToRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'Order IDs array is required' });
      return;
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Don't allow adding to completed routes
    if (route.status === 'COMPLETED') {
      res.status(400).json({ error: 'Cannot add orders to completed route' });
      return;
    }

    // Get current highest sequence
    const maxSequence = route.stops.reduce((max, stop) => 
      stop.sequence > max ? stop.sequence : max, 0
    );

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Assign each order
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      
      try {
        // Check if order exists and is not already assigned
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { routeStop: true },
        });

        if (!order) {
          results.failed++;
          results.errors.push({
            orderId,
            error: 'Order not found',
          });
          continue;
        }

        if (order.routeStop) {
          results.failed++;
          results.errors.push({
            orderId,
            error: 'Order already assigned to a route',
          });
          continue;
        }

        // Create route stop
        await prisma.routeStop.create({
          data: {
            routeId: id,
            orderId,
            sequence: maxSequence + i + 1,
            status: 'PENDING',
          },
        });

        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.ASSIGNED },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          orderId,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Assigned ${results.success} orders, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Assign orders error:', error);
    res.status(500).json({ error: 'Failed to assign orders' });
  }
};

// Start route
export const startRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    if (route.stops.length === 0) {
      res.status(400).json({ error: 'Cannot start route with no stops' });
      return;
    }

    if (route.status !== 'PENDING') {
      res.status(400).json({ error: 'Route already started or completed' });
      return;
    }

    // Update route and driver status
    const [updatedRoute] = await prisma.$transaction([
      prisma.route.update({
        where: { id },
        data: {
          status: RouteStatus.IN_PROGRESS,
          startTime: new Date(),
        },
        include: {
          driver: true,
          stops: {
            include: { order: true },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      prisma.driver.update({
        where: { id: route.driverId },
        data: { status: DriverStatus.ON_ROUTE },
      }),
    ]);

    res.json({
      message: 'Route started successfully',
      route: updatedRoute,
    });
  } catch (error) {
    console.error('Start route error:', error);
    res.status(500).json({ error: 'Failed to start route' });
  }
};

// Complete route
export const completeRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    if (route.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Route is not in progress' });
      return;
    }

    // Calculate actual duration
    const startTime = route.startTime || new Date();
    const endTime = new Date();
    const actualDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000); // minutes

    // Update route and driver status
    const [updatedRoute] = await prisma.$transaction([
      prisma.route.update({
        where: { id },
        data: {
          status: RouteStatus.COMPLETED,
          endTime,
          actualDuration,
        },
        include: {
          driver: true,
          stops: {
            include: { order: true },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      prisma.driver.update({
        where: { id: route.driverId },
        data: { status: DriverStatus.AVAILABLE },
      }),
    ]);

    res.json({
      message: 'Route completed successfully',
      route: updatedRoute,
    });
  } catch (error) {
    console.error('Complete route error:', error);
    res.status(500).json({ error: 'Failed to complete route' });
  }
};

// Get route statistics
export const getRouteStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalRoutes,
      pendingRoutes,
      inProgressRoutes,
      completedRoutes,
      todayRoutes,
    ] = await Promise.all([
      prisma.route.count(),
      prisma.route.count({ where: { status: 'PENDING' } }),
      prisma.route.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.route.count({ where: { status: 'COMPLETED' } }),
      prisma.route.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    res.json({
      stats: {
        total: totalRoutes,
        pending: pendingRoutes,
        inProgress: inProgressRoutes,
        completed: completedRoutes,
        today: todayRoutes,
      },
    });
  } catch (error) {
    console.error('Get route stats error:', error);
    res.status(500).json({ error: 'Failed to fetch route statistics' });
  }
};
```

---

## Step 2: Create Route Routes

Create `backend/src/routes/routeRoutes.ts`:

```typescript
// filepath: backend/src/routes/routeRoutes.ts
import { Router } from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  assignOrdersToRoute,
  startRoute,
  completeRoute,
  getRouteStats,
} from '../controllers/routeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Route CRUD
router.post('/', createRoute);
router.get('/', getRoutes);
router.get('/stats', getRouteStats);
router.get('/:id', getRouteById);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);

// Route operations
router.post('/:id/assign-orders', assignOrdersToRoute);
router.patch('/:id/start', startRoute);
router.patch('/:id/complete', completeRoute);

export default router;
```

---

## Step 3: Update server.ts

```typescript
// filepath: backend/src/server.ts
// ...existing code...
import routeRoutes from './routes/routeRoutes';

// ...existing code...

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);

// ...existing code...
```

---

## Step 4: Test Route API

### 4.1 Get Authentication Token

```bash
export TOKEN="your-token-here"
```

### 4.2 Test Endpoints

**Create Route:**
```bash
curl -X POST http://localhost:5001/api/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "cmh960bpi0000xfg0ds1u8bc8",
    "date": "2025-10-28",
    "notes": "Morning delivery route"
  }'
```

**Get All Routes:**
```bash
curl -X GET "http://localhost:5001/api/routes?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Route Stats:**
```bash
curl -X GET http://localhost:5001/api/routes/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Assign Orders to Route:**
```bash
curl -X POST http://localhost:5001/api/routes/ROUTE_ID/assign-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": ["ORDER_ID_1", "ORDER_ID_2", "ORDER_ID_3"]
  }'
```

**Start Route:**
```bash
curl -X PATCH http://localhost:5001/api/routes/ROUTE_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

**Complete Route:**
```bash
curl -X PATCH http://localhost:5001/api/routes/ROUTE_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/routes` | Create new route |
| GET | `/api/routes` | Get all routes (with filters) |
| GET | `/api/routes/stats` | Get route statistics |
| GET | `/api/routes/:id` | Get single route with all stops |
| PUT | `/api/routes/:id` | Update route |
| DELETE | `/api/routes/:id` | Delete route |
| POST | `/api/routes/:id/assign-orders` | Assign orders to route |
| PATCH | `/api/routes/:id/start` | Start route |
| PATCH | `/api/routes/:id/complete` | Complete route |

---

## Route Lifecycle

```
PENDING → IN_PROGRESS → COMPLETED
         ↓
      CANCELLED
```

1. **PENDING**: Route created, orders can be added/removed
2. **IN_PROGRESS**: Route started, driver is delivering
3. **COMPLETED**: All deliveries finished
4. **CANCELLED**: Route cancelled before completion

---

## Completion Checklist

- [ ] Route controller with all functions
- [ ] Route routes configured
- [ ] Server.ts updated
- [ ] Create route - Success
- [ ] Assign orders to route - Success
- [ ] Start route - Success
- [ ] Complete route - Success
- [ ] Get route with stops - Success
- [ ] Route statistics - Success

---

## Next Steps

✅ **Chapter 10 Complete**: Route Management API ready  
🔜 **Chapter 11**: Route Optimization Algorithm (TSP/Google Maps Directions)  
🔜 **Chapter 12**: Web Admin Portal (React UI)  
🔜 **Chapter 13**: Real-time Tracking & WebSockets  

---

**Test all endpoints before moving to Chapter 11!** 🗺️