import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';

export const toggleInterested = async (
  userId: string,
  listingId: string,
): Promise<{ isInterested: boolean; error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    return { isInterested: false, error: null };
  }

  // Check if already interested
  const { data: existing } = await supabase
    .from('interested_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single();

  if (existing) {
    // Remove interest
    const { error } = await supabase
      .from('interested_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    return { isInterested: false, error: error?.message ?? null };
  }

  // Add interest
  const { error } = await supabase.from('interested_listings').insert({
    user_id: userId,
    listing_id: listingId,
  });
  return { isInterested: true, error: error?.message ?? null };
};

export const isUserInterested = async (userId: string, listingId: string): Promise<boolean> => {
  if (!isSupabaseEnabled() || !supabase) return false;

  const { data } = await supabase
    .from('interested_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single();

  return !!data;
};

export const getUserInterestedListings = async (userId: string): Promise<string[]> => {
  if (!isSupabaseEnabled() || !supabase) return [];

  const { data, error } = await supabase
    .from('interested_listings')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) return [];
  return (data ?? []).map((row) => row.listing_id);
};

export const getInterestedCount = async (listingId: string): Promise<number> => {
  if (!isSupabaseEnabled() || !supabase) return 0;

  const { count, error } = await supabase
    .from('interested_listings')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  if (error) return 0;
  return count ?? 0;
};
