import { getIncidentsByLocation, createIncident, incrementIncidentReportCount, updateIncidentPriority } from '@/utils/db/actions';

/**
 * Haversine formula to calculate distance between two lat/lng points in km
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
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
 * Check for duplicate reports in the same area.
 * If a nearby open incident exists (within 500m) with matching waste type,
 * merge the report into the existing incident.
 * Otherwise, create a new incident.
 */
export async function detectDuplicateAndGetIncident(
  latitude: string,
  longitude: string,
  wasteType: string,
  severity: string,
  healthRisk: string,
  estimatedVolume: string,
  location: string
): Promise<{ incidentId: number; isDuplicate: boolean }> {
  try {
    // Find nearby open incidents within 500m
    const nearbyIncidents = await getIncidentsByLocation(latitude, longitude, 0.5);

    if (nearbyIncidents.length > 0) {
      // Check for waste type similarity
      for (const incident of nearbyIncidents) {
        const distance = haversineDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(incident.latitude || '0'),
          parseFloat(incident.longitude || '0')
        );

        // If within 500m and similar waste type, merge
        if (distance <= 0.5 && isSimilarWasteType(wasteType, incident.wasteType || '')) {
          await incrementIncidentReportCount(incident.id);

          // Recalculate priority with updated report count
          const newPriority = calculatePriorityScore({
            severity: getHigherSeverity(severity, incident.severity),
            healthRisk: getHigherRisk(healthRisk, incident.healthRisk || 'low'),
            reportCount: incident.reportCount + 1,
            locationSensitivity: incident.locationSensitivity || 'medium',
            hoursElapsed: getHoursElapsed(incident.createdAt),
          });

          await updateIncidentPriority(incident.id, newPriority);

          return { incidentId: incident.id, isDuplicate: true };
        }
      }
    }

    // No duplicate found — create new incident
    const newIncident = await createIncident(
      location,
      latitude,
      longitude,
      wasteType,
      severity,
      healthRisk,
      estimatedVolume
    );

    if (newIncident) {
      const priority = calculatePriorityScore({
        severity,
        healthRisk,
        reportCount: 1,
        locationSensitivity: 'medium',
        hoursElapsed: 0,
      });
      await updateIncidentPriority(newIncident.id, priority);
      return { incidentId: newIncident.id, isDuplicate: false };
    }

    throw new Error("Failed to create incident");
  } catch (error) {
    console.error("Error in duplicate detection:", error);
    throw error;
  }
}

/**
 * Check if two waste types are similar
 */
function isSimilarWasteType(type1: string, type2: string): boolean {
  const normalize = (t: string) => t.toLowerCase().trim();
  const t1 = normalize(type1);
  const t2 = normalize(type2);

  // Exact match
  if (t1 === t2) return true;

  // Category-based matching
  const categories: Record<string, string[]> = {
    plastic: ['plastic', 'polythene', 'pet', 'hdpe', 'ldpe', 'plastic bottles', 'plastic bags'],
    organic: ['organic', 'food', 'kitchen', 'compost', 'biodegradable', 'vegetable', 'fruit'],
    paper: ['paper', 'cardboard', 'newspaper', 'carton'],
    metal: ['metal', 'iron', 'steel', 'aluminium', 'aluminum', 'tin', 'can'],
    glass: ['glass', 'bottle'],
    electronic: ['electronic', 'e-waste', 'ewaste', 'battery', 'circuit'],
    mixed: ['mixed', 'general', 'household', 'garbage', 'trash', 'waste'],
    construction: ['construction', 'debris', 'concrete', 'brick', 'rubble'],
  };

  for (const [_, keywords] of Object.entries(categories)) {
    const t1Match = keywords.some(k => t1.includes(k));
    const t2Match = keywords.some(k => t2.includes(k));
    if (t1Match && t2Match) return true;
  }

  return false;
}

// ==================== PRIORITY SCORE ENGINE ====================

interface PriorityInput {
  severity: string;
  healthRisk: string;
  reportCount: number;
  locationSensitivity: string;
  hoursElapsed: number;
  overflowProbability?: number;
}

/**
 * Calculate a dynamic priority score from 0-100 based on multiple factors.
 * 
 * Priority Score =
 *   (severity × 0.20) +
 *   (healthRisk × 0.20) +
 *   (reportCount × 0.15) +
 *   (timeFactor × 0.15) +
 *   (locationSensitivity × 0.15) +
 *   (overflowProbability × 0.15)
 */
export function calculatePriorityScore(input: PriorityInput): number {
  const severityMap: Record<string, number> = { low: 20, medium: 45, high: 70, critical: 100 };
  const riskMap: Record<string, number> = { low: 20, medium: 50, high: 100 };
  const sensitivityMap: Record<string, number> = { low: 20, medium: 50, high: 100 };

  const severityScore = severityMap[input.severity] || 45;
  const healthScore = riskMap[input.healthRisk] || 20;
  const reportScore = Math.min(input.reportCount * 12, 100);
  const timeFactor = Math.min(input.hoursElapsed * 2, 100);
  const sensitivityScore = sensitivityMap[input.locationSensitivity] || 50;
  const overflowScore = (input.overflowProbability || 0) * 100;

  const priority = Math.round(
    severityScore * 0.20 +
    healthScore * 0.20 +
    reportScore * 0.15 +
    timeFactor * 0.15 +
    sensitivityScore * 0.15 +
    overflowScore * 0.15
  );

  return Math.min(Math.max(priority, 0), 100);
}

function getHigherSeverity(a: string, b: string): string {
  const order = ['low', 'medium', 'high', 'critical'];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function getHigherRisk(a: string, b: string): string {
  const order = ['low', 'medium', 'high'];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function getHoursElapsed(date: Date): number {
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
}
