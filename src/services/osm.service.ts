import { GAUTENG_CENTER } from '../constants/mapConfig';

export interface IOsmPlace {
  osm_id: number;
  osm_type: 'node' | 'way';
  name: string;
  address: string;
  suburb: string | null;
  amenity: string;
  cuisine: string | null;
  lat: number;
  lng: number;
  distance_metres: number | null;
}

// ─────────────────────────────────────────────────────────────
// Cache Configuration
// ─────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = 'jol-osm-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour — refresh in background after this

interface ICacheEntry {
  data: IOsmPlace[];
  timestamp: number;
}

/** Round coordinate to 3 decimal places (~111m precision) for better cache hits */
const roundCoord = (n: number): number => Math.round(n * 1000) / 1000;

/** Cache key excludes limit — we always fetch 50+ and slice on read */
const getCacheKey = (lat: number, lng: number): string =>
  `${CACHE_KEY_PREFIX}${roundCoord(lat)},${roundCoord(lng)}`;

const getCache = (key: string): ICacheEntry | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: ICacheEntry = JSON.parse(raw);
    // Expired — remove and return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

const setCache = (key: string, data: IOsmPlace[]): void => {
  try {
    const entry: ICacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — ignore
  }
};

const isCacheStale = (entry: ICacheEntry): boolean => Date.now() - entry.timestamp > STALE_TTL_MS;

// ─────────────────────────────────────────────────────────────
// Overpass Server Fallback
// ─────────────────────────────────────────────────────────────

const OVERPASS_SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const EVENT_KEYWORDS = [
  'amapiano',
  'dj',
  'party',
  'event',
  'tonight',
  'concert',
  'jazz',
  'hiphop',
  'hip hop',
  'house',
  'afrobeats',
  'rnb',
  'r&b',
  'deep house',
];

const AMENITY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  fast_food: 'Fast food',
  food_court: 'Food court',
  pub: 'Pub',
  bistro: 'Bistro',
};

const FOOD_TYPES = new Set([
  'restaurant',
  'cafe',
  'bar',
  'fast_food',
  'food_court',
  'pub',
  'bistro',
]);

const AMENITY_PATTERN = 'restaurant|cafe|bar|fast_food|food_court|pub|bistro';

// Search radius in metres (reduced from 3000 for faster queries)
const SEARCH_RADIUS_M = 2000;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export const isEventQuery = (query: string): boolean =>
  EVENT_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

export const formatOsmCategory = (amenity: string, cuisine: string | null): string => {
  const base = AMENITY_LABELS[amenity] ?? amenity;
  if (!cuisine) return base;
  const first = cuisine.split(';')[0].trim();
  return `${base} · ${first.charAt(0).toUpperCase()}${first.slice(1)}`;
};

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Geocode a location name. Returns null if it resolves to a food venue (not an area). */
export const geocodePlace = async (q: string): Promise<{ lat: number; lng: number } | null> => {
  const p = new URLSearchParams({ q, format: 'json', countrycodes: 'za', limit: '1' });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${p}`, {
      signal: AbortSignal.timeout(4000),
    });
    const d = await res.json();
    if (!d[0] || d[0].class === 'amenity') return null;
    return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {
    return null;
  }
};

const parseOverpassElements = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[],
  refLat: number,
  refLng: number,
  hasLoc: boolean,
): IOsmPlace[] => {
  const places: IOsmPlace[] = [];
  for (const el of elements ?? []) {
    const pLat: number | undefined = el.type === 'way' ? el.center?.lat : el.lat;
    const pLon: number | undefined = el.type === 'way' ? el.center?.lon : el.lon;
    if (!pLat || !pLon) continue;
    const t = el.tags ?? {};
    if (!t.name || !FOOD_TYPES.has(t.amenity)) continue;
    const suburb: string | null = t['addr:suburb'] ?? t.suburb ?? null;
    const address =
      [t['addr:housenumber'], t['addr:street'], suburb].filter(Boolean).join(' ') ||
      'Address unavailable';
    places.push({
      osm_id: el.id as number,
      osm_type: el.type === 'way' ? 'way' : 'node',
      name: t.name as string,
      address,
      suburb,
      amenity: t.amenity as string,
      cuisine: t.cuisine ?? null,
      lat: pLat,
      lng: pLon,
      distance_metres: hasLoc ? haversine(refLat, refLng, pLat, pLon) : null,
    });
  }
  return places;
};

// ─────────────────────────────────────────────────────────────
// Overpass Fetch with Server Fallback
// ─────────────────────────────────────────────────────────────

const fetchOverpassWithFallback = async (query: string): Promise<Response | null> => {
  for (const server of OVERPASS_SERVERS) {
    const url = new URL(server);
    url.searchParams.set('data', query);
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
      console.warn(`[OSM] ${server} returned ${res.status}, trying next...`);
    } catch (e) {
      console.warn(`[OSM] ${server} failed, trying next...`, e);
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// Core Overpass Search (with caching)
// ─────────────────────────────────────────────────────────────

/** Overpass area search — finds food places within radius of a point. */
export const overpassAreaSearch = async (
  centerLat: number,
  centerLng: number,
  refLat: number,
  refLng: number,
  hasLoc: boolean,
  limit: number = 20,
): Promise<IOsmPlace[]> => {
  const cacheKey = getCacheKey(centerLat, centerLng);
  const cached = getCache(cacheKey);

  // If we have cached data, use it
  if (cached) {
    // Recalculate distances based on current user position
    const recalculated = cached.data.map((p) => ({
      ...p,
      distance_metres: hasLoc ? haversine(refLat, refLng, p.lat, p.lng) : null,
    }));

    // If cache is stale but not expired, refresh in background
    if (isCacheStale(cached)) {
      refreshCacheInBackground(centerLat, centerLng, limit, cacheKey);
    }

    return recalculated.slice(0, limit);
  }

  // No cache — fetch fresh data
  return fetchAndCacheOverpass(centerLat, centerLng, refLat, refLng, hasLoc, limit, cacheKey);
};

const fetchAndCacheOverpass = async (
  centerLat: number,
  centerLng: number,
  refLat: number,
  refLng: number,
  hasLoc: boolean,
  limit: number,
  cacheKey: string,
): Promise<IOsmPlace[]> => {
  // Request more than needed to have buffer for cache
  const fetchLimit = Math.max(limit, 50);
  const oq = `[out:json][timeout:10];(node["amenity"~"${AMENITY_PATTERN}"](around:${SEARCH_RADIUS_M},${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:${SEARCH_RADIUS_M},${centerLat},${centerLng}););out center ${fetchLimit};`;

  const res = await fetchOverpassWithFallback(oq);
  if (!res) return [];

  try {
    const d = await res.json();
    const places = parseOverpassElements(d.elements, refLat, refLng, hasLoc);

    // Cache the full result set (without distance, we recalculate on read)
    const toCache = places.map((p) => ({ ...p, distance_metres: null }));
    setCache(cacheKey, toCache);

    return places.slice(0, limit);
  } catch {
    return [];
  }
};

const refreshCacheInBackground = (
  centerLat: number,
  centerLng: number,
  limit: number,
  cacheKey: string,
): void => {
  // Fire and forget — don't await
  const fetchLimit = Math.max(limit, 50);
  const oq = `[out:json][timeout:10];(node["amenity"~"${AMENITY_PATTERN}"](around:${SEARCH_RADIUS_M},${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:${SEARCH_RADIUS_M},${centerLat},${centerLng}););out center ${fetchLimit};`;

  fetchOverpassWithFallback(oq)
    .then(async (res) => {
      if (!res) return;
      const d = await res.json();
      const places = parseOverpassElements(d.elements, 0, 0, false);
      const toCache = places.map((p) => ({ ...p, distance_metres: null }));
      setCache(cacheKey, toCache);
    })
    .catch(() => {
      // Silent fail for background refresh
    });
};

// ─────────────────────────────────────────────────────────────
// Main Search Function
// ─────────────────────────────────────────────────────────────

export const searchOsmPlaces = async (
  query: string,
  userLat: number | null,
  userLng: number | null,
): Promise<IOsmPlace[]> => {
  if (isEventQuery(query)) return [];

  const lat = userLat ?? GAUTENG_CENTER.lat;
  const lng = userLng ?? GAUTENG_CENTER.lng;
  const hasLocation = userLat !== null && userLng !== null;
  const d = hasLocation ? 0.045 : 0.135;
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;

  // Step 1 — Nominatim name search (finds "KFC", "Kuai" etc.)
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'za',
    limit: '20',
    addressdetails: '1',
    extratags: '1',
    viewbox,
    bounded: '1',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: any[] = [];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) results = await res.json();
    else console.warn(`[OSM] Nominatim ${res.status}`);
  } catch (e) {
    console.warn('[OSM] Nominatim failed', e);
  }

  const places: IOsmPlace[] = results
    .filter((r) => r.class === 'amenity' && FOOD_TYPES.has(r.type))
    .flatMap((r): IOsmPlace[] => {
      const pLat = parseFloat(r.lat);
      const pLon = parseFloat(r.lon);
      if (isNaN(pLat) || isNaN(pLon)) return [];
      const addr = r.address ?? {};
      const name: string = addr.amenity ?? r.display_name.split(',')[0].trim();
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
          amenity: r.type,
          cuisine: r.extratags?.cuisine ?? null,
          lat: pLat,
          lng: pLon,
          distance_metres: hasLocation ? haversine(lat, lng, pLat, pLon) : null,
        },
      ];
    });

  if (places.length > 0)
    return places.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));

  // Step 2 — No food places by name. Try geocoding as a location ("Sandton", "Rosebank", etc.)
  // then run an Overpass area search centred on those coordinates.
  const coord = await geocodePlace(query);
  if (!coord) return [];
  const areaResults = await overpassAreaSearch(coord.lat, coord.lng, lat, lng, hasLocation);
  return areaResults.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
};

// ─────────────────────────────────────────────────────────────
// Cache Management (for debugging / settings)
// ─────────────────────────────────────────────────────────────

/** Clear all OSM cache entries */
export const clearOsmCache = (): void => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_KEY_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
};

/** Get cache stats for debugging */
export const getOsmCacheStats = (): { entries: number; sizeKB: number } => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_KEY_PREFIX));
  let totalSize = 0;
  keys.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v) totalSize += v.length * 2; // UTF-16, 2 bytes per char
  });
  return { entries: keys.length, sizeKB: Math.round(totalSize / 1024) };
};
