/**
 * Search Service
 * Provides database-powered search with Google Places / OSM fallback
 */

import { supabase } from '../config/supabase';
import { isSupabaseEnabled, isGooglePlacesEnabled } from '../config/env';
import { searchGooglePlaces } from './places.service';
import { searchOsmPlaces } from './osm.service';
import type { IListingWithDistance } from '../types/listing.types';
import type { IPlaceResult } from '../types/place.types';
import type { IOsmPlace } from '../types/osm.types';

/**
 * Transform Google/Foursquare place result to listing format
 */
const placeToListing = (place: IPlaceResult, index: number): IListingWithDistance => {
  const isFood = /restaurant|cafe|bakery|food|meal|pizza|burger|chicken|grill/i.test(
    place.category,
  );
  return {
    id: `place-${place.google_place_id ?? place.fsq_id ?? index}`,
    venue_id: '',
    owner_id: '',
    type: isFood ? 'food' : 'event',
    title: place.name,
    description: place.category,
    address: place.address,
    location: { lat: place.lat, lng: place.lng },
    images: place.photos ?? (place.photo_url ? [place.photo_url] : []),
    status: 'active',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    event_date: null,
    event_end_date: null,
    entry_fee: null,
    dress_code: null,
    artist: null,
    age_restriction: null,
    tags: [place.category],
    capacity: null,
    cuisine_type: isFood ? place.category : null,
    opening_hours: null,
    price_range: null,
    special: null,
    distance_metres: 0,
    venue_name: place.name,
    vibe: [],
  };
};

/**
 * Transform OSM place result to listing format
 */
const osmToListing = (place: IOsmPlace): IListingWithDistance => {
  const isFood = /restaurant|cafe|fast_food|food|bakery/i.test(place.amenity);
  return {
    id: `osm-${place.osm_id}`,
    venue_id: '',
    owner_id: '',
    type: isFood ? 'food' : 'event',
    title: place.name,
    description: place.cuisine ?? place.amenity.replace(/_/g, ' '),
    address: place.address,
    location: { lat: place.lat, lng: place.lng },
    images: place.photo_url ? [place.photo_url] : [],
    status: 'active',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    event_date: null,
    event_end_date: null,
    entry_fee: null,
    dress_code: null,
    artist: null,
    age_restriction: null,
    tags: [place.amenity.replace(/_/g, ' ')],
    capacity: null,
    cuisine_type: place.cuisine ?? (isFood ? place.amenity.replace(/_/g, ' ') : null),
    opening_hours: null,
    price_range: null,
    special: null,
    distance_metres: place.distance_metres ?? 0,
    venue_name: place.name,
    vibe: [],
  };
};

/**
 * Search external APIs (Google Places, then OSM) for real-time discovery
 */
const searchExternalPlaces = async (
  query: string,
  lat: number,
  lng: number,
  limit: number,
): Promise<IListingWithDistance[]> => {
  // Try Google Places first (if API key available)
  if (isGooglePlacesEnabled()) {
    const googleResults = await searchGooglePlaces(query, lat, lng, limit);
    if (googleResults.length > 0) {
      return googleResults.map((p, i) => placeToListing(p, i));
    }
  }

  // Fall back to OSM (free, no API key needed)
  const osmResults = await searchOsmPlaces(query, lat, lng);
  return osmResults.slice(0, limit).map(osmToListing);
};

/**
 * Search listings by query string using database
 * Falls back to Google Places / OSM when Supabase is disabled or returns no results
 */
export const searchListings = async (
  query: string,
  lat: number,
  lng: number,
  radiusMetres: number = 20000,
  limit: number = 50,
): Promise<IListingWithDistance[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // If Supabase is disabled, go directly to external search
  if (!isSupabaseEnabled() || !supabase) {
    return searchExternalPlaces(trimmed, lat, lng, limit);
  }

  const pattern = `%${trimmed}%`;

  const { data, error } = await supabase.rpc('search_listings', {
    search_query: pattern,
    lat,
    lng,
    radius_metres: radiusMetres,
    result_limit: limit,
  });

  if (error) {
    if (import.meta.env.DEV) console.error('searchListings error:', error.message);
    // Fallback to simple query if RPC doesn't exist
    const fallbackResults = await searchListingsFallback(query, lat, lng, radiusMetres, limit);
    if (fallbackResults.length > 0) return fallbackResults;
    // If still no results, try external search
    return searchExternalPlaces(trimmed, lat, lng, limit);
  }

  const results = (data ?? []) as IListingWithDistance[];

  // If Supabase returned results, use them
  if (results.length > 0) return results;

  // Otherwise fall back to external search
  return searchExternalPlaces(trimmed, lat, lng, limit);
};

/**
 * Fallback search using direct query (if RPC not available)
 */
const searchListingsFallback = async (
  query: string,
  lat: number,
  lng: number,
  radiusMetres: number,
  limit: number,
): Promise<IListingWithDistance[]> => {
  if (!isSupabaseEnabled() || !supabase) return [];

  const pattern = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      venues!inner (name)
    `,
    )
    .eq('status', 'active')
    .or(
      `title.ilike.${pattern},description.ilike.${pattern},address.ilike.${pattern},cuisine_type.ilike.${pattern}`,
    )
    .limit(limit);

  if (error) {
    if (import.meta.env.DEV) console.error('searchListingsFallback error:', error.message);
    return [];
  }

  // Calculate distances and format results
  const results: IListingWithDistance[] = (data ?? []).map((listing) => {
    const listingLat = listing.location?.lat ?? 0;
    const listingLng = listing.location?.lng ?? 0;
    const distance = haversine(lat, lng, listingLat, listingLng);

    return {
      ...listing,
      distance_metres: distance,
      venue_name: listing.venues?.name ?? listing.title,
    };
  });

  // Filter by radius and sort by distance
  return results
    .filter((l) => l.distance_metres <= radiusMetres)
    .sort((a, b) => a.distance_metres - b.distance_metres);
};

/**
 * Haversine formula for distance calculation
 */
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
