export const getSupabaseUrl = (): string => import.meta.env.VITE_SUPABASE_URL ?? '';
export const getSupabaseAnonKey = (): string => import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseEnabled = (): boolean => !!(getSupabaseUrl() && getSupabaseAnonKey());

// Foursquare Places API
export const getFoursquareApiKey = (): string => import.meta.env.VITE_FOURSQUARE_API_KEY ?? '';
export const isFoursquareEnabled = (): boolean => !!getFoursquareApiKey();

// Google Maps API (includes Places, Geocoding, etc.)
export const getGoogleMapsApiKey = (): string => import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
export const isGoogleMapsEnabled = (): boolean => !!getGoogleMapsApiKey();

// Legacy alias for backward compatibility
export const getGooglePlacesApiKey = getGoogleMapsApiKey;
export const isGooglePlacesEnabled = isGoogleMapsEnabled;

// Any place search API available
export const isPlaceSearchEnabled = (): boolean => isFoursquareEnabled() || isGooglePlacesEnabled();
