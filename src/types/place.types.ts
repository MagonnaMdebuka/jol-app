// Foursquare Places API response types

export interface IPlaceResult {
  fsq_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  photo_url: string | null;
  rating: number | null;
}

// Foursquare API response structures
export interface IFoursquareLocation {
  address?: string;
  address_extended?: string;
  locality?: string;
  region?: string;
  postcode?: string;
  country?: string;
  formatted_address?: string;
}

export interface IFoursquareCategory {
  id: number;
  name: string;
  short_name?: string;
  plural_name?: string;
  icon?: {
    prefix: string;
    suffix: string;
  };
}

export interface IFoursquarePhoto {
  id: string;
  created_at: string;
  prefix: string;
  suffix: string;
  width: number;
  height: number;
}

export interface IFoursquarePlace {
  fsq_id: string;
  name: string;
  location: IFoursquareLocation;
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  categories: IFoursquareCategory[];
  photos?: IFoursquarePhoto[];
  rating?: number;
}

export interface IFoursquareResponse {
  results: IFoursquarePlace[];
}
