import { FALLBACK_IMAGES } from '../constants/fallbackImages';

/**
 * Maps OSM amenity tags to our category keys
 */
const AMENITY_TO_CATEGORY: Record<string, string> = {
  nightclub: 'nightclub',
  club: 'nightclub',
  bar: 'bar',
  pub: 'bar',
  restaurant: 'restaurant',
  fast_food: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'cafe',
};

/**
 * Simple hash function to get a consistent index from an ID string
 * Uses sum of character codes
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  return hash;
};

/**
 * Get a deterministic fallback image for a venue without photos
 *
 * @param category - OSM amenity tag or venue category (e.g., "nightclub", "bar", "restaurant")
 * @param id - Unique identifier (OSM ID, venue ID, etc.) used to pick consistent image
 * @returns URL to a fallback image
 *
 * @example
 * getFallbackImage('nightclub', 'osm-12345') // Always returns same image for this ID
 * getFallbackImage('bar', 'venue-abc')
 */
export const getFallbackImage = (category: string, id: string): string => {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z_]/g, '');
  const categoryKey = AMENITY_TO_CATEGORY[normalizedCategory] ?? 'default';
  const images = FALLBACK_IMAGES[categoryKey] ?? FALLBACK_IMAGES.default;

  const index = hashString(id) % images.length;
  return images[index];
};

/**
 * Get a random fallback image for a category (non-deterministic)
 * Use when you don't have a stable ID
 */
export const getRandomFallbackImage = (category: string): string => {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z_]/g, '');
  const categoryKey = AMENITY_TO_CATEGORY[normalizedCategory] ?? 'default';
  const images = FALLBACK_IMAGES[categoryKey] ?? FALLBACK_IMAGES.default;

  const index = Math.floor(Math.random() * images.length);
  return images[index];
};
