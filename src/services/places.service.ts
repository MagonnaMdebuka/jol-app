import { getFoursquareApiKey, isFoursquareEnabled } from '../config/env';
import type {
  IPlaceResult,
  IFoursquareResponse,
  IFoursquarePlace,
  IFoursquarePhoto,
} from '../types/place.types';

const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3/places';

/**
 * Build the photo URL from Foursquare photo prefix/suffix
 */
const buildPhotoUrl = (photo: IFoursquarePhoto): string => {
  return `${photo.prefix}800x600${photo.suffix}`;
};

/**
 * Transform a Foursquare place to our IPlaceResult format
 */
const transformPlace = (place: IFoursquarePlace): IPlaceResult => {
  const location = place.location;
  const addressParts = [location.address, location.locality, location.region].filter(Boolean);

  return {
    fsq_id: place.fsq_id,
    name: place.name,
    address: addressParts.join(', ') || location.formatted_address || '',
    lat: place.geocodes.main.latitude,
    lng: place.geocodes.main.longitude,
    category: place.categories[0]?.name ?? 'Venue',
    photo_url: place.photos?.[0] ? buildPhotoUrl(place.photos[0]) : null,
    rating: place.rating ?? null,
  };
};

/**
 * Search for places near a location using Foursquare Places API
 * @param query - Search query (venue name, type, etc.)
 * @param lat - Latitude of search center
 * @param lng - Longitude of search center
 * @returns Array of place results (empty if API disabled or error)
 */
export const searchPlaces = async (
  query: string,
  lat: number,
  lng: number,
): Promise<IPlaceResult[]> => {
  if (!isFoursquareEnabled()) {
    return [];
  }

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

    if (!response.ok) {
      console.error('Foursquare API error:', response.status, response.statusText);
      return [];
    }

    const data: IFoursquareResponse = await response.json();
    return data.results.map(transformPlace);
  } catch (error) {
    console.error('Foursquare search failed:', error);
    return [];
  }
};

/**
 * Get detailed place information by Foursquare ID
 * @param fsqId - Foursquare place ID
 * @returns Place result or null if not found
 */
export const getPlaceDetails = async (fsqId: string): Promise<IPlaceResult | null> => {
  if (!isFoursquareEnabled()) {
    return null;
  }

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

    if (!response.ok) {
      console.error('Foursquare place details error:', response.status);
      return null;
    }

    const place: IFoursquarePlace = await response.json();
    return transformPlace(place);
  } catch (error) {
    console.error('Foursquare getPlaceDetails failed:', error);
    return null;
  }
};
