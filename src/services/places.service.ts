import {
  getFoursquareApiKey,
  isFoursquareEnabled,
  getGooglePlacesApiKey,
  isGooglePlacesEnabled,
  isSupabaseEnabled,
} from '../config/env';
import { supabase } from '../config/supabase';
import type {
  IPlaceResult,
  PlaceSource,
  IFoursquareResponse,
  IFoursquarePlace,
  IFoursquarePhoto,
  IGooglePlacesResponse,
  IGooglePlace,
} from '../types/place.types';
import type { IOsmPlace } from './osm.service';

const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3/places';
const GOOGLE_PLACES_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

// Google Places types relevant to Jol (nightlife & food discovery)
// Using Place Types from https://developers.google.com/maps/documentation/places/web-service/place-types
const GOOGLE_PLACE_TYPES = [
  'restaurant',
  'bar',
  'night_club',
  'cafe',
  'meal_takeaway',
  'meal_delivery',
  'bakery',
  'movie_theater',
  'casino',
];

// ============ Foursquare ============

const buildFoursquarePhotoUrl = (photo: IFoursquarePhoto): string => {
  return `${photo.prefix}800x600${photo.suffix}`;
};

const transformFoursquarePlace = (place: IFoursquarePlace): IPlaceResult => {
  const location = place.location;
  const addressParts = [location.address, location.locality, location.region].filter(Boolean);
  const photos = place.photos?.map(buildFoursquarePhotoUrl) ?? [];

  return {
    fsq_id: place.fsq_id,
    name: place.name,
    address: addressParts.join(', ') || location.formatted_address || '',
    lat: place.geocodes.main.latitude,
    lng: place.geocodes.main.longitude,
    category: place.categories[0]?.name ?? 'Venue',
    photo_url: photos[0] ?? null,
    photos,
    rating: place.rating ?? null,
    source: 'foursquare',
  };
};

const searchFoursquare = async (
  query: string,
  lat: number,
  lng: number,
): Promise<IPlaceResult[]> => {
  if (!isFoursquareEnabled()) return [];

  const params = new URLSearchParams({
    query,
    ll: `${lat},${lng}`,
    radius: '5000',
    limit: '10',
    fields: 'fsq_id,name,location,geocodes,categories,photos,rating',
  });

  try {
    const response = await fetch(`${FOURSQUARE_BASE_URL}/search?${params}`, {
      headers: {
        Accept: 'application/json',
        Authorization: getFoursquareApiKey(),
      },
    });

    if (!response.ok) return [];
    const data: IFoursquareResponse = await response.json();
    return data.results.map(transformFoursquarePlace);
  } catch {
    return [];
  }
};

// ============ Google Places ============

const buildGooglePhotoUrl = (photoName: string, apiKey: string): string => {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
};

const transformGooglePlace = (place: IGooglePlace, apiKey: string): IPlaceResult => {
  const photos = place.photos?.map((p) => buildGooglePhotoUrl(p.name, apiKey)) ?? [];

  return {
    google_place_id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    lat: place.location.latitude,
    lng: place.location.longitude,
    category: place.primaryTypeDisplayName?.text ?? place.primaryType ?? 'Venue',
    photo_url: photos[0] ?? null,
    photos,
    rating: place.rating ?? null,
    source: 'google',
  };
};

const GOOGLE_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.photos,places.rating,places.userRatingCount';

const searchGoogle = async (query: string, lat: number, lng: number): Promise<IPlaceResult[]> => {
  if (!isGooglePlacesEnabled()) return [];

  const apiKey = getGooglePlacesApiKey();

  try {
    const response = await fetch(GOOGLE_PLACES_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 5000.0,
          },
        },
        maxResultCount: 10,
      }),
    });

    if (!response.ok) return [];
    const data: IGooglePlacesResponse = await response.json();
    return (data.places ?? []).map((p) => transformGooglePlace(p, apiKey));
  } catch {
    return [];
  }
};

/**
 * Search Google Places with text query for discovery
 * Includes type filtering for nightlife/food venues
 */
export const searchGooglePlaces = async (
  query: string,
  lat: number,
  lng: number,
  limit: number = 20,
): Promise<IPlaceResult[]> => {
  if (!isGooglePlacesEnabled()) return [];

  const apiKey = getGooglePlacesApiKey();

  try {
    const response = await fetch(GOOGLE_PLACES_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        includedType: undefined, // Let Google infer from query
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 10000.0, // 10km radius for broader discovery
          },
        },
        maxResultCount: Math.min(limit, 20), // Google max is 20
      }),
    });

    if (!response.ok) {
      console.warn('[Google Places] Text search failed:', response.status);
      return [];
    }
    const data: IGooglePlacesResponse = await response.json();
    return (data.places ?? []).map((p) => transformGooglePlace(p, apiKey));
  } catch (e) {
    console.warn('[Google Places] Text search error:', e);
    return [];
  }
};

/**
 * Search nearby places using Google Places Nearby Search
 * Great for "what's around me" discovery
 */
export const searchGoogleNearby = async (
  lat: number,
  lng: number,
  radiusMetres: number = 5000,
  limit: number = 20,
): Promise<IPlaceResult[]> => {
  if (!isGooglePlacesEnabled()) return [];

  const apiKey = getGooglePlacesApiKey();

  try {
    const response = await fetch(GOOGLE_PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': GOOGLE_FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: GOOGLE_PLACE_TYPES,
        maxResultCount: Math.min(limit, 20),
        rankPreference: 'DISTANCE',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMetres,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Google Places] Nearby search failed:', response.status, errorText);
      return [];
    }
    const data: IGooglePlacesResponse = await response.json();
    return (data.places ?? []).map((p) => transformGooglePlace(p, apiKey));
  } catch (e) {
    console.warn('[Google Places] Nearby search error:', e);
    return [];
  }
};

// ============ Conversion to OSM-compatible format ============

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Convert Google Places result to OSM-compatible format
 * Enables reuse of existing OSM UI components
 */
export const placeResultToOsmFormat = (
  place: IPlaceResult,
  refLat: number | null,
  refLng: number | null,
): IOsmPlace => ({
  osm_id: parseInt(place.google_place_id?.replace(/[^0-9]/g, '') ?? '0', 10) || Date.now(),
  osm_type: 'node',
  name: place.name,
  address: place.address,
  suburb: null, // Google doesn't separate suburb
  amenity: place.category.toLowerCase().replace(/\s+/g, '_'),
  cuisine: null,
  lat: place.lat,
  lng: place.lng,
  distance_metres:
    refLat !== null && refLng !== null ? haversine(refLat, refLng, place.lat, place.lng) : null,
  // Extended fields for Google data
  photo_url: place.photo_url ?? undefined,
  rating: place.rating ?? undefined,
  source: 'google' as const,
});

// ============ Unified Search with Fallback ============

/**
 * Search for places using Foursquare first, then Google as fallback
 * @param query - Search query (venue name, type, etc.)
 * @param lat - Latitude of search center
 * @param lng - Longitude of search center
 * @returns Array of place results (empty if no API enabled or no results)
 */
export const searchPlacesWithFallback = async (
  query: string,
  lat: number,
  lng: number,
): Promise<IPlaceResult[]> => {
  // Try Foursquare first
  const foursquareResults = await searchFoursquare(query, lat, lng);
  if (foursquareResults.length > 0) return foursquareResults;

  // Fall back to Google if Foursquare returns empty
  return searchGoogle(query, lat, lng);
};

// Legacy export for backward compatibility
export const searchPlaces = searchPlacesWithFallback;

/**
 * Get detailed place information by Foursquare ID
 * @param fsqId - Foursquare place ID
 * @returns Place result or null if not found
 */
export const getPlaceDetails = async (fsqId: string): Promise<IPlaceResult | null> => {
  if (!isFoursquareEnabled()) return null;

  const params = new URLSearchParams({
    fields: 'fsq_id,name,location,geocodes,categories,photos,rating',
  });

  try {
    const response = await fetch(`${FOURSQUARE_BASE_URL}/${fsqId}?${params}`, {
      headers: {
        Accept: 'application/json',
        Authorization: getFoursquareApiKey(),
      },
    });

    if (!response.ok) return null;
    const place: IFoursquarePlace = await response.json();
    return transformFoursquarePlace(place);
  } catch {
    return null;
  }
};

// ============ Caching ============

interface ICachePlaceData {
  fsq_id?: string | null;
  google_place_id?: string | null;
  cached_photos: string[];
  cached_rating: number | null;
  cached_category: string;
  place_source: PlaceSource;
  cache_fetched_at: string;
}

/**
 * Cache place data to a venue record in Supabase
 * @param venueId - The venue ID to update
 * @param place - The place result to cache
 */
export const cachePlace = async (
  venueId: string,
  place: IPlaceResult,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { error: null }; // No-op in mock mode
  }

  const cacheData: ICachePlaceData = {
    fsq_id: place.fsq_id ?? null,
    google_place_id: place.google_place_id ?? null,
    cached_photos: place.photos ?? (place.photo_url ? [place.photo_url] : []),
    cached_rating: place.rating,
    cached_category: place.category,
    place_source: place.source,
    cache_fetched_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('venues').update(cacheData).eq('id', venueId);

  return { error: error?.message ?? null };
};

/**
 * Get cached place data from a venue record
 * @param venueId - The venue ID to read from
 * @returns Cached place data or null if not found/cached
 */
export const getPlaceFromCache = async (venueId: string): Promise<ICachePlaceData | null> => {
  if (!isSupabaseEnabled() || !supabase) return null;

  const { data, error } = await supabase
    .from('venues')
    .select(
      'fsq_id, google_place_id, cached_photos, cached_rating, cached_category, place_source, cache_fetched_at',
    )
    .eq('id', venueId)
    .single();

  if (error || !data?.place_source) return null;

  return {
    fsq_id: data.fsq_id,
    google_place_id: data.google_place_id,
    cached_photos: (data.cached_photos as string[]) ?? [],
    cached_rating: data.cached_rating,
    cached_category: data.cached_category,
    place_source: data.place_source as PlaceSource,
    cache_fetched_at: data.cache_fetched_at,
  };
};
