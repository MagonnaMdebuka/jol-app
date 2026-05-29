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

/** Overpass area search — finds food places within 3 km of a point (no name filter). */
export const overpassAreaSearch = async (
  centerLat: number,
  centerLng: number,
  refLat: number,
  refLng: number,
  hasLoc: boolean,
  limit: number = 20,
): Promise<IOsmPlace[]> => {
  const oq = `[out:json][timeout:8];(node["amenity"~"${AMENITY_PATTERN}"](around:3000,${centerLat},${centerLng});way["amenity"~"${AMENITY_PATTERN}"](around:3000,${centerLat},${centerLng}););out center ${limit};`;
  const url = new URL('https://overpass.kumi.systems/api/interpreter');
  url.searchParams.set('data', oq);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.warn(`[OSM] Overpass area search ${res.status}`);
      return [];
    }
    const d = await res.json();
    return parseOverpassElements(d.elements, refLat, refLng, hasLoc);
  } catch {
    return [];
  }
};

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
