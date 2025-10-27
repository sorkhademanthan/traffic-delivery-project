# SwiftRoute — Chapter 8: Order Management API

Purpose: Build complete CRUD operations for order management with CSV upload, filtering, and bulk operations.

---

## Overview

We'll build:
1. **Create Order** - Add single order
2. **Get Orders** - List with filtering, pagination, search
3. **Get Order by ID** - Single order details
4. **Update Order** - Edit order information
5. **Delete Order** - Remove order
6. **Bulk Operations** - Import orders from CSV
7. **Order Statistics** - Dashboard metrics

---

## Step 1: Install Additional Dependencies

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

# Install CSV parsing and file upload libraries
npm install multer csv-parser
npm install --save-dev @types/multer
```

---

## Step 2: Create Order Controller

Create `backend/src/controllers/orderController.ts`:

```typescript
// filepath: backend/src/controllers/orderController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

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
            ...orderData,
            status: 'PENDING',
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
```

---

## Step 3: Create CSV Upload Utility

Create `backend/src/utils/csvParser.ts`:

```typescript
// filepath: backend/src/utils/csvParser.ts
import fs from 'fs';
import csv from 'csv-parser';

export interface ParsedOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  deliveryNotes?: string;
  orderValue?: number;
  priority?: string;
  timeWindow?: string;
}

export const parseOrdersCSV = (filePath: string): Promise<ParsedOrder[]> => {
  return new Promise((resolve, reject) => {
    const orders: ParsedOrder[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const order: ParsedOrder = {
            orderNumber: row.orderNumber || row['Order Number'] || '',
            customerName: row.customerName || row['Customer Name'] || '',
            customerPhone: row.customerPhone || row['Phone'] || '',
            customerEmail: row.customerEmail || row['Email'] || undefined,
            address: row.address || row['Address'] || '',
            addressLine2: row.addressLine2 || row['Address Line 2'] || undefined,
            city: row.city || row['City'] || '',
            postalCode: row.postalCode || row['Postal Code'] || '',
            latitude: row.latitude ? parseFloat(row.latitude) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            deliveryNotes: row.deliveryNotes || row['Notes'] || undefined,
            orderValue: row.orderValue ? parseFloat(row.orderValue) : undefined,
            priority: row.priority || row['Priority'] || 'NORMAL',
            timeWindow: row.timeWindow || row['Time Window'] || undefined,
          };

          // Basic validation
          if (order.orderNumber && order.customerName && order.address && order.city) {
            orders.push(order);
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      })
      .on('end', () => {
        resolve(orders);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
```

---

## Step 4: Create File Upload Middleware

Create `backend/src/middleware/upload.ts`:

```typescript
// filepath: backend/src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only allow CSV files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
```

---

## Step 5: Add CSV Upload Controller

Add to `backend/src/controllers/orderController.ts`:

```typescript
// filepath: backend/src/controllers/orderController.ts
// ...existing code...
import { parseOrdersCSV } from '../utils/csvParser';
import fs from 'fs';

// ...existing code...

// Upload orders from CSV
export const uploadOrdersCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'CSV file is required' });
      return;
    }

    const filePath = req.file.path;

    // Parse CSV file
    const parsedOrders = await parseOrdersCSV(filePath);

    if (parsedOrders.length === 0) {
      res.status(400).json({ error: 'No valid orders found in CSV' });
      return;
    }

    // Import orders
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const orderData of parsedOrders) {
      try {
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
            ...orderData,
            status: 'PENDING',
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

    // Delete uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `CSV import completed: ${results.success} succeeded, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Upload CSV error:', error);
    
    // Clean up file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload CSV' });
  }
};
```

---

## Step 6: Create Order Routes

Create `backend/src/routes/orderRoutes.ts`:

```typescript
// filepath: backend/src/routes/orderRoutes.ts
import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
  bulkCreateOrders,
  uploadOrdersCSV,
} from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Order CRUD
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

// Bulk operations
router.post('/bulk', bulkCreateOrders);
router.post('/upload-csv', upload.single('file'), uploadOrdersCSV);

export default router;
```

---

## Step 7: Update server.ts

Update `backend/src/server.ts`:

```typescript
// filepath: backend/src/server.ts
// ...existing code...
import orderRoutes from './routes/orderRoutes';

// ...existing code...

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// ...existing code...
```

---

## Step 8: Create Sample CSV Template

Create `backend/uploads/sample-orders.csv`:

```csv
Order Number,Customer Name,Phone,Email,Address,City,Postal Code,Priority,Notes
ORD-101,John Doe,+1234567890,john@example.com,123 Main St,New York,10001,NORMAL,Leave at door
ORD-102,Jane Smith,+1234567891,jane@example.com,456 Oak Ave,New York,10002,HIGH,Call on arrival
ORD-103,Bob Johnson,+1234567892,bob@example.com,789 Pine Rd,Brooklyn,11201,URGENT,Fragile items
```

---

## Step 9: Test the API

### 9.1 Restart server

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend
npm run dev
```

### 9.2 Get authentication token

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swiftroute.com","password":"admin123"}'
```

Save the token!

### 9.3 Test Order Endpoints

**Create Order:**
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-001",
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "postalCode": "12345",
    "priority": "NORMAL"
  }'
```

**Get All Orders:**
```bash
curl -X GET "http://localhost:5001/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Order Stats:**
```bash
curl -X GET http://localhost:5001/api/orders/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload CSV:**

**Step 1: Create a test CSV file**
```bash
cd ~/Desktop
cat > test-orders.csv << 'EOF'
Order Number,Customer Name,Phone,Email,Address,City,Postal Code,Priority,Notes
ORD-201,Alice Brown,+1111111111,alice@test.com,100 First St,Boston,02101,NORMAL,Ring doorbell
ORD-202,Bob White,+2222222222,bob@test.com,200 Second Ave,Boston,02102,HIGH,Leave with neighbor
EOF
```

**Step 2: Upload the CSV**
```bash
curl -X POST http://localhost:5001/api/orders/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/Users/manthansorkhade/Desktop/test-orders.csv"
```

**Expected Response:**
```json
{
  "message": "CSV import completed: 2 succeeded, 0 failed",
  "results": {
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create single order |
| GET | `/api/orders` | Get all orders (with filters) |
| GET | `/api/orders/stats` | Get order statistics |
| GET | `/api/orders/:id` | Get single order |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| POST | `/api/orders/bulk` | Bulk create orders (JSON) |
| POST | `/api/orders/upload-csv` | Upload orders from CSV |

---

## Query Parameters for GET /api/orders

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (PENDING, ASSIGNED, etc.)
- `priority` - Filter by priority (LOW, NORMAL, HIGH, URGENT)
- `city` - Filter by city
- `search` - Search in order number, customer name, phone, address
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

---

## Next Steps

✅ **Chapter 8 Complete**: Order Management API ready  
🔜 **Chapter 9**: Driver Management API  
🔜 **Chapter 10**: Route Management & Assignment  
🔜 **Chapter 11**: Route Optimization Algorithm  

---

**Test all endpoints before moving to Chapter 9!** 📦