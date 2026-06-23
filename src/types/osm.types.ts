/**
 * OSM Place data structure used throughout the app
 */
export interface IOsmPlace {
  osm_id: number;
  osm_type: 'node' | 'way';
  name: string;
  address: string;
  suburb: string | null;
  amenity: string;
  cuisine: string | null;
  lat: number;
  lng: number;
  distance_metres: number | null;
  // Extended fields for external place APIs (Google, etc.)
  photo_url?: string;
  rating?: number;
  source?: 'osm' | 'google' | 'foursquare';
}

/**
 * Cache entry for OSM place data
 */
export interface IOsmCacheEntry {
  data: IOsmPlace[];
  timestamp: number;
}
