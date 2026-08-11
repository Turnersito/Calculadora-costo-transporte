/* ==========================================================================
   FORMATTER UTILITIES
   ========================================================================== */

/**
 * Formats a numeric value to Chilean Pesos (CLP) currency format.
 * @param {number} amount 
 * @returns {string} e.g. "$14.500 CLP"
 */
export function formatCLP(amount) {
  if (isNaN(amount) || amount === null) return '$0 CLP';
  const rounded = Math.round(amount);
  const formattedNumber = new Intl.NumberFormat('es-CL').format(rounded);
  return `$${formattedNumber} CLP`;
}

/**
 * Formats distance in kilometers with 1 decimal.
 * @param {number} distanceKm 
 * @returns {string} e.g. "120.4 km"
 */
export function formatDistance(distanceKm) {
  if (!distanceKm || isNaN(distanceKm)) return '0 km';
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Formats duration in seconds/minutes to readable hours & minutes string.
 * @param {number} durationMinutes 
 * @returns {string} e.g. "1h 35m" or "45 min"
 */
export function formatDuration(durationMinutes) {
  if (!durationMinutes || isNaN(durationMinutes)) return '0 min';
  const totalMins = Math.round(durationMinutes);
  if (totalMins < 60) {
    return `${totalMins} min`;
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Converts efficiency to km/L regardless of input unit (km/L or L/100km).
 * @param {number} value 
 * @param {'kml' | 'l100'} unit 
 * @returns {number} efficiency in km per liter
 */
export function normalizeEfficiencyToKmL(value, unit) {
  if (!value || value <= 0) return 1;
  if (unit === 'l100') {
    return 100 / value;
  }
  return value;
}
