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
  // Extended fields for external place APIs (Google, etc.)
  photo_url?: string;
  rating?: number;
  source?: 'osm' | 'google' | 'foursquare';
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
  'https://overpass.openstreetmap.ru/api/interpreter', // Russian mirror, good CORS
  'https://overpass.kumi.systems/api/interpreter',
  'https://z.overpass-api.de/api/interpreter', // Alternative endpoint
  'https://lz4.overpass-api.de/api/interpreter', // LZ4 compressed endpoint
];

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const EVENT_KEYWORDS = [
  'amapiano',
  'piano',
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

const QUERY_INTENTS: Record<string, string[]> = {
  amapiano: ['nightclub', 'bar', 'pub', 'lounge'],
  piano: ['nightclub', 'bar', 'pub', 'lounge'],
  dj: ['nightclub', 'bar', 'pub', 'lounge'],
  party: ['nightclub', 'bar', 'pub', 'lounge'],
  club: ['nightclub', 'bar', 'pub', 'lounge'],
  'date night': ['restaurant', 'cafe', 'bar', 'lounge'],
  date: ['restaurant', 'cafe', 'bar', 'lounge'],
  romantic: ['restaurant', 'cafe', 'bar', 'lounge'],
  dinner: ['restaurant', 'cafe', 'bar'],
  rooftop: ['bar', 'restaurant', 'lounge'],
  sundowner: ['bar', 'restaurant', 'lounge'],
  food: ['restaurant', 'cafe', 'fast_food', 'food_court', 'bistro'],
  braai: ['restaurant', 'bar', 'pub'],
  chill: ['restaurant', 'cafe', 'bar', 'lounge'],
  jazz: ['nightclub', 'bar', 'pub', 'lounge', 'theatre'],
};

const AMENITY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  fast_food: 'Fast food',
  food_court: 'Food court',
  pub: 'Pub',
  bistro: 'Bistro',
  nightclub: 'Nightclub',
  lounge: 'Lounge',
  theatre: 'Theatre',
  cinema: 'Cinema',
  hotel: 'Hotel',
  attraction: 'Attraction',
  marketplace: 'Market',
  biergarten: 'Beer garden',
  casino: 'Casino',
};

const DISCOVERY_TYPES = new Set([
  'restaurant',
  'cafe',
  'bar',
  'fast_food',
  'food_court',
  'pub',
  'bistro',
  'nightclub',
  'lounge',
  'theatre',
  'cinema',
  'hotel',
  'attraction',
  'marketplace',
  'biergarten',
  'casino',
]);

const AMENITY_PATTERN =
  'restaurant|cafe|bar|fast_food|food_court|pub|bistro|nightclub|theatre|cinema|biergarten|casino|marketplace';
const TOURISM_PATTERN = 'hotel|attraction';
const LEISURE_PATTERN = 'adult_gaming_centre';
const NAME_PATTERN =
  'club|lounge|bar|grill|restaurant|cafe|coffee|kitchen|rooftop|pub|tavern|shisanyama|braai|jazz|casino';

const AREA_SEARCH_RADIUS_M = 6000;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export const isEventQuery = (query: string): boolean =>
  EVENT_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

export const getSearchIntentTypes = (query: string): string[] | null => {
  const q = query.toLowerCase();
  const match = Object.entries(QUERY_INTENTS).find(([keyword]) => q.includes(keyword));
  return match?.[1] ?? null;
};

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

const inferCategoryFromName = (name: string): string | null => {
  const n = name.toLowerCase();
  if (n.includes('club')) return 'nightclub';
  if (n.includes('lounge') || n.includes('rooftop')) return 'lounge';
  if (n.includes('bar')) return 'bar';
  if (n.includes('pub')) return 'pub';
  if (n.includes('grill') || n.includes('kitchen') || n.includes('restaurant')) {
    return 'restaurant';
  }
  if (n.includes('cafe') || n.includes('coffee')) return 'cafe';
  if (n.includes('casino')) return 'casino';
  return null;
};

const getElementCategory = (tags: Record<string, string>): string | null => {
  const category =
    tags.amenity ??
    tags.tourism ??
    (tags.leisure === 'adult_gaming_centre' ? 'casino' : tags.leisure) ??
    null;
  if (category && DISCOVERY_TYPES.has(category)) return category;
  if (tags.name) return inferCategoryFromName(tags.name);
  return null;
};

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

const parseOverpassElements = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[],
  refLat: number,
  refLng: number,
  hasLoc: boolean,
  intentTypes: string[] | null = null,
): IOsmPlace[] => {
  const places: IOsmPlace[] = [];
  for (const el of elements ?? []) {
    const pLat: number | undefined = el.type === 'way' ? el.center?.lat : el.lat;
    const pLon: number | undefined = el.type === 'way' ? el.center?.lon : el.lon;
    if (!pLat || !pLon) continue;
    const t = el.tags ?? {};
    const category = getElementCategory(t);
    if (!t.name || !category) continue;
    if (intentTypes && !intentTypes.includes(category)) continue;
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
      amenity: category,
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
  intentTypes: string[] | null = null,
  radiusMetres: number = AREA_SEARCH_RADIUS_M,
): Promise<IOsmPlace[]> => {
  const cacheKey = `${getCacheKey(centerLat, centerLng)}-${radiusMetres}`;
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
      refreshCacheInBackground(centerLat, centerLng, limit, cacheKey, radiusMetres);
    }

    return recalculated
      .filter((p) => !intentTypes || intentTypes.includes(p.amenity))
      .slice(0, limit);
  }

  // No cache — fetch fresh data
  return fetchAndCacheOverpass(
    centerLat,
    centerLng,
    refLat,
    refLng,
    hasLoc,
    limit,
    cacheKey,
    intentTypes,
    radiusMetres,
  );
};

const fetchAndCacheOverpass = async (
  centerLat: number,
  centerLng: number,
  refLat: number,
  refLng: number,
  hasLoc: boolean,
  limit: number,
  cacheKey: string,
  intentTypes: string[] | null,
  radiusMetres: number,
): Promise<IOsmPlace[]> => {
  // Request more than needed to have buffer for cache
  const fetchLimit = Math.max(limit, 50);
  const oq = `[out:json][timeout:10];(node["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng});way["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng}););out center ${fetchLimit};`;

  const res = await fetchOverpassWithFallback(oq);
  if (!res) return [];

  try {
    const d = await res.json();
    const places = parseOverpassElements(d.elements, refLat, refLng, hasLoc, intentTypes);

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
  radiusMetres: number,
): void => {
  // Fire and forget — don't await
  const fetchLimit = Math.max(limit, 50);
  const oq = `[out:json][timeout:10];(node["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng});way["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng}););out center ${fetchLimit};`;

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
    bounded: '0', // Don't strictly bound - allow results outside viewbox ranked lower
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'JolApp/1.0 (https://jol.co.za)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[OSM] Nominatim returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[OSM] Nominatim request failed:', e);
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

export const searchOsmPlaces = async (
  query: string,
  userLat: number | null,
  userLng: number | null,
): Promise<IOsmPlace[]> => {
  const lat = userLat ?? GAUTENG_CENTER.lat;
  const lng = userLng ?? GAUTENG_CENTER.lng;
  const hasLocation = userLat !== null && userLng !== null;
  const intentTypes = getSearchIntentTypes(query);

  if (intentTypes) {
    const intentResults = await overpassAreaSearch(
      lat,
      lng,
      lat,
      lng,
      hasLocation,
      20,
      intentTypes,
      AREA_SEARCH_RADIUS_M,
    );
    return intentResults.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
  }

  const d = hasLocation ? 0.045 : 0.135;
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;

  // Step 1 — Nominatim name search (finds "KFC", "Kuai" etc.)
  let results = await nominatimSearch(query, viewbox);
  let places = parseNominatimResults(results, lat, lng, hasLocation);

  // Step 2 — If no results, try searching the first word only (handles "Piatto Kyalami" → "Piatto")
  if (places.length === 0) {
    const words = query.trim().split(/\s+/);
    if (words.length > 1) {
      results = await nominatimSearch(words[0], viewbox);
      places = parseNominatimResults(results, lat, lng, hasLocation);
    }
  }

  if (places.length > 0)
    return places.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));

  // Step 3 — No food places by name. Try geocoding as a location ("Sandton", "Rosebank", etc.)
  // then run an Overpass area search centred on those coordinates.
  const coord = await geocodePlace(query);
  if (!coord) return [];
  const areaResults = await overpassAreaSearch(coord.lat, coord.lng, lat, lng, hasLocation);
  if (areaResults.length > 0) {
    return areaResults.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
  }

  // Step 4 — Overpass failed (CORS/timeout). Try Nominatim POI search as last resort.
  // Search for restaurant/cafe/bar near the geocoded area
  const poiViewbox = `${coord.lng - 0.06},${coord.lat + 0.06},${coord.lng + 0.06},${coord.lat - 0.06}`;
  const poiQueries = ['restaurant', 'cafe', 'bar', 'nightclub'];
  const poiResults: IOsmPlace[] = [];
  for (const poiType of poiQueries) {
    const poiSearch = await nominatimSearch(`${poiType} ${query}`, poiViewbox);
    const parsed = parseNominatimResults(poiSearch, lat, lng, hasLocation);
    poiResults.push(...parsed);
    if (poiResults.length >= 15) break; // Stop early if we have enough
  }
  // Dedupe by osm_id
  const seen = new Set<number>();
  const deduped = poiResults.filter((p) => {
    if (seen.has(p.osm_id)) return false;
    seen.add(p.osm_id);
    return true;
  });
  return deduped.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0)).slice(0, 20);
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
