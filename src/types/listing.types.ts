export type ListingType = 'event' | 'food';
export type ListingStatus = 'active' | 'under_review' | 'inactive' | 'deleted';
export type DressCode = 'Casual' | 'Smart Casual' | 'Formal' | 'Any';
export type PriceRange = 'R' | 'RR' | 'RRR' | 'RRRR';

export interface IListing {
  id: string;
  venue_id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  address: string;
  location: { lat: number; lng: number };
  images: string[];
  status: ListingStatus;
  view_count: number;
  created_at: string;
  updated_at: string;

  // Event-specific
  event_date: string | null;
  event_end_date: string | null;
  entry_fee: string | null;
  dress_code: DressCode | null;
  artist: string | null;
  age_restriction: string | null;
  tags: string[] | null;
  capacity: number | null;

  // Food-specific
  cuisine_type: string | null;
  opening_hours: string | null;
  price_range: PriceRange | null;
  special: string | null;

  // New discovery fields
  vibe?: string[];
  when_chip?: string;
  save_count?: number;
}

// Extended type returned by the get_nearby_listings RPC
export interface IListingWithDistance extends IListing {
  distance_metres: number;
  venue_name?: string;
}
