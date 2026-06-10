export const getSupabaseUrl = (): string => import.meta.env.VITE_SUPABASE_URL ?? '';
export const getSupabaseAnonKey = (): string => import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseEnabled = (): boolean => !!(getSupabaseUrl() && getSupabaseAnonKey());

// Foursquare Places API
export const getFoursquareApiKey = (): string => import.meta.env.VITE_FOURSQUARE_API_KEY ?? '';
export const isFoursquareEnabled = (): boolean => !!getFoursquareApiKey();
