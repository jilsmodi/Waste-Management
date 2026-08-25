/**
 * Smart Route Optimizer using a Capacitated Vehicle Routing Problem (CVRP) approach.
 * Uses nearest-neighbor heuristic with priority weighting.
 */

interface CollectionPoint {
  id: number;
  location: string;
  latitude: number;
  longitude: number;
  priorityScore: number;
  estimatedWeight: number; // kg
  wasteType: string;
  severity: string;
}

interface RouteStop {
  point: CollectionPoint;
  distanceFromPrev: number; // km
  cumulativeDistance: number; // km
  estimatedTimeFromPrev: number; // minutes
  cumulativeTime: number; // minutes
  remainingCapacity: number; // kg
}

interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number; // km
  totalTime: number; // minutes
  totalWaste: number; // kg
  capacityUtilization: number; // percentage
  vehicleCapacity: number; // kg
}

/**
 * Haversine formula to calculate distance between two lat/lng points in km
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time in minutes based on distance
 * Assumes average speed of 25 km/h in city (including stops/traffic)
 * Plus 10 min per collection stop
 */
function estimateTravelTime(distanceKm: number): number {
  const travelTime = (distanceKm / 25) * 60;
  return Math.round(travelTime + 10); // +10 min per collection stop
}

/**
 * Parse estimated weight from amount string (e.g., "5 kg", "10 liters")
 */
function parseWeight(amount: string): number {
  const match = amount.match(/(\d+(\.\d+)?)/);
  if (match) {
    const value = parseFloat(match[0]);
    // If in liters, approximate 1 liter ≈ 0.5 kg for mixed waste
    if (amount.toLowerCase().includes('liter') || amount.toLowerCase().includes('l')) {
      return value * 0.5;
    }
    return value;
  }
  return 5; // Default 5 kg if unable to parse
}

/**
 * Optimize collection route using nearest-neighbor heuristic with priority weighting.
 * 
 * Algorithm:
 * 1. Start from depot
 * 2. Score each unvisited point: score = priority * 0.6 + (1/distance) * 0.4
 * 3. Pick highest-scoring point that fits remaining capacity
 * 4. Add to route, reduce capacity
 * 5. Repeat until capacity full or no more points
 */
export function optimizeRoute(
  points: CollectionPoint[],
  depotLat: number,
  depotLng: number,
  vehicleCapacityKg: number = 2000 // 2 tonnes default
): OptimizedRoute {
  if (points.length === 0) {
    return {
      stops: [],
      totalDistance: 0,
      totalTime: 0,
      totalWaste: 0,
      capacityUtilization: 0,
      vehicleCapacity: vehicleCapacityKg,
    };
  }

  const visited = new Set<number>();
  const route: RouteStop[] = [];
  let currentLat = depotLat;
  let currentLng = depotLng;
  let remainingCapacity = vehicleCapacityKg;
  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  while (visited.size < points.length && remainingCapacity > 0) {
    let bestPoint: CollectionPoint | null = null;
    let bestScore = -1;

    for (const point of points) {
      if (visited.has(point.id)) continue;
      if (point.estimatedWeight > remainingCapacity) continue;

      const distance = haversineDistance(currentLat, currentLng, point.latitude, point.longitude);
      
      // Score: weighted combination of priority and inverse distance
      // Higher priority and closer distance = higher score
      const normalizedPriority = point.priorityScore / 100;
      const normalizedProximity = Math.max(0, 1 - (distance / 20)); // Within 20km range
      const score = normalizedPriority * 0.6 + normalizedProximity * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestPoint = point;
      }
    }

    if (!bestPoint) break;

    const distance = haversineDistance(currentLat, currentLng, bestPoint.latitude, bestPoint.longitude);
    const travelTime = estimateTravelTime(distance);

    cumulativeDistance += distance;
    cumulativeTime += travelTime;
    remainingCapacity -= bestPoint.estimatedWeight;

    route.push({
      point: bestPoint,
      distanceFromPrev: Math.round(distance * 100) / 100,
      cumulativeDistance: Math.round(cumulativeDistance * 100) / 100,
      estimatedTimeFromPrev: travelTime,
      cumulativeTime,
      remainingCapacity: Math.round(remainingCapacity),
    });

    visited.add(bestPoint.id);
    currentLat = bestPoint.latitude;
    currentLng = bestPoint.longitude;
  }

  // Add return to depot distance
  if (route.length > 0) {
    const lastStop = route[route.length - 1];
    const returnDistance = haversineDistance(lastStop.point.latitude, lastStop.point.longitude, depotLat, depotLng);
    cumulativeDistance += returnDistance;
    cumulativeTime += estimateTravelTime(returnDistance);
  }

  const totalWaste = vehicleCapacityKg - remainingCapacity;

  return {
    stops: route,
    totalDistance: Math.round(cumulativeDistance * 100) / 100,
    totalTime: Math.round(cumulativeTime),
    totalWaste: Math.round(totalWaste),
    capacityUtilization: Math.round((totalWaste / vehicleCapacityKg) * 100),
    vehicleCapacity: vehicleCapacityKg,
  };
}

/**
 * Convert incidents/reports to collection points for route optimization
 */
export function toCollectionPoints(items: Array<{
  id: number;
  location: string;
  latitude: string | null;
  longitude: string | null;
  priorityScore?: number;
  severity?: string;
  wasteType?: string | null;
  estimatedVolume?: string | null;
  amount?: string;
}>): CollectionPoint[] {
  return items
    .filter(item => item.latitude && item.longitude)
    .map(item => ({
      id: item.id,
      location: item.location,
      latitude: parseFloat(item.latitude!),
      longitude: parseFloat(item.longitude!),
      priorityScore: item.priorityScore || 50,
      estimatedWeight: parseWeight(item.estimatedVolume || item.amount || '5 kg'),
      wasteType: item.wasteType || 'Mixed',
      severity: item.severity || 'medium',
    }));
}
