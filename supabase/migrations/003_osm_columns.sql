-- ============================================================
-- Jol — Migration 003: OSM Seeding Support
--
-- Adds columns needed for OSM data seeding and "Claim Your Venue"
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- venues: Add OSM tracking and claim status columns
-- ─────────────────────────────────────────────────────────────

-- osm_id: Stores the OpenStreetMap node ID (e.g., "osm-12345")
-- Used to deduplicate when re-running the seed script
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS osm_id TEXT UNIQUE;

-- is_claimed: Whether an owner has claimed this venue
-- Seeded venues start as unclaimed (false)
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT TRUE;

-- claimed_by: Profile ID of the owner who claimed (if different from creator)
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles(id);

-- claimed_at: When the venue was claimed
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- Update default for is_claimed on seeded data
-- Existing venues (owner-created) should be claimed
-- Only seeded venues (with osm_id) should be unclaimed
-- ─────────────────────────────────────────────────────────────

-- Mark all existing venues as claimed (they were created by owners)
UPDATE public.venues
SET is_claimed = TRUE
WHERE is_claimed IS NULL OR osm_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- Index for faster OSM ID lookups during seeding
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_venues_osm_id ON public.venues (osm_id);
CREATE INDEX IF NOT EXISTS idx_venues_is_claimed ON public.venues (is_claimed);

-- ─────────────────────────────────────────────────────────────
-- RLS: Allow reading unclaimed venues publicly
-- (Already covered by "venues: public read active" policy)
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- Jol Admin profile for seeded venues
-- This is a placeholder owner for OSM-seeded venues
-- ─────────────────────────────────────────────────────────────
-- Note: You need to create this user via Supabase Auth first,
-- then the profile will be auto-created by the trigger.
-- Alternatively, insert directly (bypassing RLS with service role):
--
-- INSERT INTO public.profiles (id, display_name, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'Jol Admin',
--   'admin'
-- ) ON CONFLICT (id) DO NOTHING;
