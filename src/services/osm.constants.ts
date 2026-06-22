/**
 * OSM constants and helper functions for category detection
 */

export const EVENT_KEYWORDS = [
  'amapiano',
  'piano',
  'dj',
  'party',
  'event',
  'tonight',
  'concert',
  'jazz',
  'hiphop',
  'hip hop',
  'house',
  'afrobeats',
  'rnb',
  'r&b',
  'deep house',
];

export const QUERY_INTENTS: Record<string, string[]> = {
  amapiano: ['nightclub', 'bar', 'pub', 'lounge'],
  piano: ['nightclub', 'bar', 'pub', 'lounge'],
  dj: ['nightclub', 'bar', 'pub', 'lounge'],
  party: ['nightclub', 'bar', 'pub', 'lounge'],
  club: ['nightclub', 'bar', 'pub', 'lounge'],
  'date night': ['restaurant', 'cafe', 'bar', 'lounge'],
  date: ['restaurant', 'cafe', 'bar', 'lounge'],
  romantic: ['restaurant', 'cafe', 'bar', 'lounge'],
  dinner: ['restaurant', 'cafe', 'bar'],
  rooftop: ['bar', 'restaurant', 'lounge'],
  sundowner: ['bar', 'restaurant', 'lounge'],
  food: ['restaurant', 'cafe', 'fast_food', 'food_court', 'bistro'],
  braai: ['restaurant', 'bar', 'pub'],
  chill: ['restaurant', 'cafe', 'bar', 'lounge'],
  jazz: ['nightclub', 'bar', 'pub', 'lounge', 'theatre'],
};

export const AMENITY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  fast_food: 'Fast food',
  food_court: 'Food court',
  pub: 'Pub',
  bistro: 'Bistro',
  nightclub: 'Nightclub',
  lounge: 'Lounge',
  theatre: 'Theatre',
  cinema: 'Cinema',
  hotel: 'Hotel',
  attraction: 'Attraction',
  marketplace: 'Market',
  biergarten: 'Beer garden',
  casino: 'Casino',
};

export const DISCOVERY_TYPES = new Set([
  'restaurant',
  'cafe',
  'bar',
  'fast_food',
  'food_court',
  'pub',
  'bistro',
  'nightclub',
  'lounge',
  'theatre',
  'cinema',
  'hotel',
  'attraction',
  'marketplace',
  'biergarten',
  'casino',
]);

export const AMENITY_PATTERN =
  'restaurant|cafe|bar|fast_food|food_court|pub|bistro|nightclub|theatre|cinema|biergarten|casino|marketplace';
export const TOURISM_PATTERN = 'hotel|attraction';
export const LEISURE_PATTERN = 'adult_gaming_centre';
export const NAME_PATTERN =
  'club|lounge|bar|grill|restaurant|cafe|coffee|kitchen|rooftop|pub|tavern|shisanyama|braai|jazz|casino';

export const isEventQuery = (query: string): boolean =>
  EVENT_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

export const getSearchIntentTypes = (query: string): string[] | null => {
  const q = query.toLowerCase();
  const match = Object.entries(QUERY_INTENTS).find(([keyword]) => q.includes(keyword));
  return match?.[1] ?? null;
};

export const formatOsmCategory = (amenity: string, cuisine: string | null): string => {
  const base = AMENITY_LABELS[amenity] ?? amenity;
  if (!cuisine) return base;
  const first = cuisine.split(';')[0].trim();
  return `${base} · ${first.charAt(0).toUpperCase()}${first.slice(1)}`;
};

export const inferCategoryFromName = (name: string): string | null => {
  const n = name.toLowerCase();
  if (n.includes('club')) return 'nightclub';
  if (n.includes('lounge') || n.includes('rooftop')) return 'lounge';
  if (n.includes('bar')) return 'bar';
  if (n.includes('pub')) return 'pub';
  if (n.includes('grill') || n.includes('kitchen') || n.includes('restaurant')) {
    return 'restaurant';
  }
  if (n.includes('cafe') || n.includes('coffee')) return 'cafe';
  if (n.includes('casino')) return 'casino';
  return null;
};
