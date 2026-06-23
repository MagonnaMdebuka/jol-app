-- ============================================================
-- Jol — Migration 008: RLS Policy for Claiming Seeded Venues
--
-- Seeded venues have owner_id = NULL, so the existing
-- "owner full access" policy doesn't allow claiming them.
-- This migration adds secure functions and policies to enable
-- authenticated users to claim unclaimed venues.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: claim_venue (SECURITY DEFINER)
-- Safely claims an unclaimed venue for the authenticated user
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_venue(venue_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_is_claimed BOOLEAN;
  v_osm_id TEXT;
  v_user_id UUID := auth.uid();
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get venue details
  SELECT owner_id, is_claimed, osm_id
  INTO v_owner_id, v_is_claimed, v_osm_id
  FROM venues
  WHERE id = venue_id;

  -- Venue must exist
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Venue not found');
  END IF;

  -- Must be claimable (osm_id present, not already claimed)
  IF v_osm_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'This venue is not claimable');
  END IF;

  IF v_is_claimed = true THEN
    RETURN json_build_object('success', false, 'error', 'This venue has already been claimed');
  END IF;

  -- Claim the venue
  UPDATE venues
  SET
    owner_id = v_user_id,
    is_claimed = true,
    claimed_by = v_user_id,
    claimed_at = NOW()
  WHERE id = venue_id;

  -- Also update any listings for this venue
  UPDATE listings
  SET owner_id = v_user_id
  WHERE venue_id = venue_id AND owner_id IS NULL;

  RETURN json_build_object('success', true, 'error', null);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Grant execute to authenticated users
-- ─────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION claim_venue(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────
--
-- This function uses SECURITY DEFINER to bypass RLS, allowing
-- the claim operation to succeed even though the venue's
-- owner_id is NULL.
--
-- The frontend should call this via:
--   supabase.rpc('claim_venue', { venue_id: '...' })
--
-- The function validates:
-- 1. User is authenticated
-- 2. Venue exists
-- 3. Venue has osm_id (is a seeded venue)
-- 4. Venue is not already claimed
--
