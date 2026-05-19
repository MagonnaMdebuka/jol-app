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
    console.error('getOwnerVenues error:', error.message);
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
