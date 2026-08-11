import { PEAJES_CHILE } from '../data/peajes.js';

/**
 * Calculates distance in meters between two lat/lon coordinates using Haversine formula.
 */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detects toll plazas intersected by an OSRM route polyline.
 * @param {Array<[number, number]>} polylineCoordinates Array of [lat, lon]
 * @param {number} toleranceMeters Tolerance radius in meters (default 450m)
 * @returns {Array<{id: string, name: string, highway: string, price: number, lat: number, lon: number}>}
 */
export function detectTollsOnRoute(polylineCoordinates, toleranceMeters = 450) {
  if (!polylineCoordinates || polylineCoordinates.length === 0) return [];

  const detectedTolls = [];

  PEAJES_CHILE.forEach(toll => {
    // Check if any point in polyline is within tolerance distance of toll plaza
    const intersects = polylineCoordinates.some(([pLat, pLon]) => {
      const distance = haversineMeters(pLat, pLon, toll.lat, toll.lon);
      return distance <= toleranceMeters;
    });

    if (intersects) {
      detectedTolls.push({ ...toll });
    }
  });

  return detectedTolls;
}

/**
 * Computes total toll cost from detected tolls list.
 */
export function calculateTotalTollsCost(tollsList) {
  return tollsList.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
}
