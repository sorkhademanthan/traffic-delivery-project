# SwiftRoute — Chapter 11: Route Optimization Algorithm

**Intelligent Route Optimization using Nearest Neighbor Algorithm**

---

## 📋 Overview

This chapter implements automatic route optimization to calculate the most efficient delivery sequence, reducing:
- **Fuel costs** by 20-30%
- **Delivery time** by 15-25%
- **Driver overtime** significantly

### What We'll Build

1. Distance calculation using Haversine formula
2. Nearest Neighbor optimization algorithm
3. Route sequencing and reordering
4. Optimization API endpoint
5. Integration with existing route management

---

## Prerequisites

Before starting:
- ✅ Chapters 1-10 completed
- ✅ Routes can be created with orders assigned
- ✅ Orders have GPS coordinates (latitude/longitude)
- ✅ Backend server running on port 5001

---

## Implementation Steps

### Step 1: Create Route Optimizer Utility

Create `backend/src/utils/routeOptimizer.ts`:

```typescript
// filepath: backend/src/utils/routeOptimizer.ts

/**
 * Route Optimization Utilities
 * Implements Nearest Neighbor algorithm for delivery route optimization
 */

// ==========================================
// TYPES
// ==========================================

export interface Location {
  id: string;           // Order ID
  orderNumber: string;  // Order reference
  address: string;      // Full address
  latitude: number;     // GPS latitude
  longitude: number;    // GPS longitude
}

export interface OptimizedRoute {
  sequence: string[];        // Order IDs in optimal sequence
  totalDistance: number;     // Total distance in km
  estimatedDuration: number; // Total time in minutes
  algorithm: string;         // Algorithm used
}

// ==========================================
// DISTANCE CALCULATION
// ==========================================

/**
 * Calculate distance between two GPS points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ==========================================
// DISTANCE MATRIX
// ==========================================

/**
 * Calculate distance matrix for all location pairs
 */
export function calculateDistanceMatrix(locations: Location[]): number[][] {
  const n = locations.length;
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
      }
    }
  }

  return matrix;
}

// ==========================================
// OPTIMIZATION ALGORITHM
// ==========================================

/**
 * Optimize route using Nearest Neighbor algorithm
 */
export function optimizeRouteNearestNeighbor(
  locations: Location[]
): OptimizedRoute {
  // Handle edge cases
  if (locations.length === 0) {
    return {
      sequence: [],
      totalDistance: 0,
      estimatedDuration: 0,
      algorithm: 'nearest_neighbor',
    };
  }

  if (locations.length === 1) {
    return {
      sequence: [locations[0].id],
      totalDistance: 0,
      estimatedDuration: 10,
      algorithm: 'nearest_neighbor',
    };
  }

  console.log(`🔄 Optimizing route with ${locations.length} stops...`);

  // Calculate distance matrix
  const distanceMatrix = calculateDistanceMatrix(locations);
  const n = locations.length;

  // Initialize tracking
  const visited = new Set<number>();
  const sequence: number[] = [];
  let currentIndex = 0;
  let totalDistance = 0;

  // Visit first location
  visited.add(0);
  sequence.push(0);
  console.log(`   Start: ${locations[0].orderNumber}`);

  // Visit remaining locations
  while (visited.size < n) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    // Find nearest unvisited location
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        const distance = distanceMatrix[currentIndex][i];
        if (distance < nearestDistance) {
          nearestIndex = i;
          nearestDistance = distance;
        }
      }
    }

    // Visit nearest location
    if (nearestIndex !== -1) {
      visited.add(nearestIndex);
      sequence.push(nearestIndex);
      totalDistance += nearestDistance;
      
      console.log(`   → ${locations[nearestIndex].orderNumber} (+${nearestDistance.toFixed(2)} km)`);
      
      currentIndex = nearestIndex;
    }
  }

  // Convert indices to order IDs
  const optimizedSequence = sequence.map((index) => locations[index].id);

  // Calculate estimated duration
  const estimatedDuration = calculateEstimatedDuration(totalDistance, n);

  console.log(`✅ Optimization complete!`);
  console.log(`   Total distance: ${totalDistance.toFixed(2)} km`);
  console.log(`   Estimated time: ${estimatedDuration} minutes`);

  return {
    sequence: optimizedSequence,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedDuration,
    algorithm: 'nearest_neighbor',
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate estimated delivery duration
 * 
 * Formula: (distance / speed) × 60 + (stops × service_time)
 * 
 * Assumptions:
 * - Average speed: 40 km/h (urban with traffic)
 * - Service time: 5 minutes per stop
 */
function calculateEstimatedDuration(
  totalDistance: number,
  numStops: number
): number {
  const AVG_SPEED_KMH = 40;
  const SERVICE_TIME_MIN = 5;

  const travelTime = (totalDistance / AVG_SPEED_KMH) * 60;
  const serviceTime = numStops * SERVICE_TIME_MIN;

  return Math.round(travelTime + serviceTime);
}

/**
 * Calculate total distance for a given sequence
 */
export function calculateRouteDistance(
  locations: Location[],
  sequence: string[]
): number {
  if (sequence.length <= 1) return 0;

  let totalDistance = 0;
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

  for (let i = 0; i < sequence.length - 1; i++) {
    const loc1 = locationMap.get(sequence[i]);
    const loc2 = locationMap.get(sequence[i + 1]);

    if (loc1 && loc2) {
      totalDistance += calculateDistance(
        loc1.latitude,
        loc1.longitude,
        loc2.latitude,
        loc2.longitude
      );
    }
  }

  return Math.round(totalDistance * 100) / 100;
}
```

---

### Step 2: Add Optimization to Route Controller

Update `backend/src/controllers/routeController.ts`:

```typescript
// filepath: backend/src/controllers/routeController.ts
// ...existing code...
import { optimizeRouteNearestNeighbor, Location } from '../utils/routeOptimizer';

// ...existing code...

/**
 * Optimize Route
 * POST /api/routes/:id/optimize
 */
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
```

---

### Step 3: Add Optimization Route

Update `backend/src/routes/routeRoutes.ts`:

```typescript
// filepath: backend/src/routes/routeRoutes.ts
// ...existing code...
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
  optimizeRoute, // ← Add this import
} from '../controllers/routeController';

// ...existing code...

// Route operations
router.post('/:id/assign-orders', assignOrdersToRoute);
router.post('/:id/optimize', optimizeRoute); // ← Add this line
router.patch('/:id/start', startRoute);
router.patch('/:id/complete', completeRoute);

// ...existing code...
```

---

### Step 4: Restart Server

```bash
cd ~/Desktop/projects/traffic-delivery-project/backend

# Stop server (Ctrl+C if running)

# Start server
npm run dev
```

---

## Testing Guide

### Test 1: Verify Orders Have Coordinates

```bash
export TOKEN="your-token-here"

# Get orders
curl -s "http://localhost:5001/api/orders?limit=5" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"latitude"|"longitude"|"orderNumber"'
```

**If coordinates are missing, add them:**

```bash
# Update order with New York coordinates
curl -X PUT "http://localhost:5001/api/orders/ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

---

### Test 2: Optimize Route

```bash
export TOKEN="your-token"
export ROUTE_ID="your-route-id"

# View route BEFORE optimization
echo "📋 Route BEFORE optimization:"
curl -s "http://localhost:5001/api/routes/$ROUTE_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"sequence"|"totalDistance"|"estimatedDuration"'

# RUN OPTIMIZATION
echo ""
echo "🔄 Running optimization..."
curl -X POST "http://localhost:5001/api/routes/$ROUTE_ID/optimize" \
  -H "Authorization: Bearer $TOKEN"

# View route AFTER optimization
echo ""
echo "✅ Route AFTER optimization:"
curl -s "http://localhost:5001/api/routes/$ROUTE_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -E '"sequence"|"totalDistance"|"estimatedDuration"'
```

---

## Expected Results

**Before Optimization:**
```json
{
  "stops": [
    {"sequence": 1, "order": {"orderNumber": "ORD-001"}},
    {"sequence": 2, "order": {"orderNumber": "ORD-002"}},
    {"sequence": 3, "order": {"orderNumber": "ORD-003"}}
  ],
  "totalDistance": null,
  "estimatedDuration": null
}
```

**After Optimization:**
```json
{
  "message": "Route optimized successfully",
  "route": {
    "totalDistance": 8.45,
    "estimatedDuration": 28,
    "stops": [
      {"sequence": 1, "order": {"orderNumber": "ORD-001"}},
      {"sequence": 2, "order": {"orderNumber": "ORD-003"}},
      {"sequence": 3, "order": {"orderNumber": "ORD-002"}}
    ]
  },
  "optimization": {
    "totalDistance": 8.45,
    "estimatedDuration": 28,
    "stopsOptimized": 3,
    "algorithm": "nearest_neighbor"
  }
}
```

**Server Console Output:**
```
🔄 Optimizing route with 3 stops...
   Start: ORD-001
   → ORD-003 (+3.82 km)
   → ORD-002 (+4.63 km)
✅ Optimization complete!
   Total distance: 8.45 km
   Estimated time: 28 minutes
💾 Updating database with optimized sequence...
✅ Route optimization complete and saved!
```

---

## API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/routes/:id/optimize` | Optimize route stop sequence |

**Request:**
```bash
POST /api/routes/:id/optimize
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Route optimized successfully",
  "route": { /* full route object */ },
  "optimization": {
    "totalDistance": 8.45,
    "estimatedDuration": 28,
    "stopsOptimized": 3,
    "algorithm": "nearest_neighbor"
  }
}
```

---

## Algorithm Explanation

### Nearest Neighbor Algorithm

**How it works:**
1. Start at depot (first location)
2. Find nearest unvisited location
3. Move there
4. Repeat until all visited

**Complexity:** O(n²)
**Performance:** 70-85% optimal
**Best for:** 5-50 stops

### Haversine Formula

Calculates straight-line distance between GPS coordinates:

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)))

Where:
  R = 6,371 km (Earth's radius)
  d = distance in kilometers
```

---

## Troubleshooting

### Problem: "No stops have GPS coordinates"

**Solution:** Update orders with coordinates

```bash
curl -X PUT "http://localhost:5001/api/orders/ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7128, "longitude": -74.0060}'
```

### Problem: "Cannot optimize completed route"

**Solution:** Only optimize PENDING routes

```bash
# Check route status
curl "http://localhost:5001/api/routes/$ROUTE_ID" \
  -H "Authorization: Bearer $TOKEN" | grep status
```

### Problem: Distance seems wrong

**Solution:** Verify coordinate accuracy using Google Maps

---

## Completion Checklist

- [ ] Route optimizer utility created
- [ ] Distance calculations working
- [ ] Nearest Neighbor algorithm implemented
- [ ] Optimization endpoint added
- [ ] Orders have GPS coordinates
- [ ] Route optimized successfully
- [ ] Sequence updated in database
- [ ] Distance and duration calculated

---

## Next Steps

✅ **Chapter 11 Complete**: Route Optimization working  
🔜 **Chapter 12**: Web Admin Portal (React Dashboard)  
🔜 **Chapter 13**: Mobile Driver App  
🔜 **Chapter 14**: Real-time Tracking & WebSockets  

---

**Test optimization with real coordinates before moving to Chapter 12!** 🗺️