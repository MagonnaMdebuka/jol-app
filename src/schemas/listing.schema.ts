/**
 * Listing validation schemas
 */

import { z } from 'zod';
import { locationSchema } from './venue.schema';

// Listing types
const LISTING_STATUSES = ['active', 'under_review', 'inactive', 'deleted'] as const;
const DRESS_CODES = ['Casual', 'Smart Casual', 'Formal', 'Any'] as const;
const PRICE_RANGES = ['R', 'RR', 'RRR', 'RRRR'] as const;

// Reusable field schemas
const titleSchema = z.string().min(1, 'Title is required').max(100, 'Title too long');
const descriptionSchema = z.string().max(2000, 'Description too long').optional().nullable();
const addressSchema = z.string().min(1, 'Address is required').max(200, 'Address too long');

// Image URL validation
const imageUrlSchema = z.string().url('Invalid image URL');
const imagesSchema = z.array(imageUrlSchema).max(10, 'Maximum 10 images allowed').default([]);

// Entry fee: accepts "Free", "TBC", "R100", "R 150", etc.
const entryFeeSchema = z
  .string()
  .max(50)
  .optional()
  .nullable()
  .refine(
    (v) => {
      if (!v) return true;
      const cleaned = v.trim().toLowerCase();
      if (['free', 'tbc', 'tba'].includes(cleaned)) return true;
      return /^R?\s*\d+(?:\.\d{2})?(?:\s*-\s*R?\s*\d+(?:\.\d{2})?)?$/i.test(v);
    },
    { message: 'Enter a valid price (e.g. R100, R50-R100, Free)' },
  );

// Future date validation
const futureDateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .refine((v) => new Date(v) > new Date(), { message: 'Date must be in the future' });

const optionalFutureDateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .optional()
  .nullable();

// Base listing fields (shared between event and food)
const baseListingSchema = z.object({
  venue_id: z.string().uuid('Invalid venue ID'),
  title: titleSchema,
  description: descriptionSchema,
  address: addressSchema,
  location: locationSchema,
  images: imagesSchema,
  vibe: z.array(z.string()).max(5, 'Maximum 5 vibes').optional(),
  when_chip: z.string().max(50).optional().nullable(),
});

// Event-specific fields
const eventFieldsSchema = z.object({
  type: z.literal('event'),
  event_date: futureDateSchema,
  event_end_date: optionalFutureDateSchema,
  entry_fee: entryFeeSchema,
  dress_code: z.enum(DRESS_CODES).optional().nullable(),
  artist: z.string().max(200, 'Artist name too long').optional().nullable(),
  age_restriction: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags').optional().nullable(),
  capacity: z.number().int().positive().max(100000).optional().nullable(),
  // Food fields null for events
  cuisine_type: z.null().optional(),
  opening_hours: z.null().optional(),
  price_range: z.null().optional(),
  special: z.null().optional(),
});

// Food-specific fields
const foodFieldsSchema = z.object({
  type: z.literal('food'),
  cuisine_type: z.string().min(1, 'Cuisine type is required').max(100),
  opening_hours: z.string().max(100).optional().nullable(),
  price_range: z.enum(PRICE_RANGES).optional().nullable(),
  special: z.string().max(200, 'Special too long').optional().nullable(),
  // Event fields null for food
  event_date: z.null().optional(),
  event_end_date: z.null().optional(),
  entry_fee: z.null().optional(),
  dress_code: z.null().optional(),
  artist: z.null().optional(),
  age_restriction: z.null().optional(),
  tags: z.null().optional(),
  capacity: z.null().optional(),
});

// Create listing schema (discriminated union)
export const createEventListingSchema = baseListingSchema.merge(eventFieldsSchema);
export const createFoodListingSchema = baseListingSchema.merge(foodFieldsSchema);

export const createListingSchema = z.discriminatedUnion('type', [
  createEventListingSchema,
  createFoodListingSchema,
]);

// Update listing schema (partial, but type is required for discrimination)
export const updateListingSchema = z.union([
  createEventListingSchema.partial().extend({ type: z.literal('event') }),
  createFoodListingSchema.partial().extend({ type: z.literal('food') }),
]);

// Status update schema
export const updateListingStatusSchema = z.object({
  status: z.enum(LISTING_STATUSES),
});

// Types
export type CreateEventListing = z.infer<typeof createEventListingSchema>;
export type CreateFoodListing = z.infer<typeof createFoodListingSchema>;
export type CreateListing = z.infer<typeof createListingSchema>;
export type UpdateListing = z.infer<typeof updateListingSchema>;
export type ListingType = 'event' | 'food';
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type DressCode = (typeof DRESS_CODES)[number];
export type PriceRange = (typeof PRICE_RANGES)[number];
