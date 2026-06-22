/**
 * Overpass API service for querying OpenStreetMap data
 */
import { haversine } from '../utils/geo';
import { getCacheKey, getCache, setCache, isCacheStale } from './osm.cache';
import type { IOsmPlace } from '../types/osm.types';
import {
  AMENITY_PATTERN,
  TOURISM_PATTERN,
  LEISURE_PATTERN,
  NAME_PATTERN,
  DISCOVERY_TYPES,
  inferCategoryFromName,
} from './osm.constants';

const OVERPASS_SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const AREA_SEARCH_RADIUS_M = 6000;

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

const fetchOverpassWithFallback = async (query: string): Promise<Response | null> => {
  for (const server of OVERPASS_SERVERS) {
    const url = new URL(server);
    url.searchParams.set('data', query);
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
      if (res.ok) return res;
      if (import.meta.env.DEV)
        console.warn(`[OSM] ${server} returned ${res.status}, trying next...`);
    } catch (e) {
      if (import.meta.env.DEV) console.warn(`[OSM] ${server} failed, trying next...`, e);
    }
  }
  return null;
};

const buildOverpassQuery = (
  centerLat: number,
  centerLng: number,
  radiusMetres: number,
  fetchLimit: number,
): string =>
  `[out:json][timeout:10];(node["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["tourism"~"${TOURISM_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});way["leisure"~"${LEISURE_PATTERN}"](around:${radiusMetres},${centerLat},${centerLng});node["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng});way["name"~"${NAME_PATTERN}",i](around:${radiusMetres},${centerLat},${centerLng}););out center ${fetchLimit};`;

const refreshCacheInBackground = (
  centerLat: number,
  centerLng: number,
  limit: number,
  cacheKey: string,
  radiusMetres: number,
): void => {
  const fetchLimit = Math.max(limit, 50);
  const oq = buildOverpassQuery(centerLat, centerLng, radiusMetres, fetchLimit);

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
  const fetchLimit = Math.max(limit, 50);
  const oq = buildOverpassQuery(centerLat, centerLng, radiusMetres, fetchLimit);
  const res = await fetchOverpassWithFallback(oq);
  if (!res) return [];

  try {
    const d = await res.json();
    const places = parseOverpassElements(d.elements, refLat, refLng, hasLoc, intentTypes);
    const toCache = places.map((p) => ({ ...p, distance_metres: null }));
    setCache(cacheKey, toCache);
    return places.slice(0, limit);
  } catch {
    return [];
  }
};

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

  if (cached) {
    const recalculated = cached.data.map((p) => ({
      ...p,
      distance_metres: hasLoc ? haversine(refLat, refLng, p.lat, p.lng) : null,
    }));

    if (isCacheStale(cached)) {
      refreshCacheInBackground(centerLat, centerLng, limit, cacheKey, radiusMetres);
    }

    return recalculated
      .filter((p) => !intentTypes || intentTypes.includes(p.amenity))
      .slice(0, limit);
  }

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
