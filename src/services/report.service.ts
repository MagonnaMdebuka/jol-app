import { supabase } from '../config/supabase';
import { isSupabaseEnabled } from '../config/env';
import type { ReportReason } from '../types/report.types';

export const createReport = async (
  listingId: string,
  reason: ReportReason,
  description?: string,
): Promise<{ error: string | null }> => {
  if (!isSupabaseEnabled() || !supabase) {
    console.warn('[demo] Report submitted:', { listingId, reason });
    return { error: null };
  }
  const { error } = await supabase.from('reports').insert({
    listing_id: listingId,
    reason,
    description: description ?? null,
  });
  return { error: error?.message ?? null };
};
