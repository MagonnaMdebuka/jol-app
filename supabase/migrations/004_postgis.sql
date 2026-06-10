-- ============================================================
-- Jol — Migration 004: PostGIS Geography Support
--
-- Migrates location from JSONB to PostGIS geography(Point, 4326)
-- for efficient radius-based queries using spatial indexes.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Note: Supabase has PostGIS pre-installed
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Enable PostGIS (usually already enabled on Supabase)
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Add geography columns (keep JSONB for backwards compat)
-- ─────────────────────────────────────────────────────────────

-- venues: Add geog column
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);

-- listings: Add geog column
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Migrate existing JSONB data to geography
-- ─────────────────────────────────────────────────────────────

-- Populate venues.geog from existing location JSONB
UPDATE public.venues
SET geog = ST_SetSRID(
  ST_MakePoint(
    (location->>'lng')::double precision,
    (location->>'lat')::double precision
  ),
  4326
)::geography
WHERE geog IS NULL
  AND location IS NOT NULL
  AND location->>'lat' IS NOT NULL
  AND location->>'lng' IS NOT NULL;

-- Populate listings.geog from existing location JSONB
UPDATE public.listings
SET geog = ST_SetSRID(
  ST_MakePoint(
    (location->>'lng')::double precision,
    (location->>'lat')::double precision
  ),
  4326
)::geography
WHERE geog IS NULL
  AND location IS NOT NULL
  AND location->>'lat' IS NOT NULL
  AND location->>'lng' IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Create spatial indexes for fast radius queries
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_venues_geog ON public.venues USING GIST (geog);
CREATE INDEX IF NOT EXISTS idx_listings_geog ON public.listings USING GIST (geog);

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Create trigger to auto-populate geog on insert/update
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_geog_from_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL AND NEW.location->>'lat' IS NOT NULL AND NEW.location->>'lng' IS NOT NULL THEN
    NEW.geog := ST_SetSRID(
      ST_MakePoint(
        (NEW.location->>'lng')::double precision,
        (NEW.location->>'lat')::double precision
      ),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- venues trigger
DROP TRIGGER IF EXISTS trg_venues_sync_geog ON public.venues;
CREATE TRIGGER trg_venues_sync_geog
  BEFORE INSERT OR UPDATE OF location ON public.venues
  FOR EACH ROW EXECUTE FUNCTION sync_geog_from_location();

-- listings trigger
DROP TRIGGER IF EXISTS trg_listings_sync_geog ON public.listings;
CREATE TRIGGER trg_listings_sync_geog
  BEFORE INSERT OR UPDATE OF location ON public.listings
  FOR EACH ROW EXECUTE FUNCTION sync_geog_from_location();

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Replace get_nearby_listings with PostGIS version
-- Uses ST_DWithin which leverages the spatial index
-- ─────────────────────────────────────────────────────────────

-- Drop and recreate with new return type (distance is now from PostGIS)
DROP FUNCTION IF EXISTS get_nearby_listings(double precision, double precision, integer, text);

CREATE OR REPLACE FUNCTION get_nearby_listings(
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  radius_metres INTEGER  DEFAULT 10000,
  listing_type  TEXT     DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  venue_id        UUID,
  owner_id        UUID,
  type            TEXT,
  title           TEXT,
  description     TEXT,
  address         TEXT,
  location        JSONB,
  images          TEXT[],
  status          TEXT,
  view_count      INTEGER,
  save_count      INTEGER,
  event_date      TIMESTAMPTZ,
  event_end_date  TIMESTAMPTZ,
  entry_fee       TEXT,
  dress_code      TEXT,
  artist          TEXT,
  age_restriction TEXT,
  tags            TEXT[],
  capacity        INTEGER,
  cuisine_type    TEXT,
  opening_hours   TEXT,
  price_range     TEXT,
  special         TEXT,
  vibe            TEXT[],
  when_chip       TEXT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  distance_metres DOUBLE PRECISION,
  venue_name      TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    l.id, l.venue_id, l.owner_id, l.type, l.title, l.description,
    l.address, l.location, l.images, l.status, l.view_count, l.save_count,
    l.event_date, l.event_end_date, l.entry_fee, l.dress_code, l.artist,
    l.age_restriction, l.tags, l.capacity, l.cuisine_type, l.opening_hours,
    l.price_range, l.special, l.vibe, l.when_chip, l.created_at, l.updated_at,
    ST_Distance(
      l.geog,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_metres,
    v.name AS venue_name
  FROM  public.listings l
  JOIN  public.venues   v ON v.id = l.venue_id
  WHERE l.status = 'active'
    AND l.geog IS NOT NULL
    AND (listing_type IS NULL OR l.type = listing_type)
    AND ST_DWithin(
      l.geog,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_metres
    )
  ORDER BY distance_metres ASC;
$$;

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────
--
-- The JSONB location column is kept for backwards compatibility.
-- Frontend code can continue using location.lat/location.lng.
-- The geog column is automatically synced via trigger.
--
-- ST_DWithin uses the spatial index (GIST) for fast filtering.
-- ST_Distance computes exact distance in metres.
--
-- To query directly with PostGIS:
--   SELECT * FROM listings
--   WHERE ST_DWithin(geog, ST_MakePoint(28.0, -26.0)::geography, 5000);
--
