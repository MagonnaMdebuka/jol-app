export const EVENT_TAGS = [
  'Amapiano', 'House', 'Afrobeats', 'Hip Hop', 'RnB', 'Jazz',
  'Live Music', 'DJ Night', 'Comedy', 'Dance', 'Pop', 'Rock',
  'Open Mic', 'Art Show', 'Fashion', 'Sports',
] as const;

export const CUISINE_TYPES = [
  'South African', 'Braai / Steakhouse', 'Peri-Peri / Chicken', 'Burgers', 'Pizza',
  'Sushi', 'Chinese', 'Indian', 'Ethiopian', 'Vegan', 'Seafood', 'Food Market', 'Other',
] as const;

export const VENUE_TYPES = [
  { value: 'Club', label: 'Night Club' },
  { value: 'Tavern', label: 'Tavern' },
  { value: 'Shebeen', label: 'Shebeen' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Bar', label: 'Bar & Lounge' },
  { value: 'Food Market', label: 'Food Market' },
  { value: 'Other', label: 'Other' },
] as const;

export const DRESS_CODES = ['Casual', 'Smart Casual', 'Formal', 'Any'] as const;

export const PRICE_RANGES = [
  { value: 'R', label: 'R — Budget friendly' },
  { value: 'RR', label: 'RR — Moderate' },
  { value: 'RRR', label: 'RRR — Mid-range' },
  { value: 'RRRR', label: 'RRRR — Fine dining' },
] as const;

export const REPORT_REASONS = [
  'Fake event',
  'Wrong info',
  'Inappropriate content',
  'Other',
] as const;

export const RADIUS_OPTIONS = [2, 5, 10, 20] as const;

export const VIBE_FILTERS = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'tonight', label: 'Tonight', icon: '◐' },
  { id: 'weekend', label: 'This weekend', icon: '◓' },
  { id: 'food', label: 'Eat', icon: '⌇' },
  { id: 'events', label: 'Go out', icon: '◈' },
  { id: 'chill', label: 'Chill', icon: '◯' },
  { id: 'date', label: 'Date night', icon: '✿' },
  { id: 'free', label: 'Free entry', icon: '✕' },
] as const;

export type VibeFilterId = (typeof VIBE_FILTERS)[number]['id'];

export const NEIGHBOURHOODS: string[] = [
  'Sandton',
  'Rosebank',
  'Braamfontein',
  'Soweto',
  'Melville',
  'Dunkeld',
  'Maboneng',
];
