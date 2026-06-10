/**
 * Fallback images for venues without photos
 * Uses Unsplash image IDs - images are free to use
 * Format: https://images.unsplash.com/photo-{ID}?w=800&q=80
 */

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const PARAMS = '?w=800&q=80';

const img = (id: string): string => `${UNSPLASH_BASE}${id}${PARAMS}`;

// Nightclub / club images - dark, moody, dance floors
export const NIGHTCLUB_IMAGES = [
  img('1516450360452-9312f5e86fc7'), // DJ booth with lights
  img('1571266028243-3716f02d2d82'), // Club atmosphere
  img('1545128485-c400e7702b96'), // Dance floor lights
  img('1470225620780-dba8ba36b745'), // Concert crowd
  img('1514525253161-7a46d19cd819'), // Neon club
  img('1429962714451-bb934ecdc4ec'), // Party atmosphere
];

// Bar / pub images - cozy, drinks focused
export const BAR_IMAGES = [
  img('1572116469696-31de0f17cc34'), // Bar counter with bottles
  img('1525268323446-0505b6fe7778'), // Cocktail bar
  img('1566417713940-fe7c737a9ef2'), // Bar interior
  img('1514933651103-005eec06c04b'), // Whiskey bar
  img('1543007630-9710e4a00a20'), // Pub atmosphere
  img('1575444758702-4a6b9222336e'), // Bar with stools
];

// Restaurant / dining images - food, tables, ambiance
export const RESTAURANT_IMAGES = [
  img('1517248135467-4c7edcad34c4'), // Fine dining
  img('1552566626-52f8b828add9'), // Restaurant interior
  img('1414235077428-338989a2e8c0'), // Food spread
  img('1559339352-11d035aa65de'), // Table setting
  img('1555396273-367ea4eb4db5'), // Modern restaurant
  img('1537047902351-8c898f288725'), // Cozy dining
];

// Cafe / coffee shop images
export const CAFE_IMAGES = [
  img('1501339847302-ac426a4a7cbb'), // Coffee shop interior
  img('1495474472287-4d71bcdd2085'), // Latte art
  img('1554118811-1e0d58224f24'), // Cafe seating
  img('1559925393-8be0ec4767c8'), // Coffee beans
  img('1453614512568-c4024d13c247'), // Espresso machine
  img('1521017432531-fbd92d768814'), // Cozy cafe
];

// Default / generic venue images
export const DEFAULT_IMAGES = [
  img('1555939594-58d7cb561ad1'), // Modern venue
  img('1462539405390-d0bdb635c7d1'), // Event space
  img('1519671482749-fd09be7ccebf'), // Gathering
  img('1485872299829-c673f5194813'), // Social space
];

// Category to images mapping
export const FALLBACK_IMAGES: Record<string, string[]> = {
  nightclub: NIGHTCLUB_IMAGES,
  club: NIGHTCLUB_IMAGES,
  bar: BAR_IMAGES,
  pub: BAR_IMAGES,
  restaurant: RESTAURANT_IMAGES,
  fast_food: RESTAURANT_IMAGES,
  cafe: CAFE_IMAGES,
  coffee: CAFE_IMAGES,
  default: DEFAULT_IMAGES,
};
