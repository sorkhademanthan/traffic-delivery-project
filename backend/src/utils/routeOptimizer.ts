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