import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import type { IListing, IListingWithDistance } from '../types/listing.types';

export const getNearbyListings = async (
  lat: number,
  lng: number,
  radiusMetres: number = 10000,
  type: 'event' | 'food' | null = null,
): Promise<IListingWithDistance[]> => {
  if (!isSupabaseEnabled() || !supabase) return [];
  const { data, error } = await supabase.rpc('get_nearby_listings', {
    lat,
    lng,
    radius_metres: radiusMetres,
    listing_type: type,
  });
  if (error) {
    console.error('getNearbyListings error:', error.message);
    return [];
  }
  return (data ?? []) as IListingWithDistance[];
};

export const getListing = async (id: string): Promise<IListingWithDistance | null> => {
  // Skip Supabase query for ephemeral OSM/Google listings (they only exist in context)
  if (id.startsWith('osm-')) return null;

  if (!isSupabaseEnabled() || !supabase) return null;
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
  if (error) {
    console.error('getListing error:', error.message);
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
    console.error('getOwnerListings error:', error.message);
    return [];
  }
  return (data ?? []) as IListing[];
};

export const createListing = async (
  payload: Omit<IListing, 'id' | 'view_count' | 'created_at' | 'updated_at'>,
): Promise<{ id: string | null; error: string | null }> => {
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
  if (id.startsWith('osm-')) return;

  if (!isSupabaseEnabled() || !supabase) return;
  await supabase.rpc('increment_view_count', { listing_id: id });
};
