import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseEnabled, getSupabaseUrl, getSupabaseAnonKey } from './env';

export const supabase: SupabaseClient | null = isSupabaseEnabled()
  ? createClient(getSupabaseUrl(), getSupabaseAnonKey())
  : null;
