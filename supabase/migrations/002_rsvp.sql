-- ============================================================
-- Jol — Nightlife & Food Discovery App
-- Migration 002: Event RSVP / Interested (IDEMPOTENT)
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE
-- ============================================================

-- ═════════════════════════════════════════════════════════════
-- TABLE: interested_listings
-- Tracks which users are interested in attending an event
-- Similar to saved_listings but specifically for event RSVP
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.interested_listings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  listing_id UUID        NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- Add interested_count column to listings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name = 'interested_count'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN interested_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Keep listings.interested_count accurate automatically
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_interested_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interested_count ON public.interested_listings;
CREATE TRIGGER trg_interested_count
  AFTER INSERT OR DELETE ON public.interested_listings
  FOR EACH ROW EXECUTE FUNCTION sync_interested_count();

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_interested_listings_user    ON public.interested_listings (user_id);
CREATE INDEX IF NOT EXISTS idx_interested_listings_listing ON public.interested_listings (listing_id);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.interested_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interested_listings: own" ON public.interested_listings;
CREATE POLICY "interested_listings: own"
  ON public.interested_listings FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Update get_nearby_listings RPC to include interested_count
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_nearby_listings(
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  radius_metres INTEGER  DEFAULT 10000,
  listing_type  TEXT     DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  venue_id         UUID,
  owner_id         UUID,
  type             TEXT,
  title            TEXT,
  description      TEXT,
  address          TEXT,
  location         JSONB,
  images           TEXT[],
  status           TEXT,
  view_count       INTEGER,
  save_count       INTEGER,
  interested_count INTEGER,
  event_date       TIMESTAMPTZ,
  event_end_date   TIMESTAMPTZ,
  entry_fee        TEXT,
  dress_code       TEXT,
  artist           TEXT,
  age_restriction  TEXT,
  tags             TEXT[],
  capacity         INTEGER,
  cuisine_type     TEXT,
  opening_hours    TEXT,
  price_range      TEXT,
  special          TEXT,
  vibe             TEXT[],
  when_chip        TEXT,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  distance_metres  DOUBLE PRECISION,
  venue_name       TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    l.id, l.venue_id, l.owner_id, l.type, l.title, l.description,
    l.address, l.location, l.images, l.status, l.view_count, l.save_count,
    l.interested_count,
    l.event_date, l.event_end_date, l.entry_fee, l.dress_code, l.artist,
    l.age_restriction, l.tags, l.capacity, l.cuisine_type, l.opening_hours,
    l.price_range, l.special, l.vibe, l.when_chip, l.created_at, l.updated_at,
    (
      6371000 * ACOS(
        LEAST(1.0,
          COS(RADIANS(lat))
          * COS(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
          * COS(RADIANS((l.location->>'lng')::DOUBLE PRECISION) - RADIANS(lng))
          + SIN(RADIANS(lat))
          * SIN(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
        )
      )
    ) AS distance_metres,
    v.name AS venue_name
  FROM  public.listings l
  JOIN  public.venues   v ON v.id = l.venue_id
  WHERE l.status = 'active'
    AND (listing_type IS NULL OR l.type = listing_type)
    AND (
      6371000 * ACOS(
        LEAST(1.0,
          COS(RADIANS(lat))
          * COS(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
          * COS(RADIANS((l.location->>'lng')::DOUBLE PRECISION) - RADIANS(lng))
          + SIN(RADIANS(lat))
          * SIN(RADIANS((l.location->>'lat')::DOUBLE PRECISION))
        )
      )
    ) <= radius_metres
  ORDER BY distance_metres ASC;
$$;
