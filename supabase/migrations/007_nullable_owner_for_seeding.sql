-- ============================================================
-- Jol — Migration 007: Nullable owner_id for Seeded Data
--
-- Allows venues and listings to have null owner_id for OSM-seeded
-- data that hasn't been claimed by an owner yet.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- venues: Make owner_id nullable
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.venues
ALTER COLUMN owner_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- listings: Make owner_id nullable
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.listings
ALTER COLUMN owner_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- Update RLS policies to allow reading seeded listings
-- (Already covered by existing policies, but let's be explicit)
-- ─────────────────────────────────────────────────────────────

-- Seeded venues (owner_id IS NULL) should be publicly readable
-- The existing "venues: public read active" policy covers this

-- Seeded listings (owner_id IS NULL) should be publicly readable
-- The existing "listings: public read" policy covers this

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────
--
-- After running this migration, the seed script can insert
-- venues and listings with owner_id = NULL.
--
-- When an owner claims a seeded venue, the owner_id should be
-- updated to their profile ID.
--
