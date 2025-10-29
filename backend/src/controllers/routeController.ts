// filepath: backend/src/controllers/routeController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma, RouteStatus, DriverStatus, OrderStatus } from '@prisma/client';
import { optimizeRouteNearestNeighbor, Location } from '../utils/routeOptimizer';

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

export const optimizeRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`📊 Optimization requested for route: ${id}`);

    // Fetch route with all stops
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
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

    if (route.stops.length === 0) {
      res.status(400).json({ error: 'Cannot optimize route with no stops' });
      return;
    }

    // Don't optimize completed routes
    if (route.status === 'COMPLETED') {
      res.status(400).json({ error: 'Cannot optimize completed route' });
      return;
    }

    // Filter stops with valid coordinates
    const validStops = route.stops.filter(
      (stop) =>
        stop.order.latitude !== null &&
        stop.order.longitude !== null
    );

    if (validStops.length === 0) {
      res.status(400).json({
        error: 'No stops have GPS coordinates. Please add coordinates to orders first.',
      });
      return;
    }

    if (validStops.length < route.stops.length) {
      console.log(`⚠️  Warning: ${route.stops.length - validStops.length} stops missing coordinates`);
    }

    // Prepare locations for optimization
    const locations: Location[] = validStops.map((stop) => ({
      id: stop.orderId,
      orderNumber: stop.order.orderNumber,
      address: stop.order.address,
      latitude: stop.order.latitude!,
      longitude: stop.order.longitude!,
    }));

    // Run optimization
    const optimizedResult = optimizeRouteNearestNeighbor(locations);

    // Update route stops with new sequence
    console.log('💾 Updating database with optimized sequence...');
    
    for (let i = 0; i < optimizedResult.sequence.length; i++) {
      const orderId = optimizedResult.sequence[i];
      const stop = route.stops.find((s) => s.orderId === orderId);

      if (stop) {
        await prisma.routeStop.update({
          where: { id: stop.id },
          data: { sequence: i + 1 },
        });
      }
    }

    // Update route with optimization results
    const updatedRoute = await prisma.route.update({
      where: { id },
      data: {
        totalDistance: optimizedResult.totalDistance,
        estimatedDuration: optimizedResult.estimatedDuration,
      },
      include: {
        driver: true,
        stops: {
          include: { order: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    console.log('✅ Route optimization complete and saved!');

    res.json({
      message: 'Route optimized successfully',
      route: updatedRoute,
      optimization: {
        totalDistance: optimizedResult.totalDistance,
        estimatedDuration: optimizedResult.estimatedDuration,
        stopsOptimized: optimizedResult.sequence.length,
        algorithm: optimizedResult.algorithm,
      },
    });
  } catch (error) {
    console.error('❌ Optimize route error:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
};