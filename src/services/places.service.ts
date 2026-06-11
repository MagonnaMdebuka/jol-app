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

const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3/places';
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';

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

const searchGoogle = async (query: string, lat: number, lng: number): Promise<IPlaceResult[]> => {
  if (!isGooglePlacesEnabled()) return [];

  const apiKey = getGooglePlacesApiKey();

  try {
    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.photos,places.rating',
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
