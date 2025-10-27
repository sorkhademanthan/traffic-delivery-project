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