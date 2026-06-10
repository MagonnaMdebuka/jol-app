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

const transformToVenue = (node: IOsmNode, amenity: string): IVenueInsert | null => {
  const tags = node.tags ?? {};

  // Skip if no name
  if (!tags.name) {
    return null;
  }

  return {
    osm_id: `osm-${node.id}`,
    owner_id: JOL_ADMIN_ID,
    name: tags.name,
    type: AMENITY_TO_VENUE_TYPE[amenity] ?? 'Other',
    address: buildAddress(tags),
    location: { lat: node.lat, lng: node.lon },
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    description: tags.description ?? null,
    cover_photo: null, // Will use fallback images
    is_claimed: false,
  };
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

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const amenity of AMENITY_TYPES) {
    const nodes = await fetchAmenities(amenity);

    const venues = nodes
      .map((node) => transformToVenue(node, amenity))
      .filter((v): v is IVenueInsert => v !== null);

    if (venues.length === 0) {
      console.log(`  No valid venues for ${amenity}\n`);
      await sleep(REQUEST_DELAY);
      continue;
    }

    // Upsert to avoid duplicates
    const { data, error } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'osm_id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`  Insert error for ${amenity}:`, error.message);
    } else {
      const inserted = data?.length ?? 0;
      totalInserted += inserted;
      totalSkipped += venues.length - inserted;
      console.log(
        `  Inserted ${inserted} venues, skipped ${venues.length - inserted} duplicates\n`,
      );
    }

    // Respect rate limits
    await sleep(REQUEST_DELAY);
  }

  console.log('='.repeat(50));
  console.log(`Seeding complete!`);
  console.log(`  Total inserted: ${totalInserted}`);
  console.log(`  Total skipped (duplicates): ${totalSkipped}`);
  console.log('='.repeat(50));
};

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
