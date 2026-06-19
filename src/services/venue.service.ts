import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import type { IVenue } from '../types/venue.types';

const MOCK_VENUES: IVenue[] = [
  {
    id: 'venue-1',
    owner_id: 'owner-1',
    name: 'Konka',
    type: 'Club',
    address: '12117 Phumula Crescent, Dobsonville, Soweto',
    location: { lat: -26.2459, lng: 27.8442 },
    phone: '+27 11 000 0001',
    description: 'Premier nightclub in Soweto.',
    cover_photo: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    verified: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const getOwnerVenues = async (ownerId: string): Promise<IVenue[]> => {
  if (!isSupabaseEnabled() || !supabase) {
    return MOCK_VENUES.filter((v) => v.owner_id === ownerId);
  }
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) {
    if (import.meta.env.DEV) console.error('getOwnerVenues error:', error.message);
    return [];
  }
  return (data ?? []) as IVenue[];
};

export const createVenue = async (
  payload: Omit<IVenue, 'id' | 'verified' | 'created_at'>,
): Promise<{ id: string | null; error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { id: `venue-${Date.now()}`, error: null };
  }
  const { data, error } = await supabase.from('venues').insert(payload).select('id').single();
  return { id: data?.id ?? null, error: error?.message ?? null };
};

export const updateVenue = async (
  id: string,
  payload: Partial<IVenue>,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) return { error: null };
  const { error } = await supabase.from('venues').update(payload).eq('id', id);
  return { error: error?.message ?? null };
};

/**
 * Get a venue by ID
 */
export const getVenueById = async (id: string): Promise<IVenue | null> => {
  if (!isSupabaseEnabled() || !supabase) {
    return MOCK_VENUES.find((v) => v.id === id) ?? null;
  }
  const { data, error } = await supabase.from('venues').select('*').eq('id', id).single();
  if (error) {
    if (import.meta.env.DEV) console.error('getVenueById error:', error.message);
    return null;
  }
  return data as IVenue;
};

/**
 * Check if a venue is claimable (unclaimed and has osm_id)
 */
export const isVenueClaimable = async (venueId: string): Promise<boolean> => {
  if (!isSupabaseEnabled() || !supabase) return false;
  const { data } = await supabase
    .from('venues')
    .select('is_claimed, osm_id')
    .eq('id', venueId)
    .single();
  return data?.osm_id !== null && data?.is_claimed === false;
};

/**
 * Claim an unclaimed venue for an owner
 */
export const claimVenue = async (
  venueId: string,
  ownerId: string,
): Promise<{ success: boolean; error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { success: true, error: null };
  }

  // First verify the venue is claimable
  const { data: venue, error: fetchError } = await supabase
    .from('venues')
    .select('is_claimed, osm_id, owner_id')
    .eq('id', venueId)
    .single();

  if (fetchError || !venue) {
    return { success: false, error: 'Venue not found' };
  }

  if (venue.is_claimed) {
    return { success: false, error: 'This venue has already been claimed' };
  }

  if (!venue.osm_id) {
    return { success: false, error: 'This venue is not claimable' };
  }

  // Claim the venue
  const { error: updateError } = await supabase
    .from('venues')
    .update({
      is_claimed: true,
      claimed_by: ownerId,
      claimed_at: new Date().toISOString(),
      owner_id: ownerId,
    })
    .eq('id', venueId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
};
