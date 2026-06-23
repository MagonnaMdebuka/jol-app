export type VenueType =
  | 'Club'
  | 'Tavern'
  | 'Shebeen'
  | 'Restaurant'
  | 'Bar'
  | 'Food Market'
  | 'Other';

export interface IVenue {
  id: string;
  owner_id: string;
  name: string;
  type: VenueType;
  address: string;
  location: { lat: number; lng: number };
  phone: string | null;
  description: string | null;
  cover_photo: string | null;
  verified: boolean;
  created_at: string;

  // OSM seeding & claim fields
  osm_id?: string | null;
  is_claimed?: boolean;
  claimed_by?: string | null;
  claimed_at?: string | null;

  // Cached place data from APIs
  fsq_id?: string | null;
  google_place_id?: string | null;
  cached_photos?: string[];
  cached_rating?: number | null;
  cached_category?: string | null;
  place_source?: 'foursquare' | 'google' | 'manual' | 'osm' | null;
  cache_fetched_at?: string | null;
}
