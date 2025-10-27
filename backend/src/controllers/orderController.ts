import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma, Priority, OrderStatus } from '@prisma/client';
import { parseOrdersCSV } from '../utils/csvParser';
import fs from 'fs';
import path from 'path';

// Create new order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      address,
      addressLine2,
      city,
      postalCode,
      latitude,
      longitude,
      deliveryNotes,
      orderValue,
      priority,
      timeWindow,
    } = req.body;

    // Validate required fields
    if (!orderNumber || !customerName || !customerPhone || !address || !city || !postalCode) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if order number already exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existingOrder) {
      res.status(409).json({ error: 'Order number already exists' });
      return;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        address,
        addressLine2,
        city,
        postalCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        deliveryNotes,
        orderValue: orderValue ? parseFloat(orderValue) : null,
        priority: priority || 'NORMAL',
        timeWindow,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get all orders with filtering and pagination
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      priority,
      city,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerPhone: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          routeStop: {
            include: {
              route: {
                include: {
                  driver: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        routeStop: {
          include: {
            route: {
              include: {
                driver: true,
              },
            },
          },
        },
        deliveryAttempts: {
          orderBy: { attemptedAt: 'desc' },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Update order
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete order
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { routeStop: true },
    });

    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if order is assigned to a route
    if (existingOrder.routeStop) {
      res.status(400).json({
        error: 'Cannot delete order that is assigned to a route',
      });
      return;
    }

    // Delete order
    await prisma.order.delete({
      where: { id },
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

// Get order statistics
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalOrders,
      pendingOrders,
      assignedOrders,
      inTransitOrders,
      deliveredOrders,
      failedOrders,
      todayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'ASSIGNED' } }),
      prisma.order.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      stats: {
        total: totalOrders,
        pending: pendingOrders,
        assigned: assignedOrders,
        inTransit: inTransitOrders,
        delivered: deliveredOrders,
        failed: failedOrders,
        today: todayOrders,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
};



// Bulk create orders
export const bulkCreateOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({ error: 'Orders array is required' });
      return;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const orderData of orders) {
      try {
        // Check if order number already exists
        const existing = await prisma.order.findUnique({
          where: { orderNumber: orderData.orderNumber },
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            orderNumber: orderData.orderNumber,
            error: 'Order number already exists',
          });
          continue;
        }

        await prisma.order.create({
          data: {
            orderNumber: orderData.orderNumber,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerEmail: orderData.customerEmail ?? null,
            address: orderData.address,
            addressLine2: orderData.addressLine2 ?? null,
            city: orderData.city,
            postalCode: orderData.postalCode,
            latitude: orderData.latitude ? parseFloat(orderData.latitude as any) : null,
            longitude: orderData.longitude ? parseFloat(orderData.longitude as any) : null,
            deliveryNotes: orderData.deliveryNotes ?? null,
            orderValue: orderData.orderValue ? parseFloat(orderData.orderValue as any) : null,
            priority: (orderData.priority as Priority) || Priority.NORMAL,
            timeWindow: orderData.timeWindow ?? null,
            status: OrderStatus.PENDING,
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          orderNumber: orderData.orderNumber,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      message: `Bulk import completed: ${results.success} succeeded, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Bulk create orders error:', error);
    res.status(500).json({ error: 'Failed to bulk create orders' });
  }
};

export const uploadOrdersCSV = async (req: Request, res: Response): Promise<void> => {
  let filePath: string | undefined;
  let tempFile: string | undefined;
  
  try {
    console.log('📥 === CSV Upload Request Started ===');
    
    if (!req.file) {
      console.log('❌ No file received');
      res.status(400).json({ error: 'CSV file is required' });
      return;
    }

    console.log('✅ File received');
    console.log('   - Has path:', !!req.file.path);
    console.log('   - Has buffer:', !!req.file.buffer);

    // Handle BUFFER (memory storage) - WORKAROUND
    if (req.file.buffer && !req.file.path) {
      console.log('📝 Using buffer storage (workaround)');
      
      // Create temp file from buffer
      tempFile = path.join(__dirname, '../../uploads', `temp-${Date.now()}.csv`);
      fs.writeFileSync(tempFile, req.file.buffer);
      filePath = tempFile;
      
      console.log('💾 Temp file created:', filePath);
    } 
    // Handle FILE PATH (disk storage) - NORMAL
    else if (req.file.path) {
      console.log('💾 Using disk storage (normal)');
      filePath = req.file.path;
    } 
    else {
      console.log('❌ No path or buffer available');
      res.status(400).json({ error: 'File upload failed' });
      return;
    }

    // Parse CSV
    console.log('📊 Parsing CSV from:', filePath);
    const parsedOrders = await parseOrdersCSV(filePath);
    console.log(`✅ Parsed ${parsedOrders.length} orders`);

    if (parsedOrders.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(400).json({ error: 'No valid orders found in CSV' });
      return;
    }

    // Import orders
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    console.log('🔄 Importing orders...');
    for (const orderData of parsedOrders) {
      try {
        const existing = await prisma.order.findUnique({
          where: { orderNumber: orderData.orderNumber },
        });

        if (existing) {
          console.log(`⚠️ Duplicate: ${orderData.orderNumber}`);
          results.failed++;
          results.errors.push({
            orderNumber: orderData.orderNumber,
            error: 'Order number already exists',
          });
          continue;
        }

        await prisma.order.create({
          data: {
            orderNumber: orderData.orderNumber,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerEmail: orderData.customerEmail || null,
            address: orderData.address,
            addressLine2: orderData.addressLine2 || null,
            city: orderData.city,
            postalCode: orderData.postalCode,
            latitude: orderData.latitude || null,
            longitude: orderData.longitude || null,
            deliveryNotes: orderData.deliveryNotes || null,
            orderValue: orderData.orderValue || null,
            priority: (orderData.priority as any) || 'NORMAL',
            timeWindow: orderData.timeWindow || null,
            status: 'PENDING',
          },
        });

        console.log(`✅ Created: ${orderData.orderNumber}`);
        results.success++;
      } catch (error: any) {
        console.error(`❌ Failed: ${orderData.orderNumber}`, error.message);
        results.failed++;
        results.errors.push({
          orderNumber: orderData.orderNumber,
          error: error.message,
        });
      }
    }

    // Clean up
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Cleaned up file');
    }

    console.log(`🎉 Import complete: ${results.success} succeeded, ${results.failed} failed`);

    res.status(201).json({
      message: `CSV import completed: ${results.success} succeeded, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error('❌ Upload failed:', error);
    
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
    
    res.status(500).json({ 
      error: 'Failed to upload CSV',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};