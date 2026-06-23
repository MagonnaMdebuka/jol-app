/**
 * Jol — OSM Data Seeding Script
 *
 * Fetches venue data from OpenStreetMap via Overpass API and inserts
 * into Supabase for cold-start content.
 *
 * Prerequisites:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 * - Run: npx tsx scripts/seed-osm.ts
 *
 * Database requirements:
 * - venues table must have osm_id (TEXT) and is_claimed (BOOLEAN) columns
 * - Run migration 003_osm_columns.sql first
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// Configuration
// ============================================================

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Gauteng bounding box (south, west, north, east)
const GAUTENG_BBOX = '-26.5,27.5,-25.5,29.0';

// Amenity types to fetch
const AMENITY_TYPES = ['bar', 'pub', 'restaurant', 'cafe', 'nightclub', 'fast_food'];

// Map OSM amenity to Jol VenueType
const AMENITY_TO_VENUE_TYPE: Record<string, string> = {
  nightclub: 'Club',
  bar: 'Bar',
  pub: 'Bar',
  restaurant: 'Restaurant',
  cafe: 'Restaurant',
  fast_food: 'Other',
};

// Map OSM amenity to Jol ListingType
const AMENITY_TO_LISTING_TYPE: Record<string, 'event' | 'food'> = {
  nightclub: 'event',
  bar: 'event',
  pub: 'event',
  restaurant: 'food',
  cafe: 'food',
  fast_food: 'food',
};

// Seeded venues have no owner until claimed
const JOL_ADMIN_ID = null;

// Delay between Overpass requests (ms)
const REQUEST_DELAY = 1500;

// ============================================================
// Types
// ============================================================

interface IOsmNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface IOsmResponse {
  version: number;
  elements: IOsmNode[];
}

interface IVenueInsert {
  osm_id: string;
  owner_id: string | null;
  name: string;
  type: string;
  address: string;
  location: { lat: number; lng: number };
  phone: string | null;
  description: string | null;
  cover_photo: string | null;
  is_claimed: boolean;
}

interface IListingInsert {
  venue_id: string;
  owner_id: string | null;
  type: 'event' | 'food';
  title: string;
  description: string | null;
  address: string;
  location: { lat: number; lng: number };
  images: string[];
  status: 'active';
  cuisine_type: string | null;
  vibe: string[];
}

// ============================================================
// Helpers
// ============================================================

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const buildAddress = (tags: Record<string, string>): string => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

// ============================================================
// Overpass API
// ============================================================

const buildOverpassQuery = (amenity: string): string => {
  // Overpass QL format: (south,west,north,east)
  return `[out:json][timeout:60];
node["amenity"="${amenity}"]["name"](${GAUTENG_BBOX});
out body;`;
};

const fetchAmenities = async (amenity: string): Promise<IOsmNode[]> => {
  const query = buildOverpassQuery(amenity);

  console.log(`Fetching ${amenity} venues from Overpass...`);
  console.log(`  Query: ${query.replace(/\n/g, ' ')}`);

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'JolApp/1.0 (nightlife discovery app)',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error body');
    console.error(`Overpass error for ${amenity}: ${response.status}`);
    console.error(`  Response: ${errorText.slice(0, 200)}`);
    return [];
  }

  const data: IOsmResponse = await response.json();
  console.log(`  Found ${data.elements.length} ${amenity} venues`);

  return data.elements;
};

// ============================================================
// Transform & Insert
// ============================================================

interface ITransformResult {
  venue: IVenueInsert;
  listing: Omit<IListingInsert, 'venue_id'>;
}

const transformToVenueAndListing = (node: IOsmNode, amenity: string): ITransformResult | null => {
  const tags = node.tags ?? {};

  // Skip if no name
  if (!tags.name) {
    return null;
  }

  const listingType = AMENITY_TO_LISTING_TYPE[amenity] ?? 'food';
  const address = buildAddress(tags);
  const location = { lat: node.lat, lng: node.lon };

  const venue: IVenueInsert = {
    osm_id: `osm-${node.id}`,
    owner_id: JOL_ADMIN_ID,
    name: tags.name,
    type: AMENITY_TO_VENUE_TYPE[amenity] ?? 'Other',
    address,
    location,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    description: tags.description ?? null,
    cover_photo: null,
    is_claimed: false,
  };

  const listing: Omit<IListingInsert, 'venue_id'> = {
    owner_id: JOL_ADMIN_ID,
    type: listingType,
    title: tags.name,
    description: tags.description ?? null,
    address,
    location,
    images: [],
    status: 'active',
    cuisine_type: listingType === 'food' ? (tags.cuisine ?? formatCuisine(amenity)) : null,
    vibe: listingType === 'food' ? ['Chill'] : ['Go out'],
  };

  return { venue, listing };
};

const formatCuisine = (amenity: string): string => {
  const mapping: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Café',
    fast_food: 'Fast Food',
  };
  return mapping[amenity] ?? 'Restaurant';
};

// ============================================================
// Main
// ============================================================

const main = async (): Promise<void> => {
  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables:');
    console.error('  SUPABASE_URL - Your Supabase project URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY - Service role key (not anon key)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Starting OSM data seeding for Gauteng...\n');

  let totalVenuesInserted = 0;
  let totalListingsInserted = 0;
  let totalSkipped = 0;

  for (const amenity of AMENITY_TYPES) {
    const nodes = await fetchAmenities(amenity);

    const transformed = nodes
      .map((node) => transformToVenueAndListing(node, amenity))
      .filter((t): t is ITransformResult => t !== null);

    if (transformed.length === 0) {
      console.log(`  No valid venues for ${amenity}\n`);
      await sleep(REQUEST_DELAY);
      continue;
    }

    const venues = transformed.map((t) => t.venue);

    // Upsert venues to avoid duplicates
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'osm_id', ignoreDuplicates: false })
      .select('id, osm_id');

    if (venueError) {
      console.error(`  Venue insert error for ${amenity}:`, venueError.message);
      await sleep(REQUEST_DELAY);
      continue;
    }

    const insertedVenues = venueData ?? [];
    totalVenuesInserted += insertedVenues.length;
    console.log(`  Inserted/updated ${insertedVenues.length} venues`);

    // Build osm_id -> venue_id map
    const osmToVenueId = new Map<string, string>();
    for (const v of insertedVenues) {
      osmToVenueId.set(v.osm_id, v.id);
    }

    // Create listings for the inserted venues
    const listings: IListingInsert[] = [];
    for (const t of transformed) {
      const venueId = osmToVenueId.get(t.venue.osm_id);
      if (venueId) {
        listings.push({ ...t.listing, venue_id: venueId });
      }
    }

    if (listings.length > 0) {
      // Upsert listings - use venue_id + title as a pseudo-unique constraint
      // First check if listings already exist for these venues
      const venueIds = listings.map((l) => l.venue_id);
      const { data: existingListings } = await supabase
        .from('listings')
        .select('venue_id')
        .in('venue_id', venueIds);

      const existingVenueIds = new Set((existingListings ?? []).map((l) => l.venue_id));
      const newListings = listings.filter((l) => !existingVenueIds.has(l.venue_id));

      if (newListings.length > 0) {
        const { error: listingError, data: listingData } = await supabase
          .from('listings')
          .insert(newListings)
          .select('id');

        if (listingError) {
          console.error(`  Listing insert error for ${amenity}:`, listingError.message);
        } else {
          const insertedCount = listingData?.length ?? 0;
          totalListingsInserted += insertedCount;
          console.log(`  Created ${insertedCount} new listings`);
        }
      }

      totalSkipped += listings.length - newListings.length;
      if (listings.length - newListings.length > 0) {
        console.log(`  Skipped ${listings.length - newListings.length} existing listings`);
      }
    }

    console.log();
    // Respect rate limits
    await sleep(REQUEST_DELAY);
  }

  console.log('='.repeat(50));
  console.log(`Seeding complete!`);
  console.log(`  Total venues inserted/updated: ${totalVenuesInserted}`);
  console.log(`  Total listings created: ${totalListingsInserted}`);
  console.log(`  Total skipped (existing): ${totalSkipped}`);
  console.log('='.repeat(50));
};

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
