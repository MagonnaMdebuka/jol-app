export const getSupabaseUrl = (): string => import.meta.env.VITE_SUPABASE_URL ?? '';
export const getSupabaseAnonKey = (): string => import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseEnabled = (): boolean => !!(getSupabaseUrl() && getSupabaseAnonKey());
