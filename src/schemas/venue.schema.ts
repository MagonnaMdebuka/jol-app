/**
 * Venue validation schemas
 */

import { z } from 'zod';
import { optionalSaPhoneSchema } from './auth.schema';

// Venue types matching database constraint
const VENUE_TYPES = [
  'Club',
  'Tavern',
  'Shebeen',
  'Restaurant',
  'Bar',
  'Food Market',
  'Other',
] as const;

// South Africa bounding box
const SA_LAT_MIN = -35;
const SA_LAT_MAX = -22;
const SA_LNG_MIN = 16;
const SA_LNG_MAX = 33;

export const locationSchema = z.object({
  lat: z.number().min(SA_LAT_MIN).max(SA_LAT_MAX, 'Latitude must be within South Africa'),
  lng: z.number().min(SA_LNG_MIN).max(SA_LNG_MAX, 'Longitude must be within South Africa'),
});

export const venueTypeSchema = z.enum(VENUE_TYPES);

// Create venue payload
export const createVenueSchema = z.object({
  name: z.string().min(1, 'Venue name is required').max(100, 'Name too long'),
  type: venueTypeSchema,
  address: z.string().min(1, 'Address is required').max(200, 'Address too long'),
  location: locationSchema,
  phone: optionalSaPhoneSchema,
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  cover_photo: z.string().url('Invalid cover photo URL').optional().nullable(),
  logo_url: z.string().url('Invalid logo URL').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
});

// Update venue payload (all fields optional)
export const updateVenueSchema = createVenueSchema.partial();

// Types
export type CreateVenue = z.infer<typeof createVenueSchema>;
export type UpdateVenue = z.infer<typeof updateVenueSchema>;
export type VenueType = z.infer<typeof venueTypeSchema>;
