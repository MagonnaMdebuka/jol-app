-- ============================================================
-- Jol — Migration 009: Secure Function Search Paths
--
-- Fixes the "Function Search Path Mutable" security vulnerability
-- by setting immutable search_path on all functions.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run — uses CREATE OR REPLACE
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: set_updated_at (001)
-- Auto-stamp updated_at on any row change
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: handle_new_user (001)
-- Auto-create profile row on user signup
-- SECURITY DEFINER — must have search_path set
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_save_count (001)
-- Keep listings.save_count accurate automatically
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: auto_review_listing (001)
-- After 3 pending reports → set listing to under_review
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_review_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM public.reports
  WHERE listing_id = NEW.listing_id
    AND status = 'pending';

  IF pending_count >= 3 THEN
    UPDATE public.listings
    SET status = 'under_review'
    WHERE id = NEW.listing_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: increment_view_count (001)
-- Increment listing view counter
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id UUID)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_interested_count (002)
-- Keep listings.interested_count accurate automatically
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_interested_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET interested_count = interested_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET interested_count = GREATEST(interested_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: sync_geog_from_location (004)
-- Auto-populate geog from JSONB location on insert/update
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_geog_from_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: get_nearby_listings (004)
-- PostGIS-based nearby listings query
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_nearby_listings(double precision, double precision, integer, text);

CREATE FUNCTION public.get_nearby_listings(
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
  interested_count INTEGER,
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
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT
    l.id, l.venue_id, l.owner_id, l.type, l.title, l.description,
    l.address, l.location, l.images, l.status, l.view_count, l.save_count,
    l.interested_count,
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
-- FUNCTION: search_listings (006)
-- Text search with PostGIS distance
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_listings(
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
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
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
-- This migration sets search_path on all functions to prevent
-- the "Function Search Path Mutable" security vulnerability.
--
-- For trigger functions (plpgsql): SET search_path = ''
--   - Empty path forces fully qualified table names (public.*)
--   - All our trigger functions already use public.* references
--
-- For SECURITY DEFINER functions: SET search_path = public
--   - These need the schema accessible for auth.uid() etc.
--   - Still prevents search_path injection attacks
--
-- The claim_venue function from migration 008 already had
-- SET search_path = public, so it's not included here.
--
