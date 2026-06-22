-- ============================================================
-- Jol — Migration 006: Search Listings Function
--
-- Creates an RPC for text-based search with PostGIS distance
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- RPC: search_listings
-- Text search with distance calculation using PostGIS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_listings(
  search_query  TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  radius_metres INTEGER  DEFAULT 20000,
  result_limit  INTEGER  DEFAULT 50
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
    AND (
      l.title ILIKE search_query
      OR l.description ILIKE search_query
      OR l.address ILIKE search_query
      OR l.cuisine_type ILIKE search_query
      OR v.name ILIKE search_query
      OR EXISTS (
        SELECT 1 FROM unnest(l.tags) AS t WHERE t ILIKE search_query
      )
      OR EXISTS (
        SELECT 1 FROM unnest(l.vibe) AS vi WHERE vi ILIKE search_query
      )
    )
    AND ST_DWithin(
      l.geog,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_metres
    )
  ORDER BY distance_metres ASC
  LIMIT result_limit;
$$;

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────
--
-- This function searches across:
-- - title
-- - description
-- - address
-- - cuisine_type
-- - venue name
-- - tags array
-- - vibe array
--
-- Results are filtered by radius and sorted by distance.
--
-- The search_query parameter should include % wildcards:
--   e.g., '%pizza%' to find any listing containing "pizza"
--
