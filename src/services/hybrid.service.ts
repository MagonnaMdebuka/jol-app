/**
 * Hybrid Feed Service
 * Combines owner-created listings with Google Places / OSM data
 */

import type { IListingWithDistance } from '../types/listing.types';
import type { IOsmPlace } from './osm.service';
import { overpassAreaSearch } from './osm.service';
import { searchGoogleNearby, placeResultToOsmFormat } from './places.service';
import { isGooglePlacesEnabled } from '../config/env';

// Amenity to listing type mapping
const FOOD_AMENITIES = new Set([
  'restaurant',
  'cafe',
  'fast_food',
  'food_court',
  'bistro',
  'coffee_shop',
  'bakery',
  'ice_cream',
  'food',
]);

/**
 * Convert an OSM place to IListingWithDistance format for display in Feed
 */
export const osmPlaceToListing = (place: IOsmPlace): IListingWithDistance => {
  const isFood = FOOD_AMENITIES.has(place.amenity);
  const type = isFood ? 'food' : 'event';

  return {
    // Use osm_id as string ID with prefix to avoid collisions
    id: `osm-${place.osm_type}-${place.osm_id}`,
    venue_id: `osm-venue-${place.osm_id}`,
    owner_id: '', // No owner - OSM place
    type,
    title: place.name,
    description: null,
    address: place.address,
    location: { lat: place.lat, lng: place.lng },
    images: place.photo_url ? [place.photo_url] : [],
    status: 'active',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance_metres: place.distance_metres ?? 0,
    venue_name: place.name,

    // Event fields
    event_date: null,
    event_end_date: null,
    entry_fee: null,
    dress_code: null,
    artist: null,
    age_restriction: null,
    tags: null,
    capacity: null,

    // Food fields
    cuisine_type: place.cuisine ?? formatAmenity(place.amenity),
    opening_hours: null,
    price_range: null,
    special: null,

    // Discovery fields
    vibe: type === 'food' ? ['Chill'] : ['Go out'],
    when_chip: undefined,
  };
};

/**
 * Format amenity string for display
 */
const formatAmenity = (amenity: string): string => {
  return amenity
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Fetch nearby places from Google Places or OSM
 */
export const fetchNearbyPlaces = async (
  lat: number,
  lng: number,
  radiusMetres: number = 10000,
  limit: number = 30,
): Promise<IListingWithDistance[]> => {
  // Try Google Places first if enabled
  if (isGooglePlacesEnabled()) {
    try {
      const googleResults = await searchGoogleNearby(lat, lng, radiusMetres, limit);
      if (googleResults.length > 0) {
        const osmFormatted = googleResults.map((p) => placeResultToOsmFormat(p, lat, lng));
        return osmFormatted.map(osmPlaceToListing);
      }
    } catch (e) {
      console.warn('[Hybrid] Google Places failed, falling back to OSM:', e);
    }
  }

  // Fall back to OSM Overpass
  try {
    const osmResults = await overpassAreaSearch(
      lat,
      lng,
      lat,
      lng,
      true,
      limit,
      null,
      radiusMetres,
    );
    return osmResults.map(osmPlaceToListing);
  } catch (e) {
    console.warn('[Hybrid] OSM search failed:', e);
    return [];
  }
};

/**
 * Merge owner listings with OSM places
 * Owner listings take priority - if names match (fuzzy), use owner listing
 */
export const mergeListingsWithPlaces = (
  ownerListings: IListingWithDistance[],
  osmPlaces: IListingWithDistance[],
): IListingWithDistance[] => {
  // Create a set of normalized owner listing names for deduplication
  const ownerNames = new Set(ownerListings.map((l) => normalizeName(l.title)));

  // Filter out OSM places that match owner listings
  const uniqueOsmPlaces = osmPlaces.filter((place) => !ownerNames.has(normalizeName(place.title)));

  // Combine: owner listings first (they're verified), then OSM places
  const combined = [...ownerListings, ...uniqueOsmPlaces];

  // Sort by distance
  return combined.sort((a, b) => (a.distance_metres ?? 0) - (b.distance_metres ?? 0));
};

/**
 * Normalize name for fuzzy matching
 */
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
};

/**
 * Check if a listing is from OSM/Google (not owner-created)
 */
export const isExternalPlace = (listing: IListingWithDistance): boolean => {
  return listing.id.startsWith('osm-');
};

/**
 * Check if a listing is owner-verified
 */
export const isOwnerVerified = (listing: IListingWithDistance): boolean => {
  return !listing.id.startsWith('osm-') && !!listing.owner_id;
};
