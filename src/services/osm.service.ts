/**
 * OSM service - main entry point for OpenStreetMap place search
 * Re-exports from specialized modules for backwards compatibility
 */
import { GAUTENG_CENTER } from '../constants/mapConfig';
import { haversine } from '../utils/geo';
import { overpassAreaSearch } from './overpass.service';
import { DISCOVERY_TYPES, getSearchIntentTypes, inferCategoryFromName } from './osm.constants';
import type { IOsmPlace } from '../types/osm.types';

// Re-export everything for backwards compatibility
export type { IOsmPlace } from '../types/osm.types';
export { clearOsmCache, getOsmCacheStats } from './osm.cache';
export { overpassAreaSearch } from './overpass.service';
export { isEventQuery, getSearchIntentTypes, formatOsmCategory } from './osm.constants';

/** Geocode a location name. Returns null if it resolves to a food venue (not an area). */
export const geocodePlace = async (q: string): Promise<{ lat: number; lng: number } | null> => {
  const p = new URLSearchParams({ q, format: 'json', countrycodes: 'za', limit: '1' });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${p}`, {
      headers: { 'User-Agent': 'JolApp/1.0 (https://jol.co.za)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!Array.isArray(d) || !d[0] || d[0].class === 'amenity') return null;
    return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {
    return null;
  }
};

/** Search Nominatim for a single query term */
const nominatimSearch = async (
  query: string,
  viewbox: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'za',
    limit: '20',
    addressdetails: '1',
    extratags: '1',
    viewbox,
    bounded: '0',
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'JolApp/1.0 (https://jol.co.za)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      if (import.meta.env.DEV) console.warn(`[OSM] Nominatim returned ${res.status}`);
      return [];
    }
    return (await res.json()) ?? [];
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[OSM] Nominatim request failed:', e);
    return [];
  }
};

/** Parse Nominatim results into IOsmPlace[] */
const parseNominatimResults = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any[],
  refLat: number,
  refLng: number,
  hasLocation: boolean,
): IOsmPlace[] =>
  results.flatMap((r): IOsmPlace[] => {
    const pLat = parseFloat(r.lat);
    const pLon = parseFloat(r.lon);
    if (isNaN(pLat) || isNaN(pLon)) return [];
    const addr = r.address ?? {};
    const name: string = addr.amenity ?? r.display_name.split(',')[0].trim();
    const category = DISCOVERY_TYPES.has(r.type) ? r.type : inferCategoryFromName(name);
    if (!category) return [];
    const suburb: string | null = addr.suburb ?? addr.neighbourhood ?? null;
    const address =
      [addr.house_number, addr.road, suburb].filter(Boolean).join(' ') || 'Address unavailable';
    return [
      {
        osm_id: parseInt(r.osm_id, 10),
        osm_type: r.osm_type === 'way' ? 'way' : 'node',
        name,
        address,
        suburb,
        amenity: category,
        cuisine: r.extratags?.cuisine ?? null,
        lat: pLat,
        lng: pLon,
        distance_metres: hasLocation ? haversine(refLat, refLng, pLat, pLon) : null,
      },
    ];
  });

/** Main search function - orchestrates Nominatim and Overpass searches */
export const searchOsmPlaces = async (
  query: string,
  userLat: number | null,
  userLng: number | null,
): Promise<IOsmPlace[]> => {
  const lat = userLat ?? GAUTENG_CENTER.lat;
  const lng = userLng ?? GAUTENG_CENTER.lng;
  const hasLocation = userLat !== null && userLng !== null;
  const intentTypes = getSearchIntentTypes(query);

  // Intent-based search (e.g., "amapiano", "date night")
  if (intentTypes) {
    const results = await overpassAreaSearch(lat, lng, lat, lng, hasLocation, 20, intentTypes);
    return results.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
  }

  const d = hasLocation ? 0.045 : 0.135;
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;

  // Step 1 — Nominatim name search
  let results = await nominatimSearch(query, viewbox);
  let places = parseNominatimResults(results, lat, lng, hasLocation);

  // Step 2 — Try first word only if no results
  if (places.length === 0) {
    const words = query.trim().split(/\s+/);
    if (words.length > 1) {
      results = await nominatimSearch(words[0], viewbox);
      places = parseNominatimResults(results, lat, lng, hasLocation);
    }
  }

  if (places.length > 0)
    return places.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));

  // Step 3 — Geocode as location and search area
  const coord = await geocodePlace(query);
  if (!coord) return [];
  const areaResults = await overpassAreaSearch(coord.lat, coord.lng, lat, lng, hasLocation);
  if (areaResults.length > 0) {
    return areaResults.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
  }

  // Step 4 — Fallback: Nominatim POI search
  const poiViewbox = `${coord.lng - 0.06},${coord.lat + 0.06},${coord.lng + 0.06},${coord.lat - 0.06}`;
  const poiQueries = ['restaurant', 'cafe', 'bar', 'nightclub'];
  const poiResults: IOsmPlace[] = [];
  for (const poiType of poiQueries) {
    const poiSearch = await nominatimSearch(`${poiType} ${query}`, poiViewbox);
    poiResults.push(...parseNominatimResults(poiSearch, lat, lng, hasLocation));
    if (poiResults.length >= 15) break;
  }
  const seen = new Set<number>();
  return poiResults
    .filter((p) => (seen.has(p.osm_id) ? false : (seen.add(p.osm_id), true)))
    .sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0))
    .slice(0, 20);
};
