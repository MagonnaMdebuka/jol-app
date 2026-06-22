import { supabase } from '../config/supabase';
import { isSupabaseEnabled, isGooglePlacesEnabled } from '../config/env';
import { createListingSchema, updateListingSchema } from '../schemas/listing.schema';
import { searchGoogleNearby } from './places.service';
import { overpassAreaSearch } from './overpass.service';
import type { IListing, IListingWithDistance } from '../types/listing.types';
import type { IPlaceResult } from '../types/place.types';
import type { IOsmPlace } from '../types/osm.types';

/** Transform external place to listing format */
const externalToListing = (
  place: IPlaceResult | IOsmPlace,
  source: 'google' | 'osm',
): IListingWithDistance => {
  const isOsm = source === 'osm';
  const osmPlace = place as IOsmPlace;
  const googlePlace = place as IPlaceResult;
  const category = isOsm ? osmPlace.amenity : googlePlace.category;
  const isFood = /restaurant|cafe|fast_food|bakery|food|meal|pizza|burger|chicken|grill/i.test(
    category,
  );

  return {
    id: isOsm ? `osm-${osmPlace.osm_id}` : `place-${googlePlace.google_place_id ?? Date.now()}`,
    venue_id: '',
    owner_id: '',
    type: isFood ? 'food' : 'event',
    title: place.name,
    description: isOsm ? (osmPlace.cuisine ?? category.replace(/_/g, ' ')) : category,
    address: place.address,
    location: { lat: place.lat, lng: place.lng },
    images: isOsm ? (osmPlace.photo_url ? [osmPlace.photo_url] : []) : (googlePlace.photos ?? []),
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
    tags: [category.replace(/_/g, ' ')],
    capacity: null,
    cuisine_type: isFood ? category.replace(/_/g, ' ') : null,
    opening_hours: null,
    price_range: null,
    special: null,
    distance_metres: isOsm ? (osmPlace.distance_metres ?? 0) : 0,
    venue_name: place.name,
    vibe: [],
  };
};

/** Fetch nearby places from external APIs (Google or OSM) */
const fetchExternalNearby = async (
  lat: number,
  lng: number,
  radiusMetres: number,
): Promise<IListingWithDistance[]> => {
  // Try Google Places Nearby first
  if (isGooglePlacesEnabled()) {
    const results = await searchGoogleNearby(lat, lng, radiusMetres, 20);
    if (results.length > 0) {
      return results.map((p) => externalToListing(p, 'google'));
    }
  }

  // Fall back to OSM Overpass
  const osmResults = await overpassAreaSearch(lat, lng, lat, lng, true, 30);
  return osmResults.map((p) => externalToListing(p, 'osm'));
};

export const getNearbyListings = async (
  lat: number,
  lng: number,
  radiusMetres: number = 10000,
  type: 'event' | 'food' | null = null,
): Promise<IListingWithDistance[]> => {
  // If Supabase is disabled, use external APIs
  if (!isSupabaseEnabled() || !supabase) {
    const external = await fetchExternalNearby(lat, lng, radiusMetres);
    if (type) return external.filter((l) => l.type === type);
    return external;
  }

  const { data, error } = await supabase.rpc('get_nearby_listings', {
    lat,
    lng,
    radius_metres: radiusMetres,
    listing_type: type,
  });

  if (error) {
    if (import.meta.env.DEV) console.error('getNearbyListings error:', error.message);
    // Fall back to external if Supabase fails
    const external = await fetchExternalNearby(lat, lng, radiusMetres);
    if (type) return external.filter((l) => l.type === type);
    return external;
  }

  const results = (data ?? []) as IListingWithDistance[];
  if (results.length > 0) return results;

  // If Supabase returned empty, try external
  const external = await fetchExternalNearby(lat, lng, radiusMetres);
  if (type) return external.filter((l) => l.type === type);
  return external;
};

export const getListing = async (id: string): Promise<IListingWithDistance | null> => {
  // Skip Supabase query for ephemeral OSM/Google listings (they only exist in context)
  if (id.startsWith('osm-') || id.startsWith('place-')) return null;

  if (!isSupabaseEnabled() || !supabase) return null;
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
  if (error) {
    if (import.meta.env.DEV) console.error('getListing error:', error.message);
    return null;
  }
  return data as IListingWithDistance;
};

export const getOwnerListings = async (ownerId: string): Promise<IListing[]> => {
  if (!isSupabaseEnabled() || !supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', ownerId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });
  if (error) {
    if (import.meta.env.DEV) console.error('getOwnerListings error:', error.message);
    return [];
  }
  return (data ?? []) as IListing[];
};

export const createListing = async (
  payload: Omit<IListing, 'id' | 'view_count' | 'created_at' | 'updated_at'>,
): Promise<{ id: string | null; error: string | null }> => {
  // Validate payload
  const validation = createListingSchema.safeParse(payload);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { id: null, error: firstError?.message ?? 'Validation failed' };
  }

  if (!isSupabaseEnabled() || !supabase) {
    return { id: `mock-${Date.now()}`, error: null };
  }
  const { data, error } = await supabase.from('listings').insert(payload).select('id').single();
  return { id: data?.id ?? null, error: error?.message ?? null };
};

export const updateListing = async (
  id: string,
  payload: Partial<IListing>,
): Promise<{ error: string | null }> => {
  // Validate payload if type is present (allows partial updates)
  if (payload.type) {
    const validation = updateListingSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { error: firstError?.message ?? 'Validation failed' };
    }
  }

  if (!isSupabaseEnabled() || !supabase) return { error: null };
  const { error } = await supabase.from('listings').update(payload).eq('id', id);
  return { error: error?.message ?? null };
};

export const softDeleteListing = async (id: string): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) return { error: null };
  const { error } = await supabase.from('listings').update({ status: 'inactive' }).eq('id', id);
  return { error: error?.message ?? null };
};

export const incrementViewCount = async (id: string): Promise<void> => {
  // Skip view count for ephemeral OSM/Google listings (they don't exist in Supabase)
  if (id.startsWith('osm-') || id.startsWith('place-')) return;

  if (!isSupabaseEnabled() || !supabase) return;
  await supabase.rpc('increment_view_count', { listing_id: id });
};
