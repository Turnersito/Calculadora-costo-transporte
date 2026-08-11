import { normalizeEfficiencyToKmL } from './formatters.js';

/**
 * Calculates complete trip fuel cost and extra options breakdown.
 * 
 * Formula:
 * 1. effectiveDistance = distanceKm * (isRoundTrip ? 2 : 1)
 * 2. efficiencyKmL = normalizeEfficiencyToKmL(efficiency, unit)
 * 3. litersConsumed = effectiveDistance / efficiencyKmL
 * 4. fuelCost = litersConsumed * pricePerLiter
 * 5. effectiveTolls = tollsCost * (isRoundTrip ? 2 : 1)
 * 6. totalCost = fuelCost + effectiveTolls
 * 7. costPerPassenger = totalCost / passengers
 */
export function calculateTripCost(options) {
  const {
    distanceKm = 0,
    efficiency = 12.5,
    unit = 'kml',
    pricePerLiter = 1320,
    isRoundTrip = false,
    tollsCost = 0,
    passengers = 1
  } = options;

  const effectiveDistance = distanceKm * (isRoundTrip ? 2 : 1);
  const efficiencyKmL = normalizeEfficiencyToKmL(efficiency, unit);
  
  const litersConsumed = efficiencyKmL > 0 ? (effectiveDistance / efficiencyKmL) : 0;
  const fuelCost = litersConsumed * pricePerLiter;
  const effectiveTolls = (parseFloat(tollsCost) || 0) * (isRoundTrip ? 2 : 1);
  const totalCost = fuelCost + effectiveTolls;
  
  const validPassengers = Math.max(1, parseInt(passengers) || 1);
  const costPerPassenger = totalCost / validPassengers;

  return {
    effectiveDistance,
    efficiencyKmL,
    litersConsumed: Math.round(litersConsumed * 10) / 10, // 1 decimal
    fuelCost: Math.round(fuelCost),
    effectiveTolls: Math.round(effectiveTolls),
    totalCost: Math.round(totalCost),
    validPassengers,
    costPerPassenger: Math.round(costPerPassenger)
  };
}
