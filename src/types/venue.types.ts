export type VenueType = 'Club' | 'Tavern' | 'Shebeen' | 'Restaurant' | 'Bar' | 'Food Market' | 'Other';

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
}
