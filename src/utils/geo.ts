/**
 * Geographic utility functions
 */

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in metres
 */
export const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Format distance in metres to a human-readable string
 * @param metres Distance in metres
 * @returns Formatted string (e.g., "500m" or "2.5 km")
 */
export const fmtDistance = (metres: number): string =>
  metres < 1000 ? `${Math.round(metres)}m` : `${(metres / 1000).toFixed(1)} km`;
