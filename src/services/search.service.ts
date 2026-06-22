/**
 * Search Service
 * Provides database-powered search for listings
 */

import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import type { IListingWithDistance } from '../types/listing.types';

/**
 * Search listings by query string using database
 * Uses ILIKE for substring matching on title, description, address, and cuisine_type
 */
export const searchListings = async (
  query: string,
  lat: number,
  lng: number,
  radiusMetres: number = 20000,
  limit: number = 50,
): Promise<IListingWithDistance[]> => {
  if (!isSupabaseEnabled() || !supabase) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

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
    return searchListingsFallback(query, lat, lng, radiusMetres, limit);
  }

  return (data ?? []) as IListingWithDistance[];
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
